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
var SmartAdvisoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartAdvisoryService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../../prisma/prisma.service");
let dailyUsageKg = 800;
const LEAD_TIME_DAYS = 3;
const THAW_LEAD_TIME_DAYS = 1;
let SmartAdvisoryService = SmartAdvisoryService_1 = class SmartAdvisoryService {
    prisma;
    logger = new common_1.Logger(SmartAdvisoryService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async cronReorderCheck() {
        this.logger.log('[Cron] ตรวจสอบ reorder point...');
        const result = await this.checkReorderPoint();
        if (result.shouldReorder) {
            this.logger.warn(`[Alert] สต็อกวิกฤต! เหลือ ${result.totalStockKg} กก. = ${result.daysLeft} วัน — ควรสั่งซื้อด่วน`);
        }
    }
    async cronThawReminder() {
        this.logger.log('[Cron] ตรวจสอบการละลาย...');
        const result = await this.checkThawReminder();
        if (result.shouldThaw) {
            this.logger.warn(`[Alert] ควรนำหมู ${result.recommendedWeightKg} กก. ออกมาละลายวันนี้`);
        }
    }
    async cronTankReady() {
        this.logger.log('[Cron] ตรวจสอบหมูพร้อมเข้าถัง...');
        const result = await this.checkTankReady();
        if (result.readyCount > 0) {
            this.logger.warn(`[Alert] มีหมู ${result.readyCount} รายการพร้อมเข้าถัง`);
        }
    }
    async checkReorderPoint() {
        const lots = await this.prisma.lot.findMany({
            where: {
                status: { in: ['IN_FREEZER', 'PARTIALLY_THAWING', 'FULLY_THAWING'] },
            },
        });
        const totalStockKg = lots.reduce((sum, l) => sum + l.weightKg, 0);
        if (dailyUsageKg === 0) {
            return { shouldReorder: false, totalStockKg, daysLeft: Infinity, recommendedOrderKg: 0 };
        }
        const daysLeft = Math.floor(totalStockKg / dailyUsageKg);
        const shouldReorder = daysLeft <= LEAD_TIME_DAYS;
        return {
            shouldReorder,
            totalStockKg,
            daysLeft,
            recommendedOrderKg: shouldReorder ? 4000 : 0,
            message: shouldReorder
                ? `สต็อกเหลือ ${daysLeft} วัน — ควรสั่งซื้อ 4,000 กก. ด่วน`
                : `สต็อกเพียงพอ ${daysLeft} วัน`,
        };
    }
    async checkThawReminder() {
        const thawing = await this.prisma.thawEvent.findMany({
            where: { status: 'THAWING' },
        });
        const thawingKg = thawing.reduce((sum, e) => sum + e.weightKg, 0);
        const neededKg = dailyUsageKg;
        const shouldThaw = thawingKg < neededKg;
        const recommendedWeightKg = Math.max(0, neededKg - thawingKg);
        return {
            shouldThaw,
            thawingKg,
            neededKg,
            recommendedWeightKg,
            message: shouldThaw
                ? `ควรนำหมู ${recommendedWeightKg} กก. ออกมาละลายวันนี้`
                : `กำลังละลาย ${thawingKg} กก. เพียงพอแล้ว`,
        };
    }
    async checkTankReady() {
        const now = new Date();
        const readyEvents = await this.prisma.thawEvent.findMany({
            where: {
                status: 'THAWING',
                readyAt: { lte: now },
            },
            include: { lot: true },
        });
        return {
            readyCount: readyEvents.length,
            readyEvents,
            message: readyEvents.length > 0
                ? `มีหมู ${readyEvents.length} รายการพร้อมเข้าถัง`
                : 'ไม่มีหมูรอเข้าถัง',
        };
    }
    async getStatus() {
        const [reorder, thaw, tankReady] = await Promise.all([
            this.checkReorderPoint(),
            this.checkThawReminder(),
            this.checkTankReady(),
        ]);
        return {
            reorder,
            thaw,
            tankReady,
            hasAlert: reorder.shouldReorder || thaw.shouldThaw || tankReady.readyCount > 0,
        };
    }
};
exports.SmartAdvisoryService = SmartAdvisoryService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SmartAdvisoryService.prototype, "cronReorderCheck", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SmartAdvisoryService.prototype, "cronThawReminder", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SmartAdvisoryService.prototype, "cronTankReady", null);
exports.SmartAdvisoryService = SmartAdvisoryService = SmartAdvisoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SmartAdvisoryService);
//# sourceMappingURL=smart-advisory.service.js.map