"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartAdvisoryModule = void 0;
const common_1 = require("@nestjs/common");
const smart_advisory_service_1 = require("./smart-advisory.service");
const smart_advisory_controller_1 = require("./smart-advisory.controller");
let SmartAdvisoryModule = class SmartAdvisoryModule {
};
exports.SmartAdvisoryModule = SmartAdvisoryModule;
exports.SmartAdvisoryModule = SmartAdvisoryModule = __decorate([
    (0, common_1.Module)({
        controllers: [smart_advisory_controller_1.SmartAdvisoryController],
        providers: [smart_advisory_service_1.SmartAdvisoryService],
        exports: [smart_advisory_service_1.SmartAdvisoryService],
    })
], SmartAdvisoryModule);
//# sourceMappingURL=smart-advisory.module.js.map