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
var FansService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FansService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const payments_service_1 = require("../payments/payments.service");
const user_entity_1 = require("../../entities/user.entity");
const wallet_entity_1 = require("../../entities/wallet.entity");
const payment_entity_1 = require("../../entities/payment.entity");
const deposit_entity_1 = require("../../entities/deposit.entity");
const alias_service_1 = require("../common/services/alias.service");
let FansService = FansService_1 = class FansService {
    constructor(userRepository, walletRepository, paymentRepository, depositRepository, paymentsService, aliasService) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.paymentRepository = paymentRepository;
        this.depositRepository = depositRepository;
        this.paymentsService = paymentsService;
        this.aliasService = aliasService;
        this.logger = new common_1.Logger(FansService_1.name);
    }
    async deposit(userId, depositDto) {
        const { amount, paymentMethod } = depositDto;
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ["wallet"],
        });
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        const deposit = this.depositRepository.create({
            amount,
            method: paymentMethod,
            status: deposit_entity_1.DepositStatus.PENDING,
            userId: user.id,
        });
        await this.depositRepository.save(deposit);
        let paymentDetails;
        if (paymentMethod === payment_entity_1.PaymentMethod.CREDIT_CARD) {
            paymentDetails = await this.paymentsService.createStripePaymentIntent(amount);
            await this.depositRepository.update(deposit.id, {
                transactionId: paymentDetails.id,
            });
        }
        else if (paymentMethod === payment_entity_1.PaymentMethod.CRYPTO_BTC ||
            paymentMethod === payment_entity_1.PaymentMethod.CRYPTO_ETH ||
            paymentMethod === payment_entity_1.PaymentMethod.CRYPTO_USDT) {
            paymentDetails = await this.paymentsService.createCryptoPayment(amount, paymentMethod);
        }
        else {
            throw new common_1.BadRequestException("Unsupported payment method");
        }
        return Object.assign({ depositId: deposit.id }, paymentDetails);
    }
    async getDepositStatus(userId, depositId) {
        const deposit = await this.depositRepository.findOne({
            where: { id: depositId, userId },
            relations: ["user"],
        });
        if (!deposit) {
            throw new common_1.NotFoundException(`Deposit with ID ${depositId} not found or does not belong to user`);
        }
        return {
            status: deposit.status,
            amount: deposit.amount,
            method: deposit.method,
            transactionId: deposit.transactionId,
            createdAt: deposit.createdAt,
        };
    }
    async completeDeposit(userId, completeDepositDto) {
        const { depositId, paymentIntentId } = completeDepositDto;
        const deposit = await this.depositRepository.findOne({
            where: { id: depositId, userId },
            relations: ["user"],
        });
        if (!deposit) {
            throw new common_1.NotFoundException(`Deposit with ID ${depositId} not found or does not belong to user`);
        }
        if (deposit.status === deposit_entity_1.DepositStatus.COMPLETED) {
            const wallet = await this.walletRepository.findOne({
                where: { userId: deposit.userId },
            });
            return {
                message: "Deposit already completed",
                status: deposit.status,
                walletBalance: (wallet === null || wallet === void 0 ? void 0 : wallet.balance) || 0,
                success: true,
            };
        }
        deposit.status = deposit_entity_1.DepositStatus.COMPLETED;
        deposit.transactionId = paymentIntentId;
        const wallet = await this.walletRepository.findOne({
            where: { userId: deposit.userId },
        });
        if (!wallet) {
            throw new common_1.NotFoundException(`Wallet not found for user ${deposit.userId}`);
        }
        wallet.balance += deposit.amount;
        await this.walletRepository.save(wallet);
        await this.depositRepository.save(deposit);
        this.logger.log(`Manual deposit completion: User ${userId} deposit ${depositId} completed with payment ${paymentIntentId}`);
        return {
            message: "Deposit completed successfully",
            status: deposit.status,
            walletBalance: wallet.balance,
            success: true,
        };
    }
    async payCreator(userId, payDto) {
        const { creatorId, amount, description } = payDto;
        const [sender, recipient] = await Promise.all([
            this.userRepository.findOne({
                where: { id: userId },
                relations: ["wallet"],
            }),
            this.userRepository.findOne({
                where: { id: creatorId },
                relations: ["wallet"],
            }),
        ]);
        if (!sender) {
            throw new common_1.NotFoundException("Sender not found");
        }
        if (!recipient) {
            throw new common_1.NotFoundException("Creator not found");
        }
        const [senderAlias, recipientAlias] = await Promise.all([
            this.aliasService.generateUniqueAlias(userId),
            this.aliasService.generateUniqueAlias(creatorId),
        ]);
        if (!sender.wallet) {
            throw new common_1.BadRequestException("Sender has no wallet");
        }
        if (!recipient.wallet) {
            throw new common_1.BadRequestException("Creator has no wallet");
        }
        if (recipient.role !== user_entity_1.UserRole.CREATOR) {
            throw new common_1.BadRequestException("Recipient is not a creator");
        }
        if (sender.wallet.balance < amount) {
            throw new common_1.BadRequestException("Insufficient balance");
        }
        const payment = this.paymentRepository.create({
            amount,
            status: payment_entity_1.PaymentStatus.COMPLETED,
            method: payment_entity_1.PaymentMethod.WALLET,
            description: description || "Payment to creator",
            fromUserId: sender.id,
            toUserId: recipient.id,
            fromAlias: senderAlias,
            toAlias: recipientAlias,
            metadata: {
                description: description,
                method: payment_entity_1.PaymentMethod.WALLET,
            },
        });
        await this.paymentRepository.save(payment);
        sender.wallet.balance -= amount;
        recipient.wallet.balance += amount;
        await this.walletRepository.save([sender.wallet, recipient.wallet]);
        return {
            success: true,
            paymentId: payment.id,
            fromAlias: senderAlias,
            toAlias: recipientAlias,
            amount,
            status: payment.status,
            timestamp: payment.createdAt,
            metadata: payment.metadata,
        };
    }
    async getTransactionHistory(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        const userAlias = await this.aliasService.generateUniqueAlias(userId);
        const payments = await this.paymentRepository.find({
            where: [{ fromUserId: userId }, { toUserId: userId }],
            order: { createdAt: "DESC" },
            relations: ["fromUser", "toUser"],
        });
        const transactions = await Promise.all(payments.map(async (payment) => {
            if (!payment.fromAlias) {
                payment.fromAlias = await this.aliasService.generateUniqueAlias(payment.fromUserId);
            }
            if (!payment.toAlias) {
                payment.toAlias = await this.aliasService.generateUniqueAlias(payment.toUserId);
            }
            return {
                id: payment.id,
                amount: payment.amount,
                status: payment.status,
                description: payment.description,
                fromAlias: payment.fromAlias,
                toAlias: payment.toAlias,
                direction: payment.fromUserId === userId ? "outgoing" : "incoming",
                timestamp: payment.createdAt,
                method: payment.method,
                metadata: payment.metadata || {},
            };
        }));
        return {
            userAlias,
            transactions,
        };
    }
    async payByAlias(userId, payDto) {
        const sender = await this.userRepository.findOne({
            where: { id: userId },
            relations: ["wallet"],
        });
        if (!sender) {
            throw new common_1.NotFoundException("User not found");
        }
        const senderAlias = await this.aliasService.generateUniqueAlias(userId);
        const recipient = await this.aliasService.findUserByAlias(payDto.toAlias);
        if (!sender.wallet) {
            throw new common_1.BadRequestException("Sender has no wallet");
        }
        if (!recipient.wallet) {
            throw new common_1.BadRequestException("Recipient has no wallet");
        }
        if (recipient.role !== user_entity_1.UserRole.CREATOR) {
            throw new common_1.BadRequestException("Recipient is not a creator");
        }
        if (sender.wallet.balance < payDto.amount) {
            throw new common_1.BadRequestException("Insufficient balance");
        }
        const metadata = payDto.metadata || {};
        if (payDto.description) {
            metadata.description = payDto.description;
        }
        metadata.method = payment_entity_1.PaymentMethod.WALLET;
        const payment = this.paymentRepository.create({
            amount: payDto.amount,
            status: payment_entity_1.PaymentStatus.COMPLETED,
            method: payment_entity_1.PaymentMethod.WALLET,
            description: payDto.description || "Payment",
            fromUserId: sender.id,
            toUserId: recipient.id,
            fromAlias: senderAlias,
            toAlias: payDto.toAlias,
            metadata: metadata,
        });
        await this.paymentRepository.save(payment);
        sender.wallet.balance -= payDto.amount;
        recipient.wallet.balance += payDto.amount;
        await this.walletRepository.save([sender.wallet, recipient.wallet]);
        return {
            success: true,
            paymentId: payment.id,
            fromAlias: senderAlias,
            toAlias: payDto.toAlias,
            amount: payDto.amount,
            status: payment.status,
            timestamp: payment.createdAt,
            metadata: payment.metadata,
        };
    }
};
FansService = FansService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(wallet_entity_1.Wallet)),
    __param(2, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(3, (0, typeorm_1.InjectRepository)(deposit_entity_1.Deposit)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        payments_service_1.PaymentsService,
        alias_service_1.AliasService])
], FansService);
exports.FansService = FansService;
//# sourceMappingURL=fans.service.js.map