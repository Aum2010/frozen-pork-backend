import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateThawDto } from './dto/create-thaw.dto'

@Injectable()
export class ThawService {
  constructor(private prisma: PrismaService) { }

  async startThaw(dto: CreateThawDto, actorId: string) {
    const lot = await this.prisma.lot.findUnique({ where: { id: dto.lotId } })
    if (!lot) throw new NotFoundException(`ไม่พบ Lot id: ${dto.lotId}`)

    if (lot.status === 'USED') {
      throw new BadRequestException('Lot นี้ใช้หมดแล้ว')
    }
    if (lot.remainingKg <= 0) {
      throw new BadRequestException('ไม่มีน้ำหนักคงเหลือในตู้แช่แข็ง')
    }
    if (dto.weightKg > lot.remainingKg) {
      throw new BadRequestException(
        `น้ำหนักที่ละลาย (${dto.weightKg}) มากกว่าคงเหลือ (${lot.remainingKg})`
      )
    }

    const startedAt = new Date()
    const thawMinutes = process.env.THAW_DURATION_MINUTES
      ? parseInt(process.env.THAW_DURATION_MINUTES)
      : 24 * 60
    const readyAt = new Date(startedAt.getTime() + thawMinutes * 60 * 1000)

    const newRemainingKg = lot.remainingKg - dto.weightKg
    const newLotStatus = newRemainingKg === 0 ? 'FULLY_THAWING' : 'PARTIALLY_THAWING'

    const [thawEvent] = await this.prisma.$transaction([
      this.prisma.thawEvent.create({
        data: {
          lotId: lot.id,
          weightKg: dto.weightKg,
          remainingKg: dto.weightKg,
          startedAt,
          readyAt,
          confirmedBy: actorId,
          status: 'THAWING',
        },
      }),
      this.prisma.lot.update({
        where: { id: lot.id },
        data: {
          remainingKg: newRemainingKg,
          status: newLotStatus,
        },
      }),
      this.prisma.ledger.create({
        data: {
          eventType: 'START_THAW',
          lotId: lot.id,
          weightKg: dto.weightKg,
          actorId,
          note: `แบ่งละลาย ${dto.weightKg} กก. จาก ${lot.weightKg} กก. — คงเหลือ ${newRemainingKg} กก.`,
        },
      }),
    ])

    return thawEvent
  }

  async getPending() {
    const events = await this.prisma.thawEvent.findMany({
      where: { status: 'THAWING' },
      include: { lot: true },
      orderBy: { startedAt: 'asc' },
    })

    const now = new Date()
    return events.map((e) => ({
      ...e,
      remainingMinutes: Math.max(
        0,
        Math.round((e.readyAt.getTime() - now.getTime()) / 60000)
      ),
      isOverdue: now > e.readyAt,
    }))
  }

  async confirmReady(thawEventId: string, actorId: string) {
    const event = await this.prisma.thawEvent.findUnique({
      where: { id: thawEventId },
      include: { lot: true },
    })
    if (!event) throw new NotFoundException(`ไม่พบ ThawEvent id: ${thawEventId}`)
    if (event.status !== 'THAWING') {
      throw new BadRequestException(`ThawEvent นี้ไม่ได้อยู่ในสถานะ THAWING (status: ${event.status})`)
    }

    await this.prisma.$transaction([
      this.prisma.thawEvent.update({
        where: { id: thawEventId },
        data: { status: 'WAITING_TANK' },
      }),
      this.prisma.ledger.create({
        data: {
          eventType: 'START_THAW',
          lotId: event.lotId,
          weightKg: event.weightKg,
          actorId,
          note: 'ยืนยันละลายแล้ว — รอเข้าถัง',
        },
      }),
    ])

    return this.prisma.thawEvent.findUnique({ where: { id: thawEventId } })
  }

  async patchReadyAt(thawEventId: string) {
    const event = await this.prisma.thawEvent.findUnique({
      where: { id: thawEventId },
    })
    if (!event) throw new NotFoundException(`ไม่พบ ThawEvent id: ${thawEventId}`)

    return this.prisma.thawEvent.update({
      where: { id: thawEventId },
      data: { readyAt: new Date(Date.now() - 5000) },
    })
  }

  async getWaitingTank() {
    return this.prisma.thawEvent.findMany({
      where: { status: 'WAITING_TANK' },
      include: { lot: true },
      orderBy: { startedAt: 'asc' },
    })
  }

  async startThawAuto(totalWeightKg: number, actorId: string) {
    // หา lots เรียงจากเก่าสุด ที่ยังมี remainingKg
    const lots = await this.prisma.lot.findMany({
      where: {
        status: { in: ['IN_FREEZER', 'PARTIALLY_THAWING'] },
        remainingKg: { gt: 0 },
      },
      orderBy: { receivedAt: 'asc' },
    })

    // คำนวณว่าต้องใช้ lot ไหนบ้าง
    const plan: { lotId: string; weightKg: number }[] = []
    let remaining = totalWeightKg

    for (const lot of lots) {
      if (remaining <= 0) break
      const take = Math.min(lot.remainingKg, remaining)
      plan.push({ lotId: lot.id, weightKg: take })
      remaining -= take
    }

    if (remaining > 0) {
      throw new BadRequestException(
        `สต็อกไม่พอ — ขาดอีก ${remaining} กก. (มีทั้งหมด ${totalWeightKg - remaining} กก.)`
      )
    }

    // สร้าง ThawEvent ตาม plan
    const thawMinutes = process.env.THAW_DURATION_MINUTES
      ? parseInt(process.env.THAW_DURATION_MINUTES)
      : 24 * 60

    const startedAt = new Date()
    const readyAt = new Date(startedAt.getTime() + thawMinutes * 60 * 1000)
    const results: {
      lot: string
      weightKg: number
      thawEvent: {
        id: string
        lotId: string
        weightKg: number
        remainingKg: number
        startedAt: Date
        readyAt: Date
        confirmedBy: string
        status: string
        createdAt: Date
      }
    }[] = []

    for (const item of plan) {
      const lot = lots.find((l) => l.id === item.lotId)!
      const newRemainingKg = lot.remainingKg - item.weightKg
      const newLotStatus = newRemainingKg === 0 ? 'FULLY_THAWING' : 'PARTIALLY_THAWING'

      const [thawEvent] = await this.prisma.$transaction([
        this.prisma.thawEvent.create({
          data: {
            lotId: item.lotId,
            weightKg: item.weightKg,
            remainingKg: item.weightKg,
            startedAt,
            readyAt,
            confirmedBy: actorId,
            status: 'THAWING',
          },
        }),
        this.prisma.lot.update({
          where: { id: item.lotId },
          data: {
            remainingKg: newRemainingKg,
            status: newLotStatus,
          },
        }),
        this.prisma.ledger.create({
          data: {
            eventType: 'START_THAW',
            lotId: item.lotId,
            weightKg: item.weightKg,
            actorId,
            note: `Auto thaw ${item.weightKg} กก. จาก ${lot.lotNumber} — คงเหลือ ${newRemainingKg} กก.`,
          },
        }),
      ])

      results.push({ lot: lot.lotNumber, weightKg: item.weightKg, thawEvent })
    }

    return {
      totalWeightKg,
      plan: results.map((r) => ({ lot: r.lot, weightKg: r.weightKg })),
      thawEvents: results.map((r) => r.thawEvent),
    }
  }
}