import { Test, TestingModule } from '@nestjs/testing'
import { SmartAdvisoryService } from './smart-advisory.service'
import { PrismaService } from '../../prisma/prisma.service'

const mockLotInFreezer = (weightKg: number) => ({
  id: `lot-${Math.random()}`,
  weightKg,
  status: 'IN_FREEZER',
})

const mockThawEvent = (isReady: boolean, weightKg: number, minutesFromNow: number) => ({
  id: `thaw-${Math.random()}`,
  weightKg,
  isReady,
  readyAt: new Date(Date.now() + minutesFromNow * 60000),
  lot: { id: 'lot-1' },
})

const mockPrisma = {
  lot: { findMany: jest.fn() },
  thawEvent: { findMany: jest.fn() },
}

describe('SmartAdvisoryService', () => {
  let service: SmartAdvisoryService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmartAdvisoryService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    service = module.get<SmartAdvisoryService>(SmartAdvisoryService)
  })

  afterEach(() => jest.clearAllMocks())

  // ── checkReorderPoint ─────────────────────────────────

  describe('checkReorderPoint', () => {
    it('✓ stock 800 กก., usage 800/วัน → daysLeft = 1 → shouldReorder = true', async () => {
      mockPrisma.lot.findMany.mockResolvedValue([mockLotInFreezer(800)])

      const result = await service.checkReorderPoint()

      expect(result.daysLeft).toBe(1)
      expect(result.shouldReorder).toBe(true)
      expect(result.recommendedOrderKg).toBe(4000)
    })

    it('✓ stock 4000 กก., usage 800/วัน → daysLeft = 5 → shouldReorder = false', async () => {
      mockPrisma.lot.findMany.mockResolvedValue([mockLotInFreezer(4000)])

      const result = await service.checkReorderPoint()

      expect(result.daysLeft).toBe(5)
      expect(result.shouldReorder).toBe(false)
      expect(result.recommendedOrderKg).toBe(0)
    })

    it('✓ stock 0 กก. → daysLeft = 0 → shouldReorder = true', async () => {
      mockPrisma.lot.findMany.mockResolvedValue([])

      const result = await service.checkReorderPoint()

      expect(result.daysLeft).toBe(0)
      expect(result.shouldReorder).toBe(true)
    })

    it('✓ stock 2400 กก. → daysLeft = 3 → shouldReorder = true (borderline)', async () => {
      mockPrisma.lot.findMany.mockResolvedValue([mockLotInFreezer(2400)])

      const result = await service.checkReorderPoint()

      expect(result.daysLeft).toBe(3)
      expect(result.shouldReorder).toBe(true)
    })
  })

  // ── checkThawReminder ─────────────────────────────────

  describe('checkThawReminder', () => {
    it('✓ ไม่มีอะไรละลายอยู่ → shouldThaw = true', async () => {
      mockPrisma.thawEvent.findMany.mockResolvedValue([])

      const result = await service.checkThawReminder()

      expect(result.shouldThaw).toBe(true)
      expect(result.recommendedWeightKg).toBe(800)
    })

    it('✓ กำลังละลาย 800 กก. เพียงพอแล้ว → shouldThaw = false', async () => {
      mockPrisma.thawEvent.findMany.mockResolvedValue([
        mockThawEvent(false, 800, 60),
      ])

      const result = await service.checkThawReminder()

      expect(result.shouldThaw).toBe(false)
      expect(result.recommendedWeightKg).toBe(0)
    })

    it('✓ กำลังละลาย 400 กก. ไม่พอ → shouldThaw = true', async () => {
      mockPrisma.thawEvent.findMany.mockResolvedValue([
        mockThawEvent(false, 400, 60),
      ])

      const result = await service.checkThawReminder()

      expect(result.shouldThaw).toBe(true)
      expect(result.recommendedWeightKg).toBe(400)
    })
  })

  // ── checkTankReady ────────────────────────────────────

  describe('checkTankReady', () => {
    it('✓ มี ThawEvent ที่ readyAt ผ่านแล้ว → readyCount > 0', async () => {
      mockPrisma.thawEvent.findMany.mockResolvedValue([
        mockThawEvent(false, 800, -60), // ผ่านไปแล้ว 60 นาที
      ])

      const result = await service.checkTankReady()

      expect(result.readyCount).toBe(1)
    })

    it('✓ ไม่มี ThawEvent พร้อม → readyCount = 0', async () => {
      mockPrisma.thawEvent.findMany.mockResolvedValue([])

      const result = await service.checkTankReady()

      expect(result.readyCount).toBe(0)
    })
  })

  // ── getStatus ─────────────────────────────────────────

  describe('getStatus', () => {
    it('✓ มี alert → hasAlert = true', async () => {
      mockPrisma.lot.findMany.mockResolvedValue([mockLotInFreezer(800)])
      mockPrisma.thawEvent.findMany.mockResolvedValue([])

      const result = await service.getStatus()

      expect(result.hasAlert).toBe(true)
      expect(result).toHaveProperty('reorder')
      expect(result).toHaveProperty('thaw')
      expect(result).toHaveProperty('tankReady')
    })

    it('✓ ไม่มี alert → hasAlert = false', async () => {
      mockPrisma.lot.findMany.mockResolvedValue([mockLotInFreezer(8000)])
      mockPrisma.thawEvent.findMany
        .mockResolvedValueOnce([mockThawEvent(false, 800, 60)])  // checkThawReminder
        .mockResolvedValueOnce([])                               // checkTankReady

      const result = await service.getStatus()

      expect(result.hasAlert).toBe(false)
    })
  })
})