import { INestApplication } from '@nestjs/common'
// import * as request from 'supertest'
import request from 'supertest'
import { createTestApp } from './helpers/create-test-app'
// import { PrismaService } from '../src/prisma/prisma.service'
import { PrismaService } from '../prisma/prisma.service'

describe('Lots (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let warehouseToken: string
  let createdLotId: string

  beforeAll(async () => {
    const setup = await createTestApp()
    app = setup.app
    prisma = setup.prisma

    // login warehouse
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'warehouse@test.com', password: '1234' })
    warehouseToken = res.body.access_token

    // cleanup test lots
    const lots = await prisma.lot.findMany({ where: { lotNumber: { startsWith: 'LOT-E2E' } } })
    const lotIds = lots.map(l => l.id)
    await prisma.ledger.deleteMany({ where: { lotId: { in: lotIds } } })
    await prisma.thawEvent.deleteMany({ where: { lotId: { in: lotIds } } })
    await prisma.lot.deleteMany({ where: { id: { in: lotIds } } })
  })

  afterAll(async () => {
    const lots = await prisma.lot.findMany({ where: { lotNumber: { startsWith: 'LOT-E2E' } } })
    const lotIds = lots.map(l => l.id)
    await prisma.ledger.deleteMany({ where: { lotId: { in: lotIds } } })
    await prisma.thawEvent.deleteMany({ where: { lotId: { in: lotIds } } })
    await prisma.lot.deleteMany({ where: { id: { in: lotIds } } })
    await app.close()
  })

  describe('POST /lots', () => {
    it('✓ สร้าง lot ใหม่ → 201 + batchId auto', async () => {
      const res = await request(app.getHttpServer())
        .post('/lots')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({
          lotNumber: 'LOT-E2E-001',
          supplier: 'ฟาร์มไทย',
          weightKg: 4000,
          receivedAt: '2026-07-07',
        })

      expect(res.status).toBe(201)
      expect(res.body.batchId).toMatch(/^B\d{6}\d{4}$/)
      expect(res.body.status).toBe('IN_FREEZER')
      createdLotId = res.body.id
    })

    it('✓ lotNumber ซ้ำ → 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post('/lots')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({
          lotNumber: 'LOT-E2E-001',
          supplier: 'ฟาร์มไทย',
          weightKg: 4000,
          receivedAt: '2026-07-07',
        })

      expect(res.status).toBe(409)
    })

    it('✓ weightKg <= 0 → 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/lots')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({
          lotNumber: 'LOT-E2E-002',
          supplier: 'ฟาร์มไทย',
          weightKg: -100,
          receivedAt: '2026-07-07',
        })

      expect(res.status).toBe(400)
    })

    it('✓ ไม่มี token → 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/lots')
        .send({
          lotNumber: 'LOT-E2E-003',
          supplier: 'ฟาร์มไทย',
          weightKg: 4000,
          receivedAt: '2026-07-07',
        })

      expect(res.status).toBe(401)
    })
  })

  describe('GET /lots', () => {
    it('✓ คืน lots ทั้งหมด', async () => {
      const res = await request(app.getHttpServer())
        .get('/lots')
        .set('Authorization', `Bearer ${warehouseToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThan(0)
    })

    it('✓ filter ?status=IN_FREEZER → คืนเฉพาะ IN_FREEZER', async () => {
      const res = await request(app.getHttpServer())
        .get('/lots?status=IN_FREEZER')
        .set('Authorization', `Bearer ${warehouseToken}`)

      expect(res.status).toBe(200)
      res.body.forEach((lot: any) => {
        expect(lot.status).toBe('IN_FREEZER')
      })
    })
  })

  describe('GET /lots/:id', () => {
    it('✓ id ถูก → คืน lot พร้อม relations', async () => {
      const res = await request(app.getHttpServer())
        .get(`/lots/${createdLotId}`)
        .set('Authorization', `Bearer ${warehouseToken}`)

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(createdLotId)
      expect(res.body).toHaveProperty('thawEvents')
      expect(res.body).toHaveProperty('tankEntries')
      expect(res.body).toHaveProperty('ledgers')
    })

    it('✓ id ไม่มี → 404', async () => {
      const res = await request(app.getHttpServer())
        .get('/lots/non-existent-id')
        .set('Authorization', `Bearer ${warehouseToken}`)

      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /lots/:id/zone', () => {
    it('✓ ระบุ zone → อัปเดตสำเร็จ', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/lots/${createdLotId}/zone`)
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({ zone: 'A3' })

      expect(res.status).toBe(200)
      expect(res.body.zone).toBe('A3')
    })

    it('✓ id ไม่มี → 404', async () => {
      const res = await request(app.getHttpServer())
        .patch('/lots/non-existent-id/zone')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({ zone: 'A3' })

      expect(res.status).toBe(404)
    })
  })
})