import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { CreateLotDto } from './dto/create-lot.dto'
import { AssignZoneDto } from './dto/assign-zone.dto'
import { LotStatus } from '@prisma/client'

@Injectable()
export class LotsService {
  constructor(private prisma: PrismaService) { }

  // auto-generate batchId format: B{YYMMDD}{4-digit seq}
  private async generateBatchId(): Promise<string> {
    const now = new Date()
    const yy = String(now.getFullYear()).slice(2)
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const prefix = `B${yy}${mm}${dd}`

    const count = await this.prisma.lot.count({
      where: { batchId: { startsWith: prefix } },
    })

    const seq = String(count + 1).padStart(4, '0')
    return `${prefix}${seq}`
  }

  async create(dto: CreateLotDto, actorId: string) {
    const existing = await this.prisma.lot.findUnique({
      where: { lotNumber: dto.lotNumber },
    })
    if (existing) throw new ConflictException(`Lot number ${dto.lotNumber} มีอยู่แล้ว`)

    const batchId = await this.generateBatchId()

    const lot = await this.prisma.lot.create({
      data: {
        lotNumber: dto.lotNumber,
        batchId,
        supplier: dto.supplier,
        weightKg: dto.weightKg,
        remainingKg: dto.weightKg,  // เริ่มต้น remainingKg = weightKg
        receivedAt: new Date(dto.receivedAt),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null, 
        status: 'IN_FREEZER',
      },
    })

    await this.prisma.ledger.create({
      data: {
        eventType: 'RECEIVE',
        lotId: lot.id,
        weightKg: lot.weightKg,
        actorId,
        note: `รับสินค้าเข้า Lot ${lot.lotNumber} จาก ${lot.supplier}`,
      },
    })

    return lot
  }

  async findAll(status?: LotStatus) {
    return this.prisma.lot.findMany({
      where: status ? { status } : undefined,
      orderBy: { receivedAt: 'desc' },
      include: {
        thawEvents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })
  }

  async findOne(id: string) {
    const lot = await this.prisma.lot.findUnique({
      where: { id },
      include: {
        thawEvents: { orderBy: { createdAt: 'asc' } },
        ledgers: { orderBy: { createdAt: 'asc' } },
      },
    })
    if (!lot) throw new NotFoundException(`ไม่พบ Lot id: ${id}`)
    return lot
  }

  async assignZone(id: string, dto: AssignZoneDto, actorId: string) {
    const lot = await this.prisma.lot.findUnique({ where: { id } })
    if (!lot) throw new NotFoundException(`ไม่พบ Lot id: ${id}`)
    if (lot.status !== 'IN_FREEZER') {
      throw new BadRequestException('สามารถระบุ zone ได้เฉพาะ lot ที่อยู่ในตู้แช่แข็งเท่านั้น')
    }

    const updated = await this.prisma.lot.update({
      where: { id },
      data: { zone: dto.zone },
    })

    await this.prisma.ledger.create({
      data: {
        eventType: 'ASSIGN_ZONE',
        lotId: lot.id,
        weightKg: lot.weightKg,
        actorId,
        note: `ระบุ zone: ${dto.zone}`,
      },
    })

    return updated
  }
}