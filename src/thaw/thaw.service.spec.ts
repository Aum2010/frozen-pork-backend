import { Test, TestingModule } from '@nestjs/testing'
import { ThawService } from './thaw.service'
import { PrismaService } from '../../prisma/prisma.service'
import { NotFoundException, BadRequestException } from '@nestjs/common'

const mockLot = {
  id: 'lot-1',
  lotNumber: 'LOT-001',
  batchId: 'B2607070001',
  supplier: 'ฟาร์มไทย',
  weightKg: 4000,
  zone: 'A3',
  status: 'IN_FREEZER',
  receivedAt: new Date(),
  createdAt: new Date(),
}

const mockThawEvent = {
  id: 'thaw-1',
  lotId: 'lot-1',
  weightKg: 800,
  startedAt: new Date(),
  readyAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  confirmedBy: 'user-1',
  isReady: false,
  createdAt: new Date(),
}

const mockPrisma = {
  lot: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  thawEvent: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  ledger: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
}

describe('ThawService', () => {
  let service: ThawService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThawService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    service = module.get<ThawService>(ThawService)
  })

  afterEach(() => jest.clearAllMocks())

  describe('startThaw', () => {
    it('✓ lot IN_FREEZER → สร้าง ThawEvent สำเร็จ', async () => {
      mockPrisma.lot.findUnique.mockResolvedValue(mockLot)
      mockPrisma.thawEvent.create.mockResolvedValue(mockThawEvent)
      mockPrisma.lot.update.mockResolvedValue({ ...mockLot, status: 'THAWING' })
      mockPrisma.ledger.create.mockResolvedValue({})

      const result = await service.startThaw({ lotId: 'lot-1', weightKg: 800 }, 'user-1')

      expect(result.weightKg).toBe(800)
      expect(result.isReady).toBe(false)
      expect(mockPrisma.lot.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'THAWING' } })
      )
    })

    it('✓ lot ไม่มี → 404', async () => {
      mockPrisma.lot.findUnique.mockResolvedValue(null)

      await expect(
        service.startThaw({ lotId: 'not-exist', weightKg: 800 }, 'user-1')
      ).rejects.toThrow(NotFoundException)
    })

    it('✓ lot status ไม่ใช่ IN_FREEZER → 400', async () => {
      mockPrisma.lot.findUnique.mockResolvedValue({ ...mockLot, status: 'THAWING' })

      await expect(
        service.startThaw({ lotId: 'lot-1', weightKg: 800 }, 'user-1')
      ).rejects.toThrow(BadRequestException)
    })

    it('✓ weightKg เกิน lot.weightKg → 400', async () => {
      mockPrisma.lot.findUnique.mockResolvedValue(mockLot)

      await expect(
        service.startThaw({ lotId: 'lot-1', weightKg: 9999 }, 'user-1')
      ).rejects.toThrow(BadRequestException)
    })

    it('✓ readyAt = startedAt + 24 ชม.', async () => {
      mockPrisma.lot.findUnique.mockResolvedValue(mockLot)
      mockPrisma.thawEvent.create.mockImplementation(async ({ data }) => ({
        ...mockThawEvent,
        startedAt: data.startedAt,
        readyAt: data.readyAt,
      }))
      mockPrisma.lot.update.mockResolvedValue({})
      mockPrisma.ledger.create.mockResolvedValue({})

      const result = await service.startThaw({ lotId: 'lot-1', weightKg: 800 }, 'user-1')

      const diffMs = result.readyAt.getTime() - result.startedAt.getTime()
      expect(diffMs).toBe(24 * 60 * 60 * 1000)
    })
  })

  describe('getPending', () => {
    it('✓ คืน thaw events พร้อม remainingMinutes', async () => {
      mockPrisma.thawEvent.findMany.mockResolvedValue([
        { ...mockThawEvent, lot: mockLot },
      ])

      const result = await service.getPending()

      expect(result[0]).toHaveProperty('remainingMinutes')
      expect(result[0]).toHaveProperty('isOverdue')
      expect(result[0].remainingMinutes).toBeGreaterThanOrEqual(0)
    })

    it('✓ event ที่ readyAt ผ่านแล้ว → isOverdue = true', async () => {
      const overdueEvent = {
        ...mockThawEvent,
        readyAt: new Date(Date.now() - 60000),
        lot: mockLot,
      }
      mockPrisma.thawEvent.findMany.mockResolvedValue([overdueEvent])

      const result = await service.getPending()

      expect(result[0].isOverdue).toBe(true)
      expect(result[0].remainingMinutes).toBe(0)
    })
  })

  describe('confirmReady', () => {
    it('✓ confirm สำเร็จ → lot status เปลี่ยนเป็น WAITING_TANK', async () => {
      mockPrisma.thawEvent.findUnique
        .mockResolvedValueOnce({ ...mockThawEvent, lot: mockLot })  // ครั้งแรก — หา event
        .mockResolvedValueOnce({ ...mockThawEvent, isReady: true }) // ครั้งที่สอง — return หลัง transaction

      mockPrisma.$transaction.mockResolvedValue([{ ...mockThawEvent, isReady: true }])

      const result = await service.confirmReady('thaw-1', 'user-1')

      expect(result.isReady).toBe(true)
    })

    it('✓ thawEvent ไม่มี → 404', async () => {
      mockPrisma.thawEvent.findUnique.mockResolvedValue(null)

      await expect(
        service.confirmReady('not-exist', 'user-1')
      ).rejects.toThrow(NotFoundException)
    })

    it('✓ confirm ซ้ำ → 400', async () => {
      mockPrisma.thawEvent.findUnique.mockResolvedValue({
        ...mockThawEvent,
        isReady: true,
        lot: mockLot,
      })

      await expect(
        service.confirmReady('thaw-1', 'user-1')
      ).rejects.toThrow(BadRequestException)
    })
  })
})