import { Test, TestingModule } from '@nestjs/testing'
import { LotsService } from './lots.service'
import { PrismaService } from '../../prisma/prisma.service'
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common'

const mockLot = {
  id: 'lot-1',
  lotNumber: 'LOT-001',
  batchId: 'B2607070001',
  supplier: 'ฟาร์มไทย',
  weightKg: 4000,
  zone: null,
  status: 'IN_FREEZER',
  receivedAt: new Date(),
  createdAt: new Date(),
}

const mockPrisma = {
  lot: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  ledger: {
    create: jest.fn(),
  },
}

describe('LotsService', () => {
  let service: LotsService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LotsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile()

    service = module.get<LotsService>(LotsService)
  })

  afterEach(() => jest.clearAllMocks())

  // ── create ──────────────────────────────────────────

  describe('create', () => {
    const dto = { lotNumber: 'LOT-001', supplier: 'ฟาร์มไทย', weightKg: 4000, receivedAt: '2026-07-07' }

    it('✓ สร้าง lot ใหม่ → ได้ lot พร้อม batchId auto', async () => {
      mockPrisma.lot.findUnique.mockResolvedValue(null)
      mockPrisma.lot.count.mockResolvedValue(0)
      mockPrisma.lot.create.mockResolvedValue(mockLot)
      mockPrisma.ledger.create.mockResolvedValue({})

      const result = await service.create(dto, 'user-1')

      expect(result.batchId).toBeDefined()
      expect(mockPrisma.ledger.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ eventType: 'RECEIVE' }) })
      )
    })

    it('✓ lotNumber ซ้ำ → 409 Conflict', async () => {
      mockPrisma.lot.findUnique.mockResolvedValue(mockLot)

      await expect(service.create(dto, 'user-1')).rejects.toThrow(ConflictException)
    })
  })

  // ── findAll ──────────────────────────────────────────

  describe('findAll', () => {
    it('✓ ไม่ส่ง status → คืน lots ทั้งหมด', async () => {
      mockPrisma.lot.findMany.mockResolvedValue([mockLot])

      const result = await service.findAll()

      expect(mockPrisma.lot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: undefined })
      )
      expect(result).toHaveLength(1)
    })

    it('✓ filter status=IN_FREEZER → where มี status', async () => {
      mockPrisma.lot.findMany.mockResolvedValue([mockLot])

      await service.findAll('IN_FREEZER')

      expect(mockPrisma.lot.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: 'IN_FREEZER' } })
      )
    })
  })

  // ── findOne ──────────────────────────────────────────

  describe('findOne', () => {
    it('✓ id ถูกต้อง → คืน lot พร้อม relations', async () => {
      mockPrisma.lot.findUnique.mockResolvedValue({ ...mockLot, thawEvents: [], tankEntries: [], ledgers: [] })

      const result = await service.findOne('lot-1')

      expect(result.id).toBe('lot-1')
      expect(result).toHaveProperty('thawEvents')
      expect(result).toHaveProperty('tankEntries')
      expect(result).toHaveProperty('ledgers')
    })

    it('✓ id ไม่มี → 404 Not Found', async () => {
      mockPrisma.lot.findUnique.mockResolvedValue(null)

      await expect(service.findOne('not-exist')).rejects.toThrow(NotFoundException)
    })
  })

  // ── assignZone ───────────────────────────────────────

  describe('assignZone', () => {
    it('✓ lot อยู่ใน IN_FREEZER → อัปเดต zone สำเร็จ', async () => {
      mockPrisma.lot.findUnique.mockResolvedValue(mockLot)
      mockPrisma.lot.update.mockResolvedValue({ ...mockLot, zone: 'A3' })
      mockPrisma.ledger.create.mockResolvedValue({})

      const result = await service.assignZone('lot-1', { zone: 'A3' }, 'user-1')

      expect(result.zone).toBe('A3')
      expect(mockPrisma.ledger.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ eventType: 'ASSIGN_ZONE' }) })
      )
    })

    it('✓ lot ไม่มี → 404 Not Found', async () => {
      mockPrisma.lot.findUnique.mockResolvedValue(null)

      await expect(service.assignZone('not-exist', { zone: 'A3' }, 'user-1')).rejects.toThrow(NotFoundException)
    })

    it('✓ lot status ไม่ใช่ IN_FREEZER → 400 Bad Request', async () => {
      mockPrisma.lot.findUnique.mockResolvedValue({ ...mockLot, status: 'THAWING' })

      await expect(service.assignZone('lot-1', { zone: 'A3' }, 'user-1')).rejects.toThrow(BadRequestException)
    })
  })
})