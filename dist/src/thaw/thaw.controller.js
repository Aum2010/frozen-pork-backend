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
exports.ThawController = void 0;
const common_1 = require("@nestjs/common");
const thaw_service_1 = require("./thaw.service");
const create_thaw_dto_1 = require("./dto/create-thaw.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const start_thaw_auto_dto_1 = require("./dto/start-thaw-auto.dto");
let ThawController = class ThawController {
    thawService;
    constructor(thawService) {
        this.thawService = thawService;
    }
    startThaw(dto, user) {
        return this.thawService.startThaw(dto, user.id);
    }
    getPending() {
        return this.thawService.getPending();
    }
    getWaitingTank() {
        return this.thawService.getWaitingTank();
    }
    confirmReady(id, user) {
        return this.thawService.confirmReady(id, user.id);
    }
    startThawAuto(dto, user) {
        return this.thawService.startThawAuto(dto.totalWeightKg, user.id);
    }
};
exports.ThawController = ThawController;
__decorate([
    (0, roles_decorator_1.Roles)('WAREHOUSE', 'MANAGER', 'ADMIN'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_thaw_dto_1.CreateThawDto, Object]),
    __metadata("design:returntype", void 0)
], ThawController.prototype, "startThaw", null);
__decorate([
    (0, roles_decorator_1.Roles)('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN'),
    (0, common_1.Get)('pending'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ThawController.prototype, "getPending", null);
__decorate([
    (0, roles_decorator_1.Roles)('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN'),
    (0, common_1.Get)('waiting-tank'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ThawController.prototype, "getWaitingTank", null);
__decorate([
    (0, roles_decorator_1.Roles)('WAREHOUSE', 'MANAGER', 'ADMIN'),
    (0, common_1.Post)(':id/confirm-ready'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ThawController.prototype, "confirmReady", null);
__decorate([
    (0, roles_decorator_1.Roles)('WAREHOUSE', 'MANAGER', 'ADMIN'),
    (0, common_1.Post)('auto'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [start_thaw_auto_dto_1.StartThawAutoDto, Object]),
    __metadata("design:returntype", void 0)
], ThawController.prototype, "startThawAuto", null);
exports.ThawController = ThawController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('thaw'),
    __metadata("design:paramtypes", [thaw_service_1.ThawService])
], ThawController);
//# sourceMappingURL=thaw.controller.js.map