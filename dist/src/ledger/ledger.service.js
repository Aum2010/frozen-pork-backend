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
exports.LedgerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const json2csv_1 = require("json2csv");
let LedgerService = class LedgerService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(filters) {
        const where = {};
        if (filters.lotId)
            where.lotId = filters.lotId;
        if (filters.eventType)
            where.eventType = filters.eventType;
        if (filters.startDate || filters.endDate) {
            where.createdAt = {};
            if (filters.startDate)
                where.createdAt.gte = new Date(filters.startDate);
            if (filters.endDate)
                where.createdAt.lte = new Date(filters.endDate);
        }
        return this.prisma.ledger.findMany({
            where,
            include: { lot: true },
            orderBy: { createdAt: 'asc' },
        });
    }
    async getTimeline(lotId) {
        const lot = await this.prisma.lot.findUnique({ where: { id: lotId } });
        if (!lot)
            throw new common_1.NotFoundException(`ไม่พบ Lot id: ${lotId}`);
        const [ledgers, thawEvents] = await Promise.all([
            this.prisma.ledger.findMany({
                where: { lotId },
                orderBy: { createdAt: 'asc' },
            }),
            this.prisma.thawEvent.findMany({
                where: { lotId },
                include: {
                    tankEntries: {
                        include: { tank: true },
                    },
                },
                orderBy: { createdAt: 'asc' },
            }),
        ]);
        const tankEntryEvents = thawEvents.flatMap((te) => te.tankEntries.map((entry) => ({
            step: 'ENTER_TANK',
            label: 'เข้าถัง',
            date: entry.filledAt,
            weightKg: entry.weightKg,
            detail: `ถัง ${entry.tank.tankNumber}`,
        })));
        return {
            lot,
            timeline: [
                {
                    step: 'RECEIVE',
                    label: 'รับเข้าระบบ',
                    date: lot.receivedAt,
                    weightKg: lot.weightKg,
                    detail: `Supplier: ${lot.supplier} | Zone: ${lot.zone ?? '-'}`,
                },
                ...thawEvents.map((e) => ({
                    step: 'START_THAW',
                    label: 'เริ่มละลาย',
                    date: e.startedAt,
                    weightKg: e.weightKg,
                    detail: `พร้อมเข้าถัง: ${e.readyAt.toISOString()}`,
                })),
                ...tankEntryEvents,
                ...ledgers
                    .filter((l) => l.eventType === 'WITHDRAW')
                    .map((l) => ({
                    step: 'WITHDRAW',
                    label: 'นำไปผลิต',
                    date: l.createdAt,
                    weightKg: l.weightKg,
                    detail: `Production Order: ${l.productionOrder ?? '-'}`,
                })),
            ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        };
    }
    async exportCsv(filters) {
        const records = await this.findAll(filters);
        const data = records.map((r) => ({
            date: r.createdAt.toISOString(),
            eventType: r.eventType,
            lotNumber: r.lot?.lotNumber ?? '-',
            batchId: r.lot?.batchId ?? '-',
            weightKg: r.weightKg,
            actorId: r.actorId,
            productionOrder: r.productionOrder ?? '-',
            note: r.note ?? '-',
        }));
        const parser = new json2csv_1.Parser({
            fields: [
                'date',
                'eventType',
                'lotNumber',
                'batchId',
                'weightKg',
                'actorId',
                'productionOrder',
                'note',
            ],
            withBOM: true,
        });
        return parser.parse(data);
    }
};
exports.LedgerService = LedgerService;
exports.LedgerService = LedgerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LedgerService);
//# sourceMappingURL=ledger.service.js.map