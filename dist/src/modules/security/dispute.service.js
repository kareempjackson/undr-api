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
exports.DisputeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const dispute_entity_1 = require("../../entities/dispute.entity");
const payment_entity_1 = require("../../entities/payment.entity");
const user_entity_1 = require("../../entities/user.entity");
let DisputeService = class DisputeService {
    constructor(disputeRepository, paymentRepository, userRepository) {
        this.disputeRepository = disputeRepository;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
    }
    async createDispute(params) {
        const { paymentId, filedByUserId, reason, description, evidenceFiles } = params;
        const payment = await this.paymentRepository.findOne({
            where: { id: paymentId },
            relations: ["fromUser", "toUser"],
        });
        if (!payment) {
            throw new Error("Payment not found");
        }
        if (payment.fromUserId !== filedByUserId &&
            payment.toUserId !== filedByUserId) {
            throw new Error("User is not involved in this payment");
        }
        const existingDispute = await this.disputeRepository.findOne({
            where: { paymentId },
        });
        if (existingDispute) {
            throw new Error("Dispute already exists for this payment");
        }
        const dispute = new dispute_entity_1.Dispute();
        dispute.paymentId = paymentId;
        dispute.filedByUserId = filedByUserId;
        dispute.reason = reason;
        dispute.description = description;
        dispute.status = dispute_entity_1.DisputeStatus.OPEN;
        if (evidenceFiles) {
            dispute.evidenceFiles = evidenceFiles;
        }
        await this.paymentRepository.update(paymentId, {
            status: payment_entity_1.PaymentStatus.DISPUTED,
            hasDispute: true,
        });
        dispute.responsePacket = this.generateResponsePacket(payment);
        return this.disputeRepository.save(dispute);
    }
    generateResponsePacket(payment) {
        var _a, _b, _c, _d;
        return {
            paymentDetails: {
                id: payment.id,
                amount: payment.amount,
                date: payment.createdAt,
                description: payment.description,
                method: payment.method,
                status: payment.status,
            },
            customerInfo: {
                userId: payment.fromUserId,
                email: (_a = payment.fromUser) === null || _a === void 0 ? void 0 : _a.email,
                name: (_b = payment.fromUser) === null || _b === void 0 ? void 0 : _b.name,
            },
            merchantInfo: {
                userId: payment.toUserId,
                email: (_c = payment.toUser) === null || _c === void 0 ? void 0 : _c.email,
                name: (_d = payment.toUser) === null || _d === void 0 ? void 0 : _d.name,
            },
            transactionEvidence: {
                receiptData: payment.receiptData || {},
                invoiceDetails: payment.invoiceDetails || {},
                ipAddress: payment.ipAddress,
                deviceInfo: payment.deviceInfo,
                browserInfo: payment.browserInfo,
                isHighRisk: payment.isHighRisk,
                riskScore: payment.riskScore,
            },
            authenticationData: {
                threeDsStatus: payment.threeDsStatus,
                threeDsResult: payment.threeDsResult,
            },
            timestamp: new Date(),
        };
    }
    async addEvidence(disputeId, userId, evidence) {
        const dispute = await this.disputeRepository.findOne({
            where: { id: disputeId },
            relations: ["payment"],
        });
        if (!dispute) {
            throw new Error("Dispute not found");
        }
        const payment = dispute.payment;
        if (payment.fromUserId !== userId && payment.toUserId !== userId) {
            throw new Error("User is not involved in this payment");
        }
        if ([
            dispute_entity_1.DisputeStatus.CLOSED,
            dispute_entity_1.DisputeStatus.RESOLVED_FOR_CUSTOMER,
            dispute_entity_1.DisputeStatus.RESOLVED_FOR_MERCHANT,
        ].includes(dispute.status)) {
            throw new Error("Cannot add evidence to a closed or resolved dispute");
        }
        dispute.status = dispute_entity_1.DisputeStatus.UNDER_REVIEW;
        if (!dispute.evidenceFiles) {
            dispute.evidenceFiles = [];
        }
        dispute.evidenceFiles = [...dispute.evidenceFiles, ...evidence.files];
        if (!dispute.responsePacket) {
            dispute.responsePacket = {};
        }
        const responsePacket = dispute.responsePacket;
        if (!responsePacket.evidence) {
            responsePacket.evidence = [];
        }
        responsePacket.evidence.push({
            description: evidence.description,
            files: evidence.files,
            addedBy: userId,
            timestamp: new Date(),
        });
        dispute.responsePacket = responsePacket;
        return this.disputeRepository.save(dispute);
    }
    async resolveDispute(params) {
        const { disputeId, resolvedByUserId, resolveForCustomer, resolutionNotes } = params;
        const dispute = await this.disputeRepository.findOne({
            where: { id: disputeId },
            relations: ["payment"],
        });
        if (!dispute) {
            throw new Error("Dispute not found");
        }
        if ([
            dispute_entity_1.DisputeStatus.CLOSED,
            dispute_entity_1.DisputeStatus.RESOLVED_FOR_CUSTOMER,
            dispute_entity_1.DisputeStatus.RESOLVED_FOR_MERCHANT,
        ].includes(dispute.status)) {
            throw new Error("Dispute is already resolved or closed");
        }
        dispute.status = resolveForCustomer
            ? dispute_entity_1.DisputeStatus.RESOLVED_FOR_CUSTOMER
            : dispute_entity_1.DisputeStatus.RESOLVED_FOR_MERCHANT;
        dispute.resolvedByUserId = resolvedByUserId;
        dispute.resolutionNotes = resolutionNotes;
        dispute.resolvedAt = new Date();
        if (dispute.payment) {
            const newStatus = resolveForCustomer
                ? payment_entity_1.PaymentStatus.REFUNDED
                : payment_entity_1.PaymentStatus.COMPLETED;
            await this.paymentRepository.update(dispute.payment.id, {
                status: newStatus,
            });
        }
        return this.disputeRepository.save(dispute);
    }
    async getDisputes(filters) {
        const { status, userId, limit = 10, offset = 0 } = filters;
        const queryBuilder = this.disputeRepository
            .createQueryBuilder("dispute")
            .leftJoinAndSelect("dispute.payment", "payment")
            .leftJoinAndSelect("dispute.filedByUser", "filedByUser")
            .leftJoinAndSelect("dispute.resolvedByUser", "resolvedByUser");
        if (status) {
            queryBuilder.andWhere("dispute.status = :status", { status });
        }
        if (userId) {
            queryBuilder.andWhere("(payment.fromUserId = :userId OR payment.toUserId = :userId)", { userId });
        }
        const total = await queryBuilder.getCount();
        const disputes = await queryBuilder
            .orderBy("dispute.createdAt", "DESC")
            .take(limit)
            .skip(offset)
            .getMany();
        return { disputes, total };
    }
    async getDisputeById(disputeId) {
        const dispute = await this.disputeRepository.findOne({
            where: { id: disputeId },
            relations: [
                "payment",
                "filedByUser",
                "resolvedByUser",
                "payment.fromUser",
                "payment.toUser",
            ],
        });
        if (!dispute) {
            throw new Error("Dispute not found");
        }
        return dispute;
    }
};
DisputeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(dispute_entity_1.Dispute)),
    __param(1, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DisputeService);
exports.DisputeService = DisputeService;
//# sourceMappingURL=dispute.service.js.map