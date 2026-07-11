import { Test, TestingModule } from '@nestjs/testing'
import { LedgerService } from './ledger.service'
import { PrismaService } from '../../prisma/prisma.service'
import { NotFoundException } from '@nestjs/common'

const mockLot = {
  id: 'lot-1',
  lotNumber: 'LOT-001',
  batchId: 'B2607070001',
  supplier: 'ฟาร์มไทย',
  weightKg: 4000,
  zone: 'A3',
  status: 'IN_FREEZER',
  receivedAt: new Date('2026-07-07'),
  createdAt: new Date('2026-07-07'),
}

const mockLedgerEntry = {
  id: 'ledger-1',
  eventType: 'RECEIVE',
  lotId: 'lot-1',
  lot: mockLot,
  tankEntryId: null,
  weightKg: 4000,
  actorId: 'user-1',
  productionOrder: null,
  note: 'รับสินค้า',
  createdAt: new Date('2026-07-07'),
}

const mockPrisma = {
  ledger: { findMany: jest.fn() },
  lot: { findUnique: jest.fn() },
  thawEvent: { findMany: jest.fn() },
  tankEntry: { findMany: jest.fn() },
}

describe('LedgerService', () => {
  let service: LedgerService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LedgerService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    service = module.get<LedgerService>(LedgerService)
  })

  afterEach(() => jest.clearAllMocks())

  // ── findAll ──────────────────────────────────────────

  describe('findAll', () => {
    it('✓ ไม่ส่ง filter → คืน ledger ทั้งหมด', async () => {
      mockPrisma.ledger.findMany.mockResolvedValue([mockLedgerEntry])

      const result = await service.findAll({})

      expect(mockPrisma.ledger.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} })
      )
      expect(result).toHaveLength(1)
    })

    it('✓ filter lotId → where มี lotId', async () => {
      mockPrisma.ledger.findMany.mockResolvedValue([mockLedgerEntry])

      await service.findAll({ lotId: 'lot-1' })

      expect(mockPrisma.ledger.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { lotId: 'lot-1' } })
      )
    })

    it('✓ filter eventType → where มี eventType', async () => {
      mockPrisma.ledger.findMany.mockResolvedValue([mockLedgerEntry])

      await service.findAll({ eventType: 'RECEIVE' })

      expect(mockPrisma.ledger.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { eventType: 'RECEIVE' } })
      )
    })

    it('✓ filter startDate + endDate → where มี createdAt range', async () => {
      mockPrisma.ledger.findMany.mockResolvedValue([])

      await service.findAll({ startDate: '2026-07-01', endDate: '2026-07-31' })

      expect(mockPrisma.ledger.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            createdAt: expect.objectContaining({
              gte: expect.any(Date),
              lte: expect.any(Date),
            }),
          }),
        })
      )
    })
  })

  // ── getTimeline ──────────────────────────────────────

  describe('getTimeline', () => {
    it('✓ lotId ถูก → คืน timeline เรียงตาม date', async () => {
      mockPrisma.lot.findUnique.mockResolvedValue(mockLot)
      mockPrisma.ledger.findMany.mockResolvedValue([mockLedgerEntry])
      mockPrisma.thawEvent.findMany.mockResolvedValue([])
      mockPrisma.tankEntry.findMany.mockResolvedValue([])

      const result = await service.getTimeline('lot-1')

      expect(result.lot.id).toBe('lot-1')
      expect(result.timeline).toBeDefined()
      expect(Array.isArray(result.timeline)).toBe(true)
      expect(result.timeline[0].step).toBe('RECEIVE')
    })

    it('✓ timeline เรียง date จากน้อยไปมาก', async () => {
      const thawDate = new Date('2026-07-10')
      mockPrisma.lot.findUnique.mockResolvedValue(mockLot)
      mockPrisma.ledger.findMany.mockResolvedValue([])
      mockPrisma.thawEvent.findMany.mockResolvedValue([{
        id: 'thaw-1',
        lotId: 'lot-1',
        weightKg: 800,
        startedAt: thawDate,
        readyAt: new Date('2026-07-11'),
        confirmedBy: 'user-1',
        isReady: false,
        createdAt: thawDate,
      }])
      mockPrisma.tankEntry.findMany.mockResolvedValue([])

      const result = await service.getTimeline('lot-1')

      const dates = result.timeline.map((t) => new Date(t.date).getTime())
      expect(dates).toEqual([...dates].sort((a, b) => a - b))
    })

    it('✓ lotId ไม่มี → 404', async () => {
      mockPrisma.lot.findUnique.mockResolvedValue(null)

      await expect(service.getTimeline('not-exist')).rejects.toThrow(NotFoundException)
    })
  })

  // ── exportCsv ────────────────────────────────────────

  describe('exportCsv', () => {
    it('✓ คืน CSV string พร้อม headers', async () => {
      mockPrisma.ledger.findMany.mockResolvedValue([mockLedgerEntry])

      const result = await service.exportCsv({})

      expect(typeof result).toBe('string')
      expect(result).toContain('eventType')
      expect(result).toContain('lotNumber')
      expect(result).toContain('weightKg')
    })

    it('✓ ไม่มีข้อมูล → คืน CSV ที่มีแค่ header', async () => {
      mockPrisma.ledger.findMany.mockResolvedValue([])

      const result = await service.exportCsv({})

      expect(typeof result).toBe('string')
      expect(result).toContain('eventType')
    })
  })
})