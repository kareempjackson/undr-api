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
var PaymentsController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const payments_service_1 = require("./payments.service");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const deposit_entity_1 = require("../../entities/deposit.entity");
const user_entity_1 = require("../../entities/user.entity");
const wallet_entity_1 = require("../../entities/wallet.entity");
let PaymentsController = PaymentsController_1 = class PaymentsController {
    constructor(paymentsService, depositRepository, userRepository, walletRepository) {
        this.paymentsService = paymentsService;
        this.depositRepository = depositRepository;
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.logger = new common_1.Logger(PaymentsController_1.name);
    }
    async handleStripeWebhook(req, signature) {
        if (!req.rawBody) {
            this.logger.error("No raw body available for Stripe webhook verification");
            return {
                received: false,
                error: "No raw body available",
            };
        }
        try {
            this.logger.log(`Processing Stripe webhook with signature: ${signature === null || signature === void 0 ? void 0 : signature.substring(0, 10)}...`);
            const event = await this.paymentsService.handleStripeWebhook(req.rawBody, signature);
            if (event.success && event.paymentIntentId) {
                this.logger.log(`Processing successful payment intent: ${event.paymentIntentId}`);
                const deposit = await this.depositRepository.findOne({
                    where: { transactionId: event.paymentIntentId },
                });
                if (deposit) {
                    this.logger.log(`Found deposit: ${deposit.id}, current status: ${deposit.status}, updating to ${event.success ? "COMPLETED" : "FAILED"}`);
                    deposit.status = event.success
                        ? deposit_entity_1.DepositStatus.COMPLETED
                        : deposit_entity_1.DepositStatus.FAILED;
                    await this.depositRepository.save(deposit);
                    this.logger.log(`Deposit status updated to: ${deposit.status}`);
                    console.log("--->>> event", event);
                    if (event.success) {
                        try {
                            console.log("---->> inside");
                            const user = await this.userRepository.findOne({
                                where: { id: deposit.userId },
                                relations: ["wallet"],
                            });
                            if (user && user.wallet) {
                                const previousBalance = user.wallet.balance;
                                this.logger.log(`Updating wallet balance for user ${user.id}. Current balance: ${previousBalance}, adding: ${deposit.amount}`);
                                user.wallet.balance += deposit.amount;
                                await this.walletRepository.save(user.wallet);
                                this.logger.log(`New wallet balance: ${user.wallet.balance} (was: ${previousBalance})`);
                            }
                            else {
                                this.logger.warn(`Could not find wallet for user ${deposit.userId}`);
                            }
                        }
                        catch (error) {
                            console.log("--->> error");
                            this.logger.error(`Error updating wallet balance: ${error.message}`, error.stack);
                        }
                    }
                }
                else {
                    this.logger.warn(`No deposit found for payment intent: ${event.paymentIntentId}`);
                }
            }
            else if (!event.success) {
                this.logger.warn(`Payment failed or unhandled event type: ${JSON.stringify(event)}`);
            }
            return { received: true };
        }
        catch (err) {
            this.logger.error(`Webhook error: ${err.message}`, err.stack);
            return {
                received: false,
                error: err.message,
            };
        }
    }
    async handleCryptoWebhook(payload) {
        try {
            this.logger.log("Processing crypto webhook...");
            const event = await this.paymentsService.handleCryptoWebhook(payload);
            if (event.success && event.paymentId) {
                const deposit = await this.depositRepository.findOne({
                    where: { transactionId: event.paymentId },
                });
                if (deposit) {
                    this.logger.log(`Found deposit: ${deposit.id}, updating status based on ${event.status}`);
                    deposit.status =
                        event.status === "completed"
                            ? deposit_entity_1.DepositStatus.COMPLETED
                            : deposit_entity_1.DepositStatus.FAILED;
                    await this.depositRepository.save(deposit);
                    if (deposit.status === deposit_entity_1.DepositStatus.COMPLETED) {
                        const user = await this.userRepository.findOne({
                            where: { id: deposit.userId },
                            relations: ["wallet"],
                        });
                        if (user && user.wallet) {
                            this.logger.log(`Updating wallet balance for user ${user.id} by +${deposit.amount}`);
                            user.wallet.balance += deposit.amount;
                            await this.walletRepository.save(user.wallet);
                            this.logger.log(`New wallet balance: ${user.wallet.balance}`);
                        }
                        else {
                            this.logger.warn(`Could not find wallet for user ${deposit.userId}`);
                        }
                    }
                }
                else {
                    this.logger.warn(`No deposit found for payment id: ${event.paymentId}`);
                }
            }
            return { received: true };
        }
        catch (err) {
            this.logger.error(`Crypto webhook error: ${err.message}`, err.stack);
            return {
                received: false,
                error: err.message,
            };
        }
    }
};
__decorate([
    (0, common_1.Post)("stripe/webhook"),
    (0, swagger_1.ApiOperation)({ summary: "Handle Stripe webhook events" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Webhook processed successfully" }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)("stripe-signature")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "handleStripeWebhook", null);
__decorate([
    (0, common_1.Post)("crypto/webhook"),
    (0, swagger_1.ApiOperation)({ summary: "Handle crypto payment webhook events" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Webhook processed successfully" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "handleCryptoWebhook", null);
PaymentsController = PaymentsController_1 = __decorate([
    (0, swagger_1.ApiTags)("Payments"),
    (0, common_1.Controller)("payments"),
    __param(1, (0, typeorm_1.InjectRepository)(deposit_entity_1.Deposit)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(wallet_entity_1.Wallet)),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PaymentsController);
exports.PaymentsController = PaymentsController;
//# sourceMappingURL=payments.controller.js.map