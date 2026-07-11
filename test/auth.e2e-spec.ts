import { INestApplication } from '@nestjs/common'
// import * as request from 'supertest'
import request from 'supertest'
import { createTestApp } from './helpers/create-test-app'
import { PrismaService } from '../src/prisma/prisma.service'

describe('Auth (e2e)', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    const setup = await createTestApp()
    app = setup.app
    prisma = setup.prisma
  })

  afterAll(async () => {
    await app.close()
  })

  describe('POST /auth/login', () => {
    it('✓ login ถูกต้อง → 200 + access_token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'warehouse@test.com', password: '1234' })

      expect(res.status).toBe(201)
      expect(res.body.access_token).toBeDefined()
      expect(res.body.user.role).toBe('WAREHOUSE')
    })

    it('✓ password ผิด → 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'warehouse@test.com', password: 'wrong' })

      expect(res.status).toBe(401)
    })

    it('✓ email ไม่มีในระบบ → 401', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'notfound@test.com', password: '1234' })

      expect(res.status).toBe(401)
    })

    it('✓ body ไม่ครบ → 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'warehouse@test.com' })

      expect(res.status).toBe(400)
    })
  })

  describe('GET /auth/me', () => {
    let token: string

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'warehouse@test.com', password: '1234' })
      token = res.body.access_token
    })

    it('✓ token ถูก → 200 + user info', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.email).toBe('warehouse@test.com')
      expect(res.body).not.toHaveProperty('password')
    })

    it('✓ ไม่มี token → 401', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')

      expect(res.status).toBe(401)
    })

    it('✓ token ปลอม → 401', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer fake-token')

      expect(res.status).toBe(401)
    })
  })
})