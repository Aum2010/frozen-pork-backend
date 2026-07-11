import { Test, TestingModule } from '@nestjs/testing'
import { TanksService } from './tanks.service'
import { PrismaService } from '../../prisma/prisma.service'
import { NotFoundException, BadRequestException } from '@nestjs/common'

const mockTank = {
  id: 'tank-1',
  tankNumber: 1,
  capacityKg: 400,
  currentWeightKg: 0,
  status: 'EMPTY',
  updatedAt: new Date(),
  tankEntries: [],
}

const mockLot = {
  id: 'lot-1',
  lotNumber: 'LOT-001',
  batchId: 'B2607070001',
  supplier: 'ฟาร์มไทย',
  weightKg: 4000,
  zone: 'A3',
  status: 'WAITING_TANK',
  receivedAt: new Date(),
  createdAt: new Date(),
}

const mockTankEntry = {
  id: 'entry-1',
  tankId: 'tank-1',
  lotId: 'lot-1',
  weightKg: 400,
  filledAt: new Date(),
  emptyAt: null,
  createdAt: new Date(),
}

const mockPrisma = {
  tank: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  lot: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  tankEntry: {
    create: jest.fn(),
    update: jest.fn(),
  },
  ledger: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
}

describe('TanksService', () => {
  let service: TanksService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TanksService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    service = module.get<TanksService>(TanksService)
  })

  afterEach(() => jest.clearAllMocks())

  // ── findAll ──────────────────────────────────────────

  describe('findAll', () => {
    it('✓ คืนถังทุกใบพร้อม isFifoNext', async () => {
      mockPrisma.tank.findMany.mockResolvedValue([
        { ...mockTank, tankEntries: [] },
      ])

      const result = await service.findAll()

      expect(result[0]).toHaveProperty('isFifoNext')
    })

    it('✓ ถังที่มีหมูเก่าสุด → isFifoNext = true', async () => {
      const oldDate = new Date('2026-07-01')
      const newDate = new Date('2026-07-07')
      mockPrisma.tank.findMany.mockResolvedValue([
        { ...mockTank, id: 'tank-1', currentWeightKg: 400, tankEntries: [{ ...mockTankEntry, filledAt: newDate }] },
        { ...mockTank, id: 'tank-2', tankNumber: 2, currentWeightKg: 400, tankEntries: [{ ...mockTankEntry, filledAt: oldDate }] },
      ])

      const result = await service.findAll()

      expect(result.find((t) => t.id === 'tank-2')?.isFifoNext).toBe(true)
      expect(result.find((t) => t.id === 'tank-1')?.isFifoNext).toBe(false)
    })
  })

  // ── getFifoSuggest ────────────────────────────────────

  describe('getFifoSuggest', () => {
    it('✓ คืนถังที่มี filledAt เก่าสุด', async () => {
      const oldDate = new Date('2026-07-01')
      const newDate = new Date('2026-07-07')
      mockPrisma.tank.findMany.mockResolvedValue([
        { ...mockTank, id: 'tank-1', currentWeightKg: 400, tankEntries: [{ filledAt: newDate }] },
        { ...mockTank, id: 'tank-2', currentWeightKg: 400, tankEntries: [{ filledAt: oldDate }] },
      ])

      const result = await service.getFifoSuggest()

      expect(result.id).toBe('tank-2')
    })

    it('✓ ไม่มีถังที่มีหมู → 404', async () => {
      mockPrisma.tank.findMany.mockResolvedValue([])

      await expect(service.getFifoSuggest()).rejects.toThrow(NotFoundException)
    })
  })

  // ── fill ─────────────────────────────────────────────

  describe('fill', () => {
    it('✓ lot WAITING_TANK + น้ำหนักไม่เกิน → fill สำเร็จ', async () => {
      mockPrisma.tank.findUnique.mockResolvedValue(mockTank)
      mockPrisma.lot.findUnique.mockResolvedValue(mockLot)
      mockPrisma.$transaction.mockResolvedValue([mockTankEntry])

      const result = await service.fill('tank-1', { lotId: 'lot-1', weightKg: 400 }, 'user-1')

      expect(mockPrisma.$transaction).toHaveBeenCalled()
      expect(result).toBeDefined()
    })

    it('✓ ถังไม่มี → 404', async () => {
      mockPrisma.tank.findUnique.mockResolvedValue(null)

      await expect(
        service.fill('not-exist', { lotId: 'lot-1', weightKg: 400 }, 'user-1')
      ).rejects.toThrow(NotFoundException)
    })

    it('✓ lot status ไม่ใช่ WAITING_TANK → 400', async () => {
      mockPrisma.tank.findUnique.mockResolvedValue(mockTank)
      mockPrisma.lot.findUnique.mockResolvedValue({ ...mockLot, status: 'IN_FREEZER' })

      await expect(
        service.fill('tank-1', { lotId: 'lot-1', weightKg: 400 }, 'user-1')
      ).rejects.toThrow(BadRequestException)
    })

    it('✓ น้ำหนักเกิน capacity → 400', async () => {
      mockPrisma.tank.findUnique.mockResolvedValue({ ...mockTank, currentWeightKg: 200 })
      mockPrisma.lot.findUnique.mockResolvedValue(mockLot)

      await expect(
        service.fill('tank-1', { lotId: 'lot-1', weightKg: 300 }, 'user-1')
      ).rejects.toThrow(BadRequestException)
    })
  })

  // ── withdraw ─────────────────────────────────────────

  describe('withdraw', () => {
    const filledTank = {
      ...mockTank,
      currentWeightKg: 400,
      status: 'IN_USE',
      tankEntries: [mockTankEntry],
    }

    it('✓ เบิกน้ำหนักที่มี → สำเร็จ', async () => {
      mockPrisma.tank.findUnique
        .mockResolvedValueOnce(filledTank)
        .mockResolvedValueOnce({ ...filledTank, currentWeightKg: 0, status: 'EMPTY' })
      mockPrisma.$transaction.mockResolvedValue([])

      const result = await service.withdraw(
        'tank-1',
        { productionOrder: 'PO-001', weightKg: 400 },
        'user-1',
      )

      expect(mockPrisma.$transaction).toHaveBeenCalled()
    })

    it('✓ ถังว่าง → 400', async () => {
      mockPrisma.tank.findUnique.mockResolvedValue({ ...mockTank, currentWeightKg: 0, tankEntries: [] })

      await expect(
        service.withdraw('tank-1', { productionOrder: 'PO-001', weightKg: 400 }, 'user-1')
      ).rejects.toThrow(BadRequestException)
    })

    it('✓ เบิกมากกว่าที่มี → 400', async () => {
      mockPrisma.tank.findUnique.mockResolvedValue({ ...filledTank, currentWeightKg: 100 })

      await expect(
        service.withdraw('tank-1', { productionOrder: 'PO-001', weightKg: 400 }, 'user-1')
      ).rejects.toThrow(BadRequestException)
    })

    it('✓ ถังไม่มี → 404', async () => {
      mockPrisma.tank.findUnique.mockResolvedValue(null)

      await expect(
        service.withdraw('not-exist', { productionOrder: 'PO-001', weightKg: 400 }, 'user-1')
      ).rejects.toThrow(NotFoundException)
    })
  })
})