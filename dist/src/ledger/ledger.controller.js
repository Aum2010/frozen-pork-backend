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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LedgerController = void 0;
const common_1 = require("@nestjs/common");
const ledger_service_1 = require("./ledger.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let LedgerController = class LedgerController {
    ledgerService;
    constructor(ledgerService) {
        this.ledgerService = ledgerService;
    }
    findAll(lotId, eventType, startDate, endDate) {
        return this.ledgerService.findAll({ lotId, eventType, startDate, endDate });
    }
    getTimeline(lotId) {
        return this.ledgerService.getTimeline(lotId);
    }
    async exportCsv(lotId, startDate, endDate, res) {
        const csv = await this.ledgerService.exportCsv({ lotId, startDate, endDate });
        const filename = `ledger-${new Date().toISOString().slice(0, 10)}.csv`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(csv);
    }
};
exports.LedgerController = LedgerController;
__decorate([
    (0, roles_decorator_1.Roles)('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN'),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('lotId')),
    __param(1, (0, common_1.Query)('eventType')),
    __param(2, (0, common_1.Query)('startDate')),
    __param(3, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", void 0)
], LedgerController.prototype, "findAll", null);
__decorate([
    (0, roles_decorator_1.Roles)('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN'),
    (0, common_1.Get)('lot/:lotId/timeline'),
    __param(0, (0, common_1.Param)('lotId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LedgerController.prototype, "getTimeline", null);
__decorate([
    (0, roles_decorator_1.Roles)('MANAGER', 'ADMIN'),
    (0, common_1.Get)('export'),
    __param(0, (0, common_1.Query)('lotId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], LedgerController.prototype, "exportCsv", null);
exports.LedgerController = LedgerController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('ledger'),
    __metadata("design:paramtypes", [ledger_service_1.LedgerService])
], LedgerController);
//# sourceMappingURL=ledger.controller.js.map