import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { EventType } from '@prisma/client'
import { Parser } from 'json2csv'

@Injectable()
export class LedgerService {
  constructor(private prisma: PrismaService) { }

  async findAll(filters: {
    lotId?: string
    eventType?: EventType
    startDate?: string
    endDate?: string
  }) {
    const where: any = {}

    if (filters.lotId) where.lotId = filters.lotId
    if (filters.eventType) where.eventType = filters.eventType
    if (filters.startDate || filters.endDate) {
      where.createdAt = {}
      if (filters.startDate) where.createdAt.gte = new Date(filters.startDate)
      if (filters.endDate) where.createdAt.lte = new Date(filters.endDate)
    }

    return this.prisma.ledger.findMany({
      where,
      include: { lot: true },
      orderBy: { createdAt: 'asc' },
    })
  }

  async getTimeline(lotId: string) {
    const lot = await this.prisma.lot.findUnique({ where: { id: lotId } })
    if (!lot) throw new NotFoundException(`ไม่พบ Lot id: ${lotId}`)

    const [ledgers, thawEvents] = await Promise.all([
      this.prisma.ledger.findMany({
        where: { lotId },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.thawEvent.findMany({
        where: { lotId },
        include: {
          tankEntries: {
            include: { tank: true },  // include tank ใน thawEvent
          },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ])

    const tankEntryEvents = thawEvents.flatMap((te) =>
      te.tankEntries.map((entry) => ({
        step: 'ENTER_TANK',
        label: 'เข้าถัง',
        date: entry.filledAt,
        weightKg: entry.weightKg,
        detail: `ถัง ${entry.tank.tankNumber}`,
      }))
    )

    return {
      lot,
      timeline: [
        {
          step: 'RECEIVE',
          label: 'รับเข้าระบบ',
          date: lot.receivedAt,
          weightKg: lot.weightKg,
          detail: `Supplier: ${lot.supplier} | Zone: ${lot.zone ?? '-'}`,
        },
        ...thawEvents.map((e) => ({
          step: 'START_THAW',
          label: 'เริ่มละลาย',
          date: e.startedAt,
          weightKg: e.weightKg,
          detail: `พร้อมเข้าถัง: ${e.readyAt.toISOString()}`,
        })),
        ...tankEntryEvents,
        ...ledgers
          .filter((l) => l.eventType === 'WITHDRAW')
          .map((l) => ({
            step: 'WITHDRAW',
            label: 'นำไปผลิต',
            date: l.createdAt,
            weightKg: l.weightKg,
            detail: `Production Order: ${l.productionOrder ?? '-'}`,
          })),
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    }
  }

  async exportCsv(filters: {
    lotId?: string
    startDate?: string
    endDate?: string
  }): Promise<string> {
    const records = await this.findAll(filters)

    const data = records.map((r) => ({
      date: r.createdAt.toISOString(),
      eventType: r.eventType,
      lotNumber: r.lot?.lotNumber ?? '-',
      batchId: r.lot?.batchId ?? '-',
      weightKg: r.weightKg,
      actorId: r.actorId,
      productionOrder: r.productionOrder ?? '-',
      note: r.note ?? '-',
    }))

    const parser = new Parser({
      fields: [
        'date',
        'eventType',
        'lotNumber',
        'batchId',
        'weightKg',
        'actorId',
        'productionOrder',
        'note',
      ],
      withBOM: true,
    })

    return parser.parse(data)
  }
}