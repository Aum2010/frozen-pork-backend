"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThawService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ThawService = class ThawService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async startThaw(dto, actorId) {
        const lot = await this.prisma.lot.findUnique({ where: { id: dto.lotId } });
        if (!lot)
            throw new common_1.NotFoundException(`ไม่พบ Lot id: ${dto.lotId}`);
        if (lot.status === 'USED') {
            throw new common_1.BadRequestException('Lot นี้ใช้หมดแล้ว');
        }
        if (lot.remainingKg <= 0) {
            throw new common_1.BadRequestException('ไม่มีน้ำหนักคงเหลือในตู้แช่แข็ง');
        }
        if (dto.weightKg > lot.remainingKg) {
            throw new common_1.BadRequestException(`น้ำหนักที่ละลาย (${dto.weightKg}) มากกว่าคงเหลือ (${lot.remainingKg})`);
        }
        const startedAt = new Date();
        const thawMinutes = process.env.THAW_DURATION_MINUTES
            ? parseInt(process.env.THAW_DURATION_MINUTES)
            : 24 * 60;
        const readyAt = new Date(startedAt.getTime() + thawMinutes * 60 * 1000);
        const newRemainingKg = lot.remainingKg - dto.weightKg;
        const newLotStatus = newRemainingKg === 0 ? 'FULLY_THAWING' : 'PARTIALLY_THAWING';
        const [thawEvent] = await this.prisma.$transaction([
            this.prisma.thawEvent.create({
                data: {
                    lotId: lot.id,
                    weightKg: dto.weightKg,
                    remainingKg: dto.weightKg,
                    startedAt,
                    readyAt,
                    confirmedBy: actorId,
                    status: 'THAWING',
                },
            }),
            this.prisma.lot.update({
                where: { id: lot.id },
                data: {
                    remainingKg: newRemainingKg,
                    status: newLotStatus,
                },
            }),
            this.prisma.ledger.create({
                data: {
                    eventType: 'START_THAW',
                    lotId: lot.id,
                    weightKg: dto.weightKg,
                    actorId,
                    note: `แบ่งละลาย ${dto.weightKg} กก. จาก ${lot.weightKg} กก. — คงเหลือ ${newRemainingKg} กก.`,
                },
            }),
        ]);
        return thawEvent;
    }
    async getPending() {
        const events = await this.prisma.thawEvent.findMany({
            where: { status: 'THAWING' },
            include: { lot: true },
            orderBy: { startedAt: 'asc' },
        });
        const now = new Date();
        return events.map((e) => ({
            ...e,
            remainingMinutes: Math.max(0, Math.round((e.readyAt.getTime() - now.getTime()) / 60000)),
            isOverdue: now > e.readyAt,
        }));
    }
    async confirmReady(thawEventId, actorId) {
        const event = await this.prisma.thawEvent.findUnique({
            where: { id: thawEventId },
            include: { lot: true },
        });
        if (!event)
            throw new common_1.NotFoundException(`ไม่พบ ThawEvent id: ${thawEventId}`);
        if (event.status !== 'THAWING') {
            throw new common_1.BadRequestException(`ThawEvent นี้ไม่ได้อยู่ในสถานะ THAWING (status: ${event.status})`);
        }
        await this.prisma.$transaction([
            this.prisma.thawEvent.update({
                where: { id: thawEventId },
                data: { status: 'WAITING_TANK' },
            }),
            this.prisma.ledger.create({
                data: {
                    eventType: 'START_THAW',
                    lotId: event.lotId,
                    weightKg: event.weightKg,
                    actorId,
                    note: 'ยืนยันละลายแล้ว — รอเข้าถัง',
                },
            }),
        ]);
        return this.prisma.thawEvent.findUnique({ where: { id: thawEventId } });
    }
    async patchReadyAt(thawEventId) {
        const event = await this.prisma.thawEvent.findUnique({
            where: { id: thawEventId },
        });
        if (!event)
            throw new common_1.NotFoundException(`ไม่พบ ThawEvent id: ${thawEventId}`);
        return this.prisma.thawEvent.update({
            where: { id: thawEventId },
            data: { readyAt: new Date(Date.now() - 5000) },
        });
    }
    async getWaitingTank() {
        return this.prisma.thawEvent.findMany({
            where: { status: 'WAITING_TANK' },
            include: { lot: true },
            orderBy: { startedAt: 'asc' },
        });
    }
    async startThawAuto(totalWeightKg, actorId) {
        const lots = await this.prisma.lot.findMany({
            where: {
                status: { in: ['IN_FREEZER', 'PARTIALLY_THAWING'] },
                remainingKg: { gt: 0 },
            },
            orderBy: { receivedAt: 'asc' },
        });
        const plan = [];
        let remaining = totalWeightKg;
        for (const lot of lots) {
            if (remaining <= 0)
                break;
            const take = Math.min(lot.remainingKg, remaining);
            plan.push({ lotId: lot.id, weightKg: take });
            remaining -= take;
        }
        if (remaining > 0) {
            throw new common_1.BadRequestException(`สต็อกไม่พอ — ขาดอีก ${remaining} กก. (มีทั้งหมด ${totalWeightKg - remaining} กก.)`);
        }
        const thawMinutes = process.env.THAW_DURATION_MINUTES
            ? parseInt(process.env.THAW_DURATION_MINUTES)
            : 24 * 60;
        const startedAt = new Date();
        const readyAt = new Date(startedAt.getTime() + thawMinutes * 60 * 1000);
        const results = [];
        for (const item of plan) {
            const lot = lots.find((l) => l.id === item.lotId);
            const newRemainingKg = lot.remainingKg - item.weightKg;
            const newLotStatus = newRemainingKg === 0 ? 'FULLY_THAWING' : 'PARTIALLY_THAWING';
            const [thawEvent] = await this.prisma.$transaction([
                this.prisma.thawEvent.create({
                    data: {
                        lotId: item.lotId,
                        weightKg: item.weightKg,
                        remainingKg: item.weightKg,
                        startedAt,
                        readyAt,
                        confirmedBy: actorId,
                        status: 'THAWING',
                    },
                }),
                this.prisma.lot.update({
                    where: { id: item.lotId },
                    data: {
                        remainingKg: newRemainingKg,
                        status: newLotStatus,
                    },
                }),
                this.prisma.ledger.create({
                    data: {
                        eventType: 'START_THAW',
                        lotId: item.lotId,
                        weightKg: item.weightKg,
                        actorId,
                        note: `Auto thaw ${item.weightKg} กก. จาก ${lot.lotNumber} — คงเหลือ ${newRemainingKg} กก.`,
                    },
                }),
            ]);
            results.push({ lot: lot.lotNumber, weightKg: item.weightKg, thawEvent });
        }
        return {
            totalWeightKg,
            plan: results.map((r) => ({ lot: r.lot, weightKg: r.weightKg })),
            thawEvents: results.map((r) => r.thawEvent),
        };
    }
};
exports.ThawService = ThawService;
exports.ThawService = ThawService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ThawService);
//# sourceMappingURL=thaw.service.js.map