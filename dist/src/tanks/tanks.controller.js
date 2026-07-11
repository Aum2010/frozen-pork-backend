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
exports.TanksController = void 0;
const common_1 = require("@nestjs/common");
const tanks_service_1 = require("./tanks.service");
const fill_tank_dto_1 = require("./dto/fill-tank.dto");
const withdraw_tank_dto_1 = require("./dto/withdraw-tank.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let TanksController = class TanksController {
    tanksService;
    constructor(tanksService) {
        this.tanksService = tanksService;
    }
    findAll() {
        return this.tanksService.findAll();
    }
    getFifoSuggest() {
        return this.tanksService.getFifoSuggest();
    }
    fill(tankId, dto, user) {
        return this.tanksService.fill(tankId, dto, user.id);
    }
    withdraw(tankId, dto, user) {
        return this.tanksService.withdraw(tankId, dto, user.id);
    }
    withdrawAuto(dto, user) {
        return this.tanksService.withdrawAuto(dto, user.id);
    }
};
exports.TanksController = TanksController;
__decorate([
    (0, roles_decorator_1.Roles)('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN'),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TanksController.prototype, "findAll", null);
__decorate([
    (0, roles_decorator_1.Roles)('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN'),
    (0, common_1.Get)('fifo-suggest'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TanksController.prototype, "getFifoSuggest", null);
__decorate([
    (0, roles_decorator_1.Roles)('WAREHOUSE', 'MANAGER', 'ADMIN'),
    (0, common_1.Post)(':tankId/fill'),
    __param(0, (0, common_1.Param)('tankId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, fill_tank_dto_1.FillTankDto, Object]),
    __metadata("design:returntype", void 0)
], TanksController.prototype, "fill", null);
__decorate([
    (0, roles_decorator_1.Roles)('PRODUCTION', 'MANAGER', 'ADMIN'),
    (0, common_1.Post)(':tankId/withdraw'),
    __param(0, (0, common_1.Param)('tankId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, withdraw_tank_dto_1.WithdrawTankDto, Object]),
    __metadata("design:returntype", void 0)
], TanksController.prototype, "withdraw", null);
__decorate([
    (0, roles_decorator_1.Roles)('PRODUCTION', 'MANAGER', 'ADMIN'),
    (0, common_1.Post)('withdraw-auto'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [withdraw_tank_dto_1.WithdrawTankDto, Object]),
    __metadata("design:returntype", void 0)
], TanksController.prototype, "withdrawAuto", null);
exports.TanksController = TanksController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('tanks'),
    __metadata("design:paramtypes", [tanks_service_1.TanksService])
], TanksController);
//# sourceMappingURL=tanks.controller.js.map