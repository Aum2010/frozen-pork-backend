import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { createTestApp } from './helpers/create-test-app'
import { PrismaService } from '../prisma/prisma.service'

describe('Ledger (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let warehouseToken: string
  let managerToken: string
  let lotId: string

  beforeAll(async () => {
    const setup = await createTestApp()
    app = setup.app
    prisma = setup.prisma

    const [whRes, mgRes] = await Promise.all([
      request(app.getHttpServer()).post('/auth/login').send({ email: 'warehouse@test.com', password: '1234' }),
      request(app.getHttpServer()).post('/auth/login').send({ email: 'manager@test.com', password: '1234' }),
    ])
    warehouseToken = whRes.body.access_token
    managerToken = mgRes.body.access_token

    // cleanup
    const lots = await prisma.lot.findMany({ where: { lotNumber: { startsWith: 'LOT-LEDGER' } } })
    const lotIds = lots.map((l) => l.id)
    await prisma.ledger.deleteMany({ where: { lotId: { in: lotIds } } })
    await prisma.thawEvent.deleteMany({ where: { lotId: { in: lotIds } } })
    await prisma.lot.deleteMany({ where: { id: { in: lotIds } } })

    // สร้าง lot + ledger
    const lotRes = await request(app.getHttpServer())
      .post('/lots')
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({
        lotNumber: 'LOT-LEDGER-001',
        supplier: 'ฟาร์มไทย',
        weightKg: 4000,
        receivedAt: '2026-07-07',
      })
    lotId = lotRes.body.id

    await request(app.getHttpServer())
      .patch(`/lots/${lotId}/zone`)
      .set('Authorization', `Bearer ${warehouseToken}`)
      .send({ zone: 'A3' })
  })

  afterAll(async () => {
    const lots = await prisma.lot.findMany({ where: { lotNumber: { startsWith: 'LOT-LEDGER' } } })
    const lotIds = lots.map((l) => l.id)
    await prisma.ledger.deleteMany({ where: { lotId: { in: lotIds } } })
    await prisma.thawEvent.deleteMany({ where: { lotId: { in: lotIds } } })
    await prisma.lot.deleteMany({ where: { id: { in: lotIds } } })
    await app.close()
  })

  describe('GET /ledger', () => {
    it('✓ คืน ledger ทั้งหมด', async () => {
      const res = await request(app.getHttpServer())
        .get('/ledger')
        .set('Authorization', `Bearer ${warehouseToken}`)

      expect(res.status).toBe(200)
      expect(Array.isArray(res.body)).toBe(true)
      expect(res.body.length).toBeGreaterThan(0)
    })

    it('✓ filter lotId → คืนเฉพาะ lot นั้น', async () => {
      const res = await request(app.getHttpServer())
        .get(`/ledger?lotId=${lotId}`)
        .set('Authorization', `Bearer ${warehouseToken}`)

      expect(res.status).toBe(200)
      res.body.forEach((r: any) => expect(r.lotId).toBe(lotId))
    })

    it('✓ filter eventType=RECEIVE → คืนเฉพาะ RECEIVE', async () => {
      const res = await request(app.getHttpServer())
        .get('/ledger?eventType=RECEIVE')
        .set('Authorization', `Bearer ${warehouseToken}`)

      expect(res.status).toBe(200)
      res.body.forEach((r: any) => expect(r.eventType).toBe('RECEIVE'))
    })
  })

  describe('GET /ledger/lot/:lotId/timeline', () => {
    it('✓ คืน timeline ครบ steps', async () => {
      const res = await request(app.getHttpServer())
        .get(`/ledger/lot/${lotId}/timeline`)
        .set('Authorization', `Bearer ${warehouseToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('lot')
      expect(res.body).toHaveProperty('timeline')
      expect(Array.isArray(res.body.timeline)).toBe(true)
      expect(res.body.timeline[0].step).toBe('RECEIVE')
    })

    it('✓ lotId ไม่มี → 404', async () => {
      const res = await request(app.getHttpServer())
        .get('/ledger/lot/non-existent/timeline')
        .set('Authorization', `Bearer ${warehouseToken}`)

      expect(res.status).toBe(404)
    })
  })

  describe('GET /ledger/export', () => {
    it('✓ คืน CSV file พร้อม header', async () => {
      const res = await request(app.getHttpServer())
        .get('/ledger/export')
        .set('Authorization', `Bearer ${managerToken}`)

      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toContain('text/csv')
      expect(res.text).toContain('eventType')
    })

    it('✓ WAREHOUSE role → 403 Forbidden', async () => {
      const res = await request(app.getHttpServer())
        .get('/ledger/export')
        .set('Authorization', `Bearer ${warehouseToken}`)

      expect(res.status).toBe(403)
    })
  })
})