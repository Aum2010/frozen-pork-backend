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
exports.SmartAdvisoryController = void 0;
const common_1 = require("@nestjs/common");
const smart_advisory_service_1 = require("./smart-advisory.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
let SmartAdvisoryController = class SmartAdvisoryController {
    advisoryService;
    constructor(advisoryService) {
        this.advisoryService = advisoryService;
    }
    getStatus() {
        return this.advisoryService.getStatus();
    }
    checkReorder() {
        return this.advisoryService.checkReorderPoint();
    }
    checkThaw() {
        return this.advisoryService.checkThawReminder();
    }
    checkTankReady() {
        return this.advisoryService.checkTankReady();
    }
    checkExpiry() {
        return this.advisoryService.checkExpiry();
    }
};
exports.SmartAdvisoryController = SmartAdvisoryController;
__decorate([
    (0, roles_decorator_1.Roles)('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN'),
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SmartAdvisoryController.prototype, "getStatus", null);
__decorate([
    (0, roles_decorator_1.Roles)('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN'),
    (0, common_1.Get)('reorder'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SmartAdvisoryController.prototype, "checkReorder", null);
__decorate([
    (0, roles_decorator_1.Roles)('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN'),
    (0, common_1.Get)('thaw-reminder'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SmartAdvisoryController.prototype, "checkThaw", null);
__decorate([
    (0, roles_decorator_1.Roles)('WAREHOUSE', 'PRODUCTION', 'MANAGER', 'ADMIN'),
    (0, common_1.Get)('tank-ready'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SmartAdvisoryController.prototype, "checkTankReady", null);
__decorate([
    (0, common_1.Get)('expiry'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SmartAdvisoryController.prototype, "checkExpiry", null);
exports.SmartAdvisoryController = SmartAdvisoryController = __decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('advisory'),
    __metadata("design:paramtypes", [smart_advisory_service_1.SmartAdvisoryService])
], SmartAdvisoryController);
//# sourceMappingURL=smart-advisory.controller.js.map