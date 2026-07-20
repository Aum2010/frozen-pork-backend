import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { FillTankDto } from './dto/fill-tank.dto'
import { WithdrawTankDto } from './dto/withdraw-tank.dto'

@Injectable()
export class TanksService {
  constructor(private prisma: PrismaService) { }

  async findAll() {
    const tanks = await this.prisma.tank.findMany({
      orderBy: { tankNumber: 'asc' },
      include: {
        tankEntries: {
          where: { emptyAt: null },
          include: {
            thawEvent: {
              include: { lot: true },  // include lot ด้วย
            },
          },
          orderBy: { filledAt: 'asc' },
        },
      },
    })

    // หาถังที่ควรใช้ถัดไป (FIFO = filledAt เก่าสุด)
    const activeTanks = tanks.filter((t) => t.currentWeightKg > 0)
    let fifoTankId: string | null = null
    if (activeTanks.length > 0) {
      const oldest = activeTanks.reduce((prev, curr) => {
        const prevDate = prev.tankEntries[0]?.filledAt ?? new Date()
        const currDate = curr.tankEntries[0]?.filledAt ?? new Date()
        return prevDate < currDate ? prev : curr
      })
      fifoTankId = oldest.id
    }

    return tanks.map((t) => ({
      ...t,
      isFifoNext: t.id === fifoTankId,
    }))
  }

  async getFifoSuggest() {
    const tanks = await this.prisma.tank.findMany({
      where: { currentWeightKg: { gt: 0 } },
      include: {
        tankEntries: {
          where: { emptyAt: null },
          include: { thawEvent: { include: { lot: true } } },
          orderBy: { filledAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'asc' },
    })

    if (tanks.length === 0) {
      throw new NotFoundException('ไม่มีถังที่มีหมูอยู่')
    }

    const fifoTank = tanks.reduce((prev, curr) => {
      const prevDate = prev.tankEntries[0]?.filledAt ?? new Date()
      const currDate = curr.tankEntries[0]?.filledAt ?? new Date()
      return prevDate < currDate ? prev : curr
    })

    return fifoTank
  }

  async fill(tankId: string, dto: FillTankDto, actorId: string) {
    const tank = await this.prisma.tank.findUnique({ where: { id: tankId } })

    if (!tank) throw new NotFoundException(`ไม่พบถัง id: ${tankId}`)

    const thawEvent = await this.prisma.thawEvent.findUnique({
      where: { id: dto.thawEventId },
      include: { lot: true },
    })

    // const thawEvent = activeEntry?.thawEvent ?? null
    if (!thawEvent) throw new NotFoundException(`ไม่พบ ThawEvent id: ${dto.thawEventId}`)
    if (thawEvent.status !== 'WAITING_TANK') {
      throw new BadRequestException(`ThawEvent ยังไม่พร้อมเข้าถัง (status: ${thawEvent.status})`)
    }
    if (dto.weightKg > thawEvent.remainingKg) {
      throw new BadRequestException(
        `น้ำหนักที่ใส่ (${dto.weightKg}) มากกว่าคงเหลือใน ThawEvent (${thawEvent.remainingKg})`
      )
    }

    const newWeight = tank.currentWeightKg + dto.weightKg
    if (newWeight > tank.capacityKg) {
      throw new BadRequestException(`น้ำหนักเกิน capacity (${newWeight} > ${tank.capacityKg} กก.)`)
    }

    const newThawRemaining = thawEvent.remainingKg - dto.weightKg
    const isThawEmpty = newThawRemaining === 0

    await this.prisma.$transaction([
      this.prisma.tankEntry.create({
        data: {
          tankId,
          thawEventId: dto.thawEventId,
          weightKg: dto.weightKg,
          filledAt: new Date(),
        },
      }),
      this.prisma.tank.update({
        where: { id: tankId },
        data: { currentWeightKg: newWeight, status: 'IN_USE' },
      }),
      // ลด remainingKg — เปลี่ยน status เป็น IN_TANK เฉพาะตอนหมดแล้ว
      this.prisma.thawEvent.update({
        where: { id: dto.thawEventId },
        data: {
          remainingKg: newThawRemaining,
          status: isThawEmpty ? 'IN_TANK' : 'WAITING_TANK',
        },
      }),
      this.prisma.ledger.create({
        data: {
          eventType: 'ENTER_TANK',
          lotId: thawEvent.lotId,
          thawEventId: dto.thawEventId,
          weightKg: dto.weightKg,
          actorId,
          note: `เข้าถัง ${tank.tankNumber} — คงเหลือใน ThawEvent: ${newThawRemaining} กก.`,
        },
      }),
    ])

    return this.prisma.tank.findUnique({ where: { id: tankId } })
  }

  async withdraw(tankId: string, dto: WithdrawTankDto, actorId: string) {
    const tank = await this.prisma.tank.findUnique({
      where: { id: tankId },
      include: {
        tankEntries: {
          where: { emptyAt: null },
          include: { thawEvent: true },  // เปลี่ยน
          orderBy: { filledAt: 'asc' },
        },
      },
    })
    if (!tank) throw new NotFoundException(`ไม่พบถัง id: ${tankId}`)
    if (tank.currentWeightKg <= 0) {
      throw new BadRequestException(`ถัง ${tank.tankNumber} ว่างอยู่`)
    }
    if (dto.weightKg > tank.currentWeightKg) {
      throw new BadRequestException(
        `น้ำหนักที่เบิก (${dto.weightKg}) มากกว่าที่มีในถัง (${tank.currentWeightKg})`,
      )
    }

    const newWeight = tank.currentWeightKg - dto.weightKg
    const isEmpty = newWeight === 0
    const activeEntry = tank.tankEntries[0]
    const thawEvent = activeEntry?.thawEvent ?? null  // ← เพิ่ม

    await this.prisma.$transaction([
      this.prisma.tank.update({
        where: { id: tankId },
        data: {
          currentWeightKg: newWeight,
          status: isEmpty ? 'EMPTY' : 'IN_USE',
        },
      }),
      ...(isEmpty && activeEntry
        ? [
          this.prisma.tankEntry.update({
            where: { id: activeEntry.id },
            data: { emptyAt: new Date() },
          }),
          this.prisma.thawEvent.update({
            where: { id: activeEntry.thawEventId },
            data: {
              // ถ้า remainingKg = 0 → USED, ถ้ายังเหลือ → WAITING_TANK
              status: thawEvent?.remainingKg === 0 ? 'USED' : 'WAITING_TANK',
            },
          }),
        ]
        : []),
      this.prisma.ledger.create({
        data: {
          eventType: 'WITHDRAW',
          lotId: activeEntry?.thawEvent?.lotId,
          thawEventId: activeEntry?.thawEventId,
          weightKg: dto.weightKg,
          actorId,
          productionOrder: dto.productionOrder,
          note: `เบิกจากถัง ${tank.tankNumber}`,
        },
      }),
    ])

    return this.prisma.tank.findUnique({ where: { id: tankId } })
  }

  async withdrawAuto(dto: WithdrawTankDto, actorId: string) {
    // หาถังที่มีหมูเรียงตาม FIFO
    const tanks = await this.prisma.tank.findMany({
      where: { currentWeightKg: { gt: 0 } },
      include: {
        tankEntries: {
          where: { emptyAt: null },
          include: { thawEvent: true },
          orderBy: { filledAt: 'asc' },
        },
      },
      orderBy: { updatedAt: 'asc' },
    })

    // คำนวณว่าต้องเบิกจากถังไหนบ้าง
    const totalAvailable = tanks.reduce((s, t) => s + t.currentWeightKg, 0)
    if (dto.weightKg > totalAvailable) {
      throw new BadRequestException(
        `สต็อกในถังไม่พอ — มีทั้งหมด ${totalAvailable} กก. ต้องการ ${dto.weightKg} กก.`
      )
    }

    const plan: { tank: typeof tanks[0]; weightKg: number }[] = []
    let remaining = dto.weightKg

    for (const tank of tanks) {
      if (remaining <= 0) break
      const take = Math.min(tank.currentWeightKg, remaining)
      plan.push({ tank, weightKg: take })
      remaining -= take
    }

    // เบิกตาม plan
    const results: { tankNumber: number; weightKg: number }[] = []
    for (const item of plan) {
      const newWeight = item.tank.currentWeightKg - item.weightKg
      const isEmpty = newWeight === 0
      const activeEntry = item.tank.tankEntries[0]
      const thawEvent = activeEntry?.thawEvent ?? null

      await this.prisma.$transaction([
        this.prisma.tank.update({
          where: { id: item.tank.id },
          data: {
            currentWeightKg: newWeight,
            status: isEmpty ? 'EMPTY' : 'IN_USE',
          },
        }),
        ...(isEmpty && activeEntry
          ? [
            this.prisma.tankEntry.update({
              where: { id: activeEntry.id },
              data: { emptyAt: new Date() },
            }),
            this.prisma.thawEvent.update({
              where: { id: activeEntry.thawEventId },
              data: {
                status: thawEvent?.remainingKg === 0 ? 'USED' : 'WAITING_TANK',
              },
            }),
          ]
          : []),
        this.prisma.ledger.create({
          data: {
            eventType: 'WITHDRAW',
            lotId: activeEntry?.thawEvent?.lotId,
            thawEventId: activeEntry?.thawEventId,
            weightKg: item.weightKg,
            actorId,
            productionOrder: dto.productionOrder,
            note: `Auto เบิกจากถัง ${item.tank.tankNumber}`,
          },
        }),
      ])

      results.push({ tankNumber: item.tank.tankNumber, weightKg: item.weightKg })
    }

    return {
      totalWeightKg: dto.weightKg,
      plan: results,
    }
  }
}