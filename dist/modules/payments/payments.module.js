"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const payments_service_1 = require("./payments.service");
const payments_controller_1 = require("./payments.controller");
const stripe_service_1 = require("./stripe.service");
const crypto_service_1 = require("./crypto.service");
const deposit_entity_1 = require("../../entities/deposit.entity");
const user_entity_1 = require("../../entities/user.entity");
const wallet_entity_1 = require("../../entities/wallet.entity");
let PaymentsModule = class PaymentsModule {
};
PaymentsModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule, typeorm_1.TypeOrmModule.forFeature([deposit_entity_1.Deposit, user_entity_1.User, wallet_entity_1.Wallet])],
        controllers: [payments_controller_1.PaymentsController],
        providers: [payments_service_1.PaymentsService, stripe_service_1.StripeService, crypto_service_1.CryptoService],
        exports: [payments_service_1.PaymentsService],
    })
], PaymentsModule);
exports.PaymentsModule = PaymentsModule;
//# sourceMappingURL=payments.module.js.map