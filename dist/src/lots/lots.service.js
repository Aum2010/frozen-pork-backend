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
exports.LotsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let LotsService = class LotsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateBatchId() {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const prefix = `B${yy}${mm}${dd}`;
        const count = await this.prisma.lot.count({
            where: { batchId: { startsWith: prefix } },
        });
        const seq = String(count + 1).padStart(4, '0');
        return `${prefix}${seq}`;
    }
    async create(dto, actorId) {
        const existing = await this.prisma.lot.findUnique({
            where: { lotNumber: dto.lotNumber },
        });
        if (existing)
            throw new common_1.ConflictException(`Lot number ${dto.lotNumber} มีอยู่แล้ว`);
        const batchId = await this.generateBatchId();
        const lot = await this.prisma.lot.create({
            data: {
                lotNumber: dto.lotNumber,
                batchId,
                supplier: dto.supplier,
                weightKg: dto.weightKg,
                remainingKg: dto.weightKg,
                receivedAt: new Date(dto.receivedAt),
                status: 'IN_FREEZER',
            },
        });
        await this.prisma.ledger.create({
            data: {
                eventType: 'RECEIVE',
                lotId: lot.id,
                weightKg: lot.weightKg,
                actorId,
                note: `รับสินค้าเข้า Lot ${lot.lotNumber} จาก ${lot.supplier}`,
            },
        });
        return lot;
    }
    async findAll(status) {
        return this.prisma.lot.findMany({
            where: status ? { status } : undefined,
            orderBy: { receivedAt: 'desc' },
            include: {
                thawEvents: {
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
    }
    async findOne(id) {
        const lot = await this.prisma.lot.findUnique({
            where: { id },
            include: {
                thawEvents: { orderBy: { createdAt: 'asc' } },
                ledgers: { orderBy: { createdAt: 'asc' } },
            },
        });
        if (!lot)
            throw new common_1.NotFoundException(`ไม่พบ Lot id: ${id}`);
        return lot;
    }
    async assignZone(id, dto, actorId) {
        const lot = await this.prisma.lot.findUnique({ where: { id } });
        if (!lot)
            throw new common_1.NotFoundException(`ไม่พบ Lot id: ${id}`);
        if (lot.status !== 'IN_FREEZER') {
            throw new common_1.BadRequestException('สามารถระบุ zone ได้เฉพาะ lot ที่อยู่ในตู้แช่แข็งเท่านั้น');
        }
        const updated = await this.prisma.lot.update({
            where: { id },
            data: { zone: dto.zone },
        });
        await this.prisma.ledger.create({
            data: {
                eventType: 'ASSIGN_ZONE',
                lotId: lot.id,
                weightKg: lot.weightKg,
                actorId,
                note: `ระบุ zone: ${dto.zone}`,
            },
        });
        return updated;
    }
};
exports.LotsService = LotsService;
exports.LotsService = LotsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], LotsService);
//# sourceMappingURL=lots.service.js.map