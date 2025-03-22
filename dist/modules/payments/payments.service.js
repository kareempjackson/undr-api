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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_service_1 = require("./stripe.service");
const crypto_service_1 = require("./crypto.service");
let PaymentsService = class PaymentsService {
    constructor(configService, stripeService, cryptoService) {
        this.configService = configService;
        this.stripeService = stripeService;
        this.cryptoService = cryptoService;
    }
    async createStripePaymentIntent(amount) {
        return this.stripeService.createPaymentIntent(amount);
    }
    async createCryptoPayment(amount, method) {
        return this.cryptoService.createPayment(amount, method);
    }
    async handleStripeWebhook(payload, signature) {
        return this.stripeService.handleWebhook(payload, signature);
    }
    async handleCryptoWebhook(payload) {
        return this.cryptoService.handleWebhook(payload);
    }
};
PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        stripe_service_1.StripeService,
        crypto_service_1.CryptoService])
], PaymentsService);
exports.PaymentsService = PaymentsService;
//# sourceMappingURL=payments.service.js.map