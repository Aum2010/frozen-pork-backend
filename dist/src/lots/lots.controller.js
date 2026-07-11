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
exports.LotsController = void 0;
const common_1 = require("@nestjs/common");
const lots_service_1 = require("./lots.service");
const create_lot_dto_1 = require("./dto/create-lot.dto");
const assign_zone_dto_1 = require("./dto/assign-zone.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let LotsController = class LotsController {
    lotsService;
    constructor(lotsService) {
        this.lotsService = lotsService;
    }
    create(dto, user) {
        return this.lotsService.create(dto, user.id);
    }
    findAll(status) {
        return this.lotsService.findAll(status);
    }
    findOne(id) {
        return this.lotsService.findOne(id);
    }
    assignZone(id, dto, user) {
        return this.lotsService.assignZone(id, dto, user.id);
    }
};
exports.LotsController = LotsController;
__decorate([
    (0, roles_decorator_1.Roles)('WAREHOUSE', 'MANAGER', 'ADMIN'),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lot_dto_1.CreateLotDto, Object]),
    __metadata("design:returntype", void 0)
], LotsController.prototype, "create", null);
__decorate([
    (0, roles_decorator_1.Roles)('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN'),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LotsController.prototype, "findAll", null);
__decorate([
    (0, roles_decorator_1.Roles)('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN'),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], LotsController.prototype, "findOne", null);
__decorate([
    (0, roles_decorator_1.Roles)('WAREHOUSE', 'MANAGER', 'ADMIN'),
    (0, common_1.Patch)(':id/zone'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, assign_zone_dto_1.AssignZoneDto, Object]),
    __metadata("design:returntype", void 0)
], LotsController.prototype, "assignZone", null);
exports.LotsController = LotsController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('lots'),
    __metadata("design:paramtypes", [lots_service_1.LotsService])
], LotsController);
//# sourceMappingURL=lots.controller.js.map