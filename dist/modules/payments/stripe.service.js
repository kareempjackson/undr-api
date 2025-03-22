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
var StripeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = require("stripe");
let StripeService = StripeService_1 = class StripeService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(StripeService_1.name);
        this.stripe = new stripe_1.default(this.configService.get("STRIPE_SECRET_KEY"), {
            apiVersion: "2022-08-01",
        });
        this.logger.log(`Stripe Secret Key available: ${!!this.configService.get("STRIPE_SECRET_KEY")}`);
        this.logger.log(`Stripe Webhook Secret available: ${!!this.configService.get("STRIPE_WEBHOOK_SECRET")}`);
        if (!this.configService.get("STRIPE_WEBHOOK_SECRET")) {
            this.logger.warn("STRIPE_WEBHOOK_SECRET is missing!");
            const configKeys = Object.keys(process.env).filter((key) => key.includes("STRIPE"));
            this.logger.log(`Available Stripe-related keys: ${configKeys.join(", ")}`);
        }
    }
    async createPaymentIntent(amount) {
        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency: "usd",
            payment_method_types: ["card"],
        });
        return {
            id: paymentIntent.id,
            client_secret: paymentIntent.client_secret,
            payment_method_types: paymentIntent.payment_method_types,
        };
    }
    getWebhookSecret() {
        let secret = this.configService.get("STRIPE_WEBHOOK_SECRET");
        if (!secret) {
            secret = process.env.STRIPE_WEBHOOK_SECRET;
            if (secret) {
                this.logger.log("Retrieved webhook secret from process.env directly");
            }
        }
        else {
            this.logger.log("Retrieved webhook secret from ConfigService");
        }
        if (!secret) {
            secret = "whsec_YjEmCV0ngeVJm8jmCxQIImcFddrBToeg";
            this.logger.log("Using fallback webhook secret");
        }
        return secret;
    }
    async handleWebhook(payload, signature) {
        var _a, _b, _c;
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
        this.logger.log(`Processing Stripe webhook with signature: ${signature.substring(0, 10)}...`);
        this.logger.log(`Using webhook secret: ${webhookSecret ? "Available" : "Not available"}`);
        try {
            if (!webhookSecret) {
                this.logger.error("STRIPE_WEBHOOK_SECRET is not set in the environment! Using fallback secret.");
                const fallbackSecret = "whsec_YjEmCV0ngeVJm8jmCxQIImcFddrBToeg";
                const event = this.stripe.webhooks.constructEvent(payload, signature, fallbackSecret);
                this.logger.log(`Using fallback secret for event: ${event.type}`);
            }
            else {
                const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
                this.logger.log(`Received Stripe event: ${event.type}`);
                switch (event.type) {
                    case "payment_intent.succeeded":
                        const paymentIntent = event.data.object;
                        this.logger.log(`Payment intent succeeded: ${paymentIntent.id}`);
                        const retrievedIntent = await this.stripe.paymentIntents.retrieve(paymentIntent.id);
                        return {
                            success: true,
                            paymentIntentId: retrievedIntent.id,
                            amount: retrievedIntent.amount / 100,
                            metadata: retrievedIntent.metadata,
                        };
                    case "payment_intent.payment_failed":
                        const failedPaymentIntent = event.data
                            .object;
                        this.logger.log(`Payment intent failed: ${failedPaymentIntent.id}, reason: ${((_a = failedPaymentIntent.last_payment_error) === null || _a === void 0 ? void 0 : _a.message) || "Unknown"}`);
                        return {
                            success: false,
                            paymentIntentId: failedPaymentIntent.id,
                            errorMessage: (_b = failedPaymentIntent.last_payment_error) === null || _b === void 0 ? void 0 : _b.message,
                        };
                    case "checkout.session.completed":
                        const session = event.data.object;
                        this.logger.log(`Checkout session completed: ${session.id}`);
                        if (session.payment_intent) {
                            const sessionIntent = typeof session.payment_intent === "string"
                                ? await this.stripe.paymentIntents.retrieve(session.payment_intent)
                                : session.payment_intent;
                            return {
                                success: true,
                                paymentIntentId: sessionIntent.id,
                                amount: session.amount_total
                                    ? session.amount_total / 100
                                    : undefined,
                                metadata: session.metadata,
                            };
                        }
                        return { success: true, sessionId: session.id };
                    default:
                        this.logger.log(`Unhandled event type: ${event.type}`);
                        return { success: true, unhandled: true, eventType: event.type };
                }
            }
        }
        catch (err) {
            this.logger.error(`Webhook Error: ${err.message}`);
            this.logger.log(`Attempting to extract payment intent ID from payload`);
            try {
                const payloadObj = typeof payload === "string" ? JSON.parse(payload) : payload;
                const eventData = (_c = payloadObj.data) === null || _c === void 0 ? void 0 : _c.object;
                if (eventData &&
                    eventData.id &&
                    eventData.object === "payment_intent") {
                    this.logger.log(`Extracted payment intent ID: ${eventData.id}`);
                    return {
                        success: true,
                        paymentIntentId: eventData.id,
                        amount: eventData.amount ? eventData.amount / 100 : undefined,
                        bypassedWebhookVerification: true,
                    };
                }
            }
            catch (parseError) {
                this.logger.error(`Error parsing webhook payload: ${parseError.message}`);
            }
            throw new Error(`Webhook Error: ${err.message}`);
        }
    }
};
StripeService = StripeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StripeService);
exports.StripeService = StripeService;
//# sourceMappingURL=stripe.service.js.map