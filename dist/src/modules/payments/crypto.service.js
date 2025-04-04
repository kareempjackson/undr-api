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
exports.CryptoService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const common_enums_1 = require("../../entities/common.enums");
const uuid_1 = require("uuid");
let CryptoService = class CryptoService {
    constructor(configService) {
        this.configService = configService;
    }
    async createPayment(amount, method) {
        const currency = this.mapPaymentMethodToCurrency(method);
        const exchangeRate = await this.getExchangeRate(currency);
        const cryptoAmount = amount / exchangeRate;
        return {
            id: (0, uuid_1.v4)(),
            paymentAddress: this.getMockAddress(method),
            paymentAmount: cryptoAmount.toFixed(8),
            currency: currency,
            expiresAt: new Date(Date.now() + 3600000).toISOString(),
        };
    }
    async handleWebhook(payload) {
        return {
            success: true,
            paymentId: payload.payment_id,
            status: payload.payment_status,
            actualAmount: payload.actually_paid,
            currency: payload.pay_currency,
        };
    }
    mapPaymentMethodToCurrency(method) {
        switch (method) {
            case common_enums_1.PaymentMethod.CRYPTO_BTC:
                return "BTC";
            case common_enums_1.PaymentMethod.CRYPTO_ETH:
                return "ETH";
            case common_enums_1.PaymentMethod.CRYPTO_USDT:
                return "USDT";
            default:
                return "BTC";
        }
    }
    async getExchangeRate(currency) {
        switch (currency) {
            case "BTC":
                return 30000;
            case "ETH":
                return 2000;
            case "USDT":
                return 1;
            default:
                return 1;
        }
    }
    getMockAddress(method) {
        switch (method) {
            case common_enums_1.PaymentMethod.CRYPTO_BTC:
                return "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy";
            case common_enums_1.PaymentMethod.CRYPTO_ETH:
                return "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
            case common_enums_1.PaymentMethod.CRYPTO_USDT:
                return "TKrjq8gpLKD3WUYv5pNpgDmzQFWbZbfQge";
            default:
                return "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy";
        }
    }
};
CryptoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CryptoService);
exports.CryptoService = CryptoService;
//# sourceMappingURL=crypto.service.js.map