import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { createTestApp } from './helpers/create-test-app'

describe('SmartAdvisory (e2e)', () => {
  let app: INestApplication
  let managerToken: string

  beforeAll(async () => {
    const setup = await createTestApp()
    app = setup.app

    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'manager@test.com', password: '1234' })
    managerToken = res.body.access_token
  })

  afterAll(async () => {
    await app.close()
  })

  describe('GET /advisory/status', () => {
    it('✓ คืน status ครบ 3 sections', async () => {
      const res = await request(app.getHttpServer())
        .get('/advisory/status')
        .set('Authorization', `Bearer ${managerToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('reorder')
      expect(res.body).toHaveProperty('thaw')
      expect(res.body).toHaveProperty('tankReady')
      expect(res.body).toHaveProperty('hasAlert')
    })
  })

  describe('GET /advisory/reorder', () => {
    it('✓ คืน reorder info พร้อม totalStockKg และ daysLeft', async () => {
      const res = await request(app.getHttpServer())
        .get('/advisory/reorder')
        .set('Authorization', `Bearer ${managerToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('totalStockKg')
      expect(res.body).toHaveProperty('daysLeft')
      expect(res.body).toHaveProperty('shouldReorder')
      expect(res.body).toHaveProperty('message')
    })
  })

  describe('GET /advisory/thaw-reminder', () => {
    it('✓ คืน thaw reminder พร้อม recommendedWeightKg', async () => {
      const res = await request(app.getHttpServer())
        .get('/advisory/thaw-reminder')
        .set('Authorization', `Bearer ${managerToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('shouldThaw')
      expect(res.body).toHaveProperty('recommendedWeightKg')
      expect(res.body).toHaveProperty('message')
    })
  })

  describe('GET /advisory/tank-ready', () => {
    it('✓ คืน tank ready info', async () => {
      const res = await request(app.getHttpServer())
        .get('/advisory/tank-ready')
        .set('Authorization', `Bearer ${managerToken}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveProperty('readyCount')
      expect(res.body).toHaveProperty('message')
    })
  })

  describe('Auth guard', () => {
    it('✓ ไม่มี token → 401', async () => {
      const res = await request(app.getHttpServer())
        .get('/advisory/status')

      expect(res.status).toBe(401)
    })
  })
})