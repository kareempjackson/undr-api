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
var WebhookController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const swagger_1 = require("@nestjs/swagger");
const escrow_service_1 = require("../modules/escrow/escrow.service");
const crypto = require("crypto");
let WebhookController = WebhookController_1 = class WebhookController {
    constructor(escrowService, configService) {
        this.escrowService = escrowService;
        this.configService = configService;
        this.logger = new common_1.Logger(WebhookController_1.name);
        this.stripeWebhookSecret = this.configService.get("STRIPE_WEBHOOK_SECRET");
    }
    async handleStripeWebhook(signature, rawBody) {
        try {
            if (!this.stripeWebhookSecret || !signature) {
                this.logger.warn("Missing Stripe webhook secret or signature");
                return { received: true };
            }
            const payload = Buffer.isBuffer(rawBody)
                ? rawBody
                : Buffer.from(rawBody.toString());
            const expectedSignature = crypto
                .createHmac("sha256", this.stripeWebhookSecret)
                .update(payload)
                .digest("hex");
            if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(`sha256=${expectedSignature}`))) {
                this.logger.warn("Invalid Stripe webhook signature");
                return { received: true };
            }
            const event = JSON.parse(payload.toString());
            switch (event.type) {
                case "charge.dispute.created":
                    await this.handleDisputeCreated(event.data.object);
                    break;
            }
            return { received: true };
        }
        catch (error) {
            this.logger.error(`Error processing Stripe webhook: ${error.message}`, error.stack);
            return { received: true };
        }
    }
    async handleDisputeCreated(dispute) {
        this.logger.log(`Handling dispute created: ${dispute.id}`);
        const paymentIntentId = dispute.payment_intent;
        if (!paymentIntentId) {
            this.logger.warn(`Dispute ${dispute.id} has no associated payment intent`);
            return;
        }
        try {
            await this.escrowService.handleChargeback(paymentIntentId, dispute.id, {
                amount: dispute.amount,
                currency: dispute.currency,
                reason: dispute.reason,
                status: dispute.status,
                evidence_details: dispute.evidence_details,
                created: dispute.created,
            });
            this.logger.log(`Successfully processed chargeback for payment intent ${paymentIntentId}`);
        }
        catch (error) {
            this.logger.error(`Error handling chargeback for payment intent ${paymentIntentId}: ${error.message}`, error.stack);
        }
    }
};
__decorate([
    (0, common_1.Post)("stripe"),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Headers)("stripe-signature")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WebhookController.prototype, "handleStripeWebhook", null);
WebhookController = WebhookController_1 = __decorate([
    (0, common_1.Controller)("webhook"),
    __metadata("design:paramtypes", [escrow_service_1.EscrowService,
        config_1.ConfigService])
], WebhookController);
exports.WebhookController = WebhookController;
//# sourceMappingURL=webhook.controller.js.map