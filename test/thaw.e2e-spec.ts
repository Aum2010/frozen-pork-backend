import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { createTestApp } from './helpers/create-test-app'
import { PrismaService } from '../prisma/prisma.service'

describe('Thaw (e2e)', () => {
    let app: INestApplication
    let prisma: PrismaService
    let warehouseToken: string
    let lotId: string
    let thawEventId: string

    beforeAll(async () => {
        const setup = await createTestApp()
        app = setup.app
        prisma = setup.prisma

        const res = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'warehouse@test.com', password: '1234' })
        warehouseToken = res.body.access_token

        // cleanup ตาม dependency order
        const lots = await prisma.lot.findMany({ where: { lotNumber: { startsWith: 'LOT-THAW' } } })
        const lotIds = lots.map(l => l.id)
        await prisma.ledger.deleteMany({ where: { lotId: { in: lotIds } } })
        await prisma.thawEvent.deleteMany({ where: { lotId: { in: lotIds } } })
        await prisma.lot.deleteMany({ where: { id: { in: lotIds } } })

        // สร้าง lot ใหม่
        const lotRes = await request(app.getHttpServer())
            .post('/lots')
            .set('Authorization', `Bearer ${warehouseToken}`)
            .send({
                lotNumber: 'LOT-THAW-001',
                supplier: 'ฟาร์มไทย',
                weightKg: 4000,
                receivedAt: '2026-07-07',
            })
        lotId = lotRes.body.id
    })

    afterAll(async () => {
        const lots = await prisma.lot.findMany({ where: { lotNumber: { startsWith: 'LOT-THAW' } } })
        const lotIds = lots.map(l => l.id)
        await prisma.ledger.deleteMany({ where: { lotId: { in: lotIds } } })
        await prisma.thawEvent.deleteMany({ where: { lotId: { in: lotIds } } })
        await prisma.lot.deleteMany({ where: { id: { in: lotIds } } })
        await app.close()
    })

    describe('POST /thaw', () => {
        it('✓ lot IN_FREEZER → 201 + thawEvent', async () => {
            const res = await request(app.getHttpServer())
                .post('/thaw')
                .set('Authorization', `Bearer ${warehouseToken}`)
                .send({ lotId, weightKg: 800 })

            expect(res.status).toBe(201)
            expect(res.body.weightKg).toBe(800)
            expect(res.body.isReady).toBe(false)
            thawEventId = res.body.id
        })

        it('✓ lot status ไม่ใช่ IN_FREEZER → 400', async () => {
            const res = await request(app.getHttpServer())
                .post('/thaw')
                .set('Authorization', `Bearer ${warehouseToken}`)
                .send({ lotId, weightKg: 800 })

            expect(res.status).toBe(400)
        })

        it('✓ lotId ไม่มี → 404', async () => {
            const res = await request(app.getHttpServer())
                .post('/thaw')
                .set('Authorization', `Bearer ${warehouseToken}`)
                .send({ lotId: 'non-existent', weightKg: 800 })

            expect(res.status).toBe(404)
        })
    })

    describe('GET /thaw/pending', () => {
        it('✓ คืน pending thaw events พร้อม remainingMinutes', async () => {
            const res = await request(app.getHttpServer())
                .get('/thaw/pending')
                .set('Authorization', `Bearer ${warehouseToken}`)

            expect(res.status).toBe(200)
            expect(Array.isArray(res.body)).toBe(true)
            expect(res.body[0]).toHaveProperty('remainingMinutes')
            expect(res.body[0]).toHaveProperty('isOverdue')
        })
    })

    describe('POST /thaw/:id/confirm-ready', () => {
        it('✓ confirm สำเร็จ → isReady = true', async () => {
            const res = await request(app.getHttpServer())
                .post(`/thaw/${thawEventId}/confirm-ready`)
                .set('Authorization', `Bearer ${warehouseToken}`)

            expect(res.status).toBe(201)
            expect(res.body.isReady).toBe(true)
        })

        it('✓ confirm ซ้ำ → 400', async () => {
            expect(thawEventId).toBeDefined()

            const res = await request(app.getHttpServer())
                .post(`/thaw/${thawEventId}/confirm-ready`)
                .set('Authorization', `Bearer ${warehouseToken}`)

            expect(res.status).toBe(400)
        })

        it('✓ id ไม่มี → 404', async () => {
            const res = await request(app.getHttpServer())
                .post('/thaw/non-existent/confirm-ready')
                .set('Authorization', `Bearer ${warehouseToken}`)

            expect(res.status).toBe(404)
        })
    })
})