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
exports.ThreeDsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const payment_entity_1 = require("../../entities/payment.entity");
const common_enums_1 = require("../../entities/common.enums");
const stripe_1 = require("stripe");
let ThreeDsService = class ThreeDsService {
    constructor(paymentRepository, configService) {
        this.paymentRepository = paymentRepository;
        this.configService = configService;
        this.stripe = new stripe_1.default(this.configService.get("STRIPE_SECRET_KEY"), {
            apiVersion: "2022-08-01",
        });
    }
    async create3dsPaymentIntent(amount, currency, paymentMethodId, customerId, metadata) {
        var _a;
        try {
            const paymentIntentParams = {
                amount: Math.round(amount * 100),
                currency,
                payment_method: paymentMethodId,
                confirmation_method: "manual",
                confirm: true,
                return_url: `${this.configService.get("FRONTEND_URL")}/payment/confirmation`,
                use_stripe_sdk: true,
                metadata,
            };
            if (customerId) {
                paymentIntentParams.customer = customerId;
            }
            const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentParams);
            const requires3ds = paymentIntent.status === "requires_action" &&
                ((_a = paymentIntent.next_action) === null || _a === void 0 ? void 0 : _a.type) === "use_stripe_sdk";
            return {
                clientSecret: paymentIntent.client_secret,
                requires3ds,
                paymentIntentId: paymentIntent.id,
            };
        }
        catch (error) {
            console.error("Error creating 3DS payment intent:", error);
            throw new Error(`Failed to create payment intent: ${error.message}`);
        }
    }
    async updatePaymentWith3dsStatus(paymentId, threeDsStatus, threeDsUrl, threeDsResult) {
        const payment = await this.paymentRepository.findOneBy({ id: paymentId });
        if (!payment) {
            throw new Error("Payment not found");
        }
        payment.threeDsStatus = threeDsStatus;
        if (threeDsUrl) {
            payment.threeDsUrl = threeDsUrl;
        }
        if (threeDsResult) {
            payment.threeDsResult = threeDsResult;
        }
        return this.paymentRepository.save(payment);
    }
    async check3dsConfirmationStatus(paymentIntentId) {
        try {
            const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
            let threeDsStatus = common_enums_1.ThreeDsStatus.NOT_REQUIRED;
            if (paymentIntent.status === "succeeded") {
                threeDsStatus = common_enums_1.ThreeDsStatus.AUTHENTICATED;
            }
            else if (paymentIntent.status === "requires_payment_method") {
                threeDsStatus = common_enums_1.ThreeDsStatus.FAILED;
            }
            else if (paymentIntent.status === "requires_action") {
                threeDsStatus = common_enums_1.ThreeDsStatus.REQUIRED;
            }
            else if (paymentIntent.status === "canceled") {
                threeDsStatus = common_enums_1.ThreeDsStatus.REJECTED;
            }
            return {
                status: paymentIntent.status,
                threeDsStatus,
                paymentIntent,
            };
        }
        catch (error) {
            console.error("Error checking 3DS confirmation status:", error);
            throw new Error(`Failed to check 3DS status: ${error.message}`);
        }
    }
};
ThreeDsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        config_1.ConfigService])
], ThreeDsService);
exports.ThreeDsService = ThreeDsService;
//# sourceMappingURL=three-ds.service.js.map