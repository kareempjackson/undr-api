"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FansModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const fans_controller_1 = require("./fans.controller");
const fans_service_1 = require("./fans.service");
const payments_module_1 = require("../payments/payments.module");
const entities_1 = require("../../entities");
const common_module_1 = require("../common/common.module");
let FansModule = class FansModule {
};
FansModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([entities_1.User, entities_1.Wallet, entities_1.Payment, entities_1.Deposit]),
            payments_module_1.PaymentsModule,
            common_module_1.CommonModule,
        ],
        controllers: [fans_controller_1.FansController],
        providers: [fans_service_1.FansService],
        exports: [fans_service_1.FansService],
    })
], FansModule);
exports.FansModule = FansModule;
//# sourceMappingURL=fans.module.js.map