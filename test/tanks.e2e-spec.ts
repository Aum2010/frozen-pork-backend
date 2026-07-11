import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { createTestApp } from './helpers/create-test-app'
import { PrismaService } from '../prisma/prisma.service'

describe('Tanks (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let warehouseToken: string
  let productionToken: string
  let tankId: string
  let lotId: string

  beforeAll(async () => {
    const setup = await createTestApp()
    app = setup.app
    prisma = setup.prisma

    // login
    const [whRes, prodRes] = await Promise.all([
      request(app.getHttpServer()).post('/auth/login').send({ email: 'warehouse@test.com', password: '1234' }),
      request(app.getHttpServer()).post('/auth/login').send({ email: 'production@test.com', password: '1234' }),
    ])
    warehouseToken = whRes.body.access_token
    productionToken = prodRes.body.access_token

    // cleanup
    const lots = await prisma.lot.findMany({ where: { lotNumber: { startsWith: 'LOT-TANK' } } })
    const lotIds = lots.map((l) => l.id)
    await prisma.ledger.deleteMany({ where: { lotId: { in: lotIds } } })
    await prisma.tankEntry.deleteMany({ where: { lotId: { in: lotIds } } })
    await prisma.thawEvent.deleteMany({ where: { lotId: { in: lotIds } } })
    await prisma.lot.deleteMany({ where: { id: { in: lotIds } } })
    await prisma.tank.updateMany({ data: { currentWeightKg: 0, status: 'EMPTY' } })

    // หา tankId จาก seed
    const tank = await prisma.tank.findFirst({ where: { tankNumber: 1 } })
    tankId = tank!.id

    // สร้าง lot → thaw → confirm → พร้อมเข้าถัง
    const lotRes = await request(app.getHttpServer())
      .post('/lots')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({ lotNumber: 'LOT-TANK-001', supplier: 'ฟาร์มไทย', weightKg: 4000, receivedAt: '2026-07-07' })
    lotId = lotRes.body.id

    const thawRes = await request(app.getHttpServer())
      .post('/thaw')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({ lotId, weightKg: 800 })

    await request(app.getHttpServer())
      .post(`/thaw/${thawRes.body.id}/confirm-ready`)
      .set('Authorization', `Bearer ${warehouseToken}`)
  })

  afterAll(async () => {
    const lots = await prisma.lot.findMany({ where: { lotNumber: { startsWith: 'LOT-TANK' } } })
    const lotIds = lots.map((l) => l.id)
    await prisma.ledger.deleteMany({ where: { lotId: { in: lotIds } } })
    await prisma.tankEntry.deleteMany({ where: { lotId: { in: lotIds } } })
    await prisma.thawEvent.deleteMany({ where: { lotId: { in: lotIds } } })
    await prisma.lot.deleteMany({ where: { id: { in: lotIds } } })
    await prisma.tank.updateMany({ data: { currentWeightKg: 0, status: 'EMPTY' } })
    await app.close()
  })

  describe('GET /tanks', () => {
    it('✓ คืนถังทุกใบพร้อม isFifoNext', async () => {
      const res = await request(app.getHttpServer())
        .get('/tanks')
        .set('Authorization', `Bearer ${warehouseToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBe(6)
      res.body.forEach((t: any) => expect(t).toHaveProperty('isFifoNext'))
    })
  })

  describe('POST /tanks/:tankId/fill', () => {
    it('✓ lot WAITING_TANK → fill สำเร็จ', async () => {
      const res = await request(app.getHttpServer())
        .post(`/tanks/${tankId}/fill`)
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({ lotId, weightKg: 400 })

      expect(res.status).toBe(201)
      expect(res.body.weightKg).toBe(400)
    })

    it('✓ น้ำหนักเกิน capacity → 400', async () => {
      const res = await request(app.getHttpServer())
        .post(`/tanks/${tankId}/fill`)
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({ lotId, weightKg: 400 })

      expect(res.status).toBe(400)
    })

    it('✓ tankId ไม่มี → 404', async () => {
      const res = await request(app.getHttpServer())
        .post('/tanks/non-existent/fill')
        .set('Authorization', `Bearer ${warehouseToken}`)
        .send({ lotId, weightKg: 400 })

      expect(res.status).toBe(404)
    })
  })

  describe('GET /tanks/fifo-suggest', () => {
    it('✓ คืนถังที่ควรใช้ก่อน (FIFO)', async () => {
      const res = await request(app.getHttpServer())
        .get('/tanks/fifo-suggest')
        .set('Authorization', `Bearer ${warehouseToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('tankNumber')
      expect(res.body.currentWeightKg).toBeGreaterThan(0)
    })
  })

  describe('POST /tanks/:tankId/withdraw', () => {
    it('✓ เบิกน้ำหนักที่มี → สำเร็จ', async () => {
      const res = await request(app.getHttpServer())
        .post(`/tanks/${tankId}/withdraw`)
        .set('Authorization', `Bearer ${productionToken}`)
        .send({ productionOrder: 'PO-E2E-001', weightKg: 200 })

      expect(res.status).toBe(201)
      expect(res.body.currentWeightKg).toBe(200)
    })

    it('✓ เบิกมากกว่าที่มี → 400', async () => {
      const res = await request(app.getHttpServer())
        .post(`/tanks/${tankId}/withdraw`)
        .set('Authorization', `Bearer ${productionToken}`)
        .send({ productionOrder: 'PO-E2E-002', weightKg: 9999 })

      expect(res.status).toBe(400)
    })

    it('✓ tankId ไม่มี → 404', async () => {
      const res = await request(app.getHttpServer())
        .post('/tanks/non-existent/withdraw')
        .set('Authorization', `Bearer ${productionToken}`)
        .send({ productionOrder: 'PO-E2E-003', weightKg: 100 })

      expect(res.status).toBe(404)
    })
  })
})