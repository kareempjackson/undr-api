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
var EscrowService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscrowService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const escrow_entity_1 = require("../../entities/escrow.entity");
const delivery_proof_entity_1 = require("../../entities/delivery-proof.entity");
const transaction_log_entity_1 = require("../../entities/transaction-log.entity");
const user_entity_1 = require("../../entities/user.entity");
const payment_entity_1 = require("../../entities/payment.entity");
let EscrowService = EscrowService_1 = class EscrowService {
    constructor(escrowRepository, deliveryProofRepository, transactionLogRepository, userRepository, paymentRepository, dataSource) {
        this.escrowRepository = escrowRepository;
        this.deliveryProofRepository = deliveryProofRepository;
        this.transactionLogRepository = transactionLogRepository;
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(EscrowService_1.name);
    }
    async createEscrow(data, requestMetadata) {
        const fromUser = await this.userRepository.findOne({
            where: { id: data.fromUserId },
        });
        const toUser = await this.userRepository.findOne({
            where: { id: data.toUserId },
        });
        const payment = await this.paymentRepository.findOne({
            where: { id: data.paymentId },
        });
        if (!fromUser || !toUser) {
            throw new common_1.NotFoundException("User not found");
        }
        if (!payment) {
            throw new common_1.NotFoundException("Payment not found");
        }
        const isHighRisk = this.calculateRiskScore(fromUser, toUser, data.amount, requestMetadata) >
            0.7;
        const scheduleReleaseAt = new Date();
        scheduleReleaseAt.setDate(scheduleReleaseAt.getDate() + 3);
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const escrow = this.escrowRepository.create({
                paymentId: data.paymentId,
                amount: data.amount,
                stripePaymentIntentId: data.stripePaymentIntentId,
                fromUserId: data.fromUserId,
                toUserId: data.toUserId,
                fromAlias: fromUser.alias,
                toAlias: toUser.alias,
                scheduleReleaseAt,
                isHighRisk,
                metadata: Object.assign(Object.assign({}, data.metadata), { deviceFingerprint: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.deviceFingerprint, ipHash: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.ipHash, userAgent: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.userAgent }),
            });
            const savedEscrow = await queryRunner.manager.save(escrow);
            const log = this.transactionLogRepository.create({
                type: transaction_log_entity_1.LogType.ESCROW_CREATED,
                escrowId: savedEscrow.id,
                paymentId: data.paymentId,
                userId: data.fromUserId,
                alias: fromUser.alias,
                timestamp: new Date(),
                description: `Escrow created for payment ${data.paymentId} from ${fromUser.alias} to ${toUser.alias}`,
                data: {
                    amount: data.amount,
                    stripePaymentIntentId: data.stripePaymentIntentId,
                    metadata: escrow.metadata,
                },
                ipHash: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.ipHash,
                deviceFingerprint: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.deviceFingerprint,
                userAgent: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.userAgent,
                stripePaymentIntentId: data.stripePaymentIntentId,
            });
            await queryRunner.manager.save(log);
            await queryRunner.commitTransaction();
            return savedEscrow;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Failed to create escrow: ${error.message}`, error.stack);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async submitDeliveryProof(escrowId, data, userId, requestMetadata) {
        const escrow = await this.escrowRepository.findOne({
            where: { id: escrowId },
        });
        if (!escrow) {
            throw new common_1.NotFoundException("Escrow not found");
        }
        if (escrow.status !== escrow_entity_1.EscrowStatus.PENDING) {
            throw new common_1.BadRequestException(`Cannot submit proof for escrow in ${escrow.status} status`);
        }
        if (escrow.fromUserId !== userId && escrow.toUserId !== userId) {
            throw new common_1.BadRequestException("Only sender or recipient can submit proof");
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const proof = this.deliveryProofRepository.create({
                escrowId,
                type: data.type,
                evidence: Object.assign(Object.assign({}, data.evidence), { deviceFingerprint: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.deviceFingerprint, ipHash: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.ipHash, userAgent: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.userAgent, timestamp: new Date().toISOString() }),
            });
            const savedProof = await queryRunner.manager.save(proof);
            let verified = false;
            if (data.type === delivery_proof_entity_1.ProofType.SYSTEM_VERIFICATION ||
                data.type === delivery_proof_entity_1.ProofType.ADMIN_OVERRIDE ||
                (data.type === delivery_proof_entity_1.ProofType.CREATOR_CONFIRMATION &&
                    userId === escrow.toUserId)) {
                proof.verified = true;
                proof.verifiedAt = new Date();
                proof.verifiedBy = userId;
                verified = true;
                await queryRunner.manager.save(proof);
            }
            if (verified) {
                escrow.status = escrow_entity_1.EscrowStatus.DELIVERED_PENDING_RELEASE;
                await queryRunner.manager.save(escrow);
            }
            const log = this.transactionLogRepository.create({
                type: transaction_log_entity_1.LogType.PROOF_SUBMITTED,
                escrowId,
                paymentId: escrow.paymentId,
                userId,
                alias: userId === escrow.fromUserId ? escrow.fromAlias : escrow.toAlias,
                timestamp: new Date(),
                description: `Delivery proof submitted for escrow ${escrowId}`,
                data: {
                    proofId: savedProof.id,
                    proofType: data.type,
                    verified,
                    evidence: proof.evidence,
                },
                ipHash: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.ipHash,
                deviceFingerprint: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.deviceFingerprint,
                userAgent: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.userAgent,
                stripePaymentIntentId: escrow.stripePaymentIntentId,
            });
            await queryRunner.manager.save(log);
            if (verified) {
                const statusLog = this.transactionLogRepository.create({
                    type: transaction_log_entity_1.LogType.ESCROW_STATUS_CHANGED,
                    escrowId,
                    paymentId: escrow.paymentId,
                    userId,
                    alias: userId === escrow.fromUserId ? escrow.fromAlias : escrow.toAlias,
                    timestamp: new Date(),
                    description: `Escrow status changed to ${escrow_entity_1.EscrowStatus.DELIVERED_PENDING_RELEASE}`,
                    data: {
                        previousStatus: escrow_entity_1.EscrowStatus.PENDING,
                        newStatus: escrow_entity_1.EscrowStatus.DELIVERED_PENDING_RELEASE,
                        reason: "Proof verified",
                        proofId: savedProof.id,
                    },
                    ipHash: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.ipHash,
                    deviceFingerprint: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.deviceFingerprint,
                    userAgent: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.userAgent,
                    stripePaymentIntentId: escrow.stripePaymentIntentId,
                });
                await queryRunner.manager.save(statusLog);
            }
            await queryRunner.commitTransaction();
            return savedProof;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Failed to submit delivery proof: ${error.message}`, error.stack);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async releaseFunds(escrowId, userId, requestMetadata) {
        const escrow = await this.escrowRepository.findOne({
            where: { id: escrowId },
        });
        if (!escrow) {
            throw new common_1.NotFoundException("Escrow not found");
        }
        if (escrow.status !== escrow_entity_1.EscrowStatus.PENDING &&
            escrow.status !== escrow_entity_1.EscrowStatus.DELIVERED_PENDING_RELEASE) {
            throw new common_1.BadRequestException(`Cannot release funds for escrow in ${escrow.status} status`);
        }
        if (escrow.fromUserId !== userId) {
            throw new common_1.BadRequestException("Only sender can release funds");
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            escrow.status = escrow_entity_1.EscrowStatus.RELEASED;
            escrow.releasedAt = new Date();
            const updatedEscrow = await queryRunner.manager.save(escrow);
            const log = this.transactionLogRepository.create({
                type: transaction_log_entity_1.LogType.FUNDS_RELEASED,
                escrowId,
                paymentId: escrow.paymentId,
                userId,
                alias: escrow.fromAlias,
                timestamp: new Date(),
                description: `Funds released from escrow ${escrowId} to ${escrow.toAlias}`,
                data: {
                    amount: escrow.amount,
                    previousStatus: escrow.status,
                    releasedAt: escrow.releasedAt,
                },
                ipHash: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.ipHash,
                deviceFingerprint: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.deviceFingerprint,
                userAgent: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.userAgent,
                stripePaymentIntentId: escrow.stripePaymentIntentId,
            });
            await queryRunner.manager.save(log);
            const statusLog = this.transactionLogRepository.create({
                type: transaction_log_entity_1.LogType.ESCROW_STATUS_CHANGED,
                escrowId,
                paymentId: escrow.paymentId,
                userId,
                alias: escrow.fromAlias,
                timestamp: new Date(),
                description: `Escrow status changed to ${escrow_entity_1.EscrowStatus.RELEASED}`,
                data: {
                    previousStatus: escrow.status,
                    newStatus: escrow_entity_1.EscrowStatus.RELEASED,
                    reason: "Manual release by sender",
                },
                ipHash: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.ipHash,
                deviceFingerprint: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.deviceFingerprint,
                userAgent: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.userAgent,
                stripePaymentIntentId: escrow.stripePaymentIntentId,
            });
            await queryRunner.manager.save(statusLog);
            await queryRunner.commitTransaction();
            return updatedEscrow;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Failed to release funds: ${error.message}`, error.stack);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async issueRefund(escrowId, userId, reason, requestMetadata) {
        const escrow = await this.escrowRepository.findOne({
            where: { id: escrowId },
        });
        if (!escrow) {
            throw new common_1.NotFoundException("Escrow not found");
        }
        if (escrow.status !== escrow_entity_1.EscrowStatus.PENDING) {
            throw new common_1.BadRequestException(`Cannot refund escrow in ${escrow.status} status`);
        }
        if (escrow.toUserId !== userId) {
            throw new common_1.BadRequestException("Only recipient can issue refund");
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            escrow.status = escrow_entity_1.EscrowStatus.REFUNDED;
            const updatedEscrow = await queryRunner.manager.save(escrow);
            const log = this.transactionLogRepository.create({
                type: transaction_log_entity_1.LogType.REFUND_ISSUED,
                escrowId,
                paymentId: escrow.paymentId,
                userId,
                alias: escrow.toAlias,
                timestamp: new Date(),
                description: `Refund issued for escrow ${escrowId}`,
                data: {
                    amount: escrow.amount,
                    reason,
                    previousStatus: escrow_entity_1.EscrowStatus.PENDING,
                },
                ipHash: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.ipHash,
                deviceFingerprint: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.deviceFingerprint,
                userAgent: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.userAgent,
                stripePaymentIntentId: escrow.stripePaymentIntentId,
            });
            await queryRunner.manager.save(log);
            const statusLog = this.transactionLogRepository.create({
                type: transaction_log_entity_1.LogType.ESCROW_STATUS_CHANGED,
                escrowId,
                paymentId: escrow.paymentId,
                userId,
                alias: escrow.toAlias,
                timestamp: new Date(),
                description: `Escrow status changed to ${escrow_entity_1.EscrowStatus.REFUNDED}`,
                data: {
                    previousStatus: escrow_entity_1.EscrowStatus.PENDING,
                    newStatus: escrow_entity_1.EscrowStatus.REFUNDED,
                    reason: `Refund issued: ${reason}`,
                },
                ipHash: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.ipHash,
                deviceFingerprint: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.deviceFingerprint,
                userAgent: requestMetadata === null || requestMetadata === void 0 ? void 0 : requestMetadata.userAgent,
                stripePaymentIntentId: escrow.stripePaymentIntentId,
            });
            await queryRunner.manager.save(statusLog);
            await queryRunner.commitTransaction();
            return updatedEscrow;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Failed to issue refund: ${error.message}`, error.stack);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async handleChargeback(stripePaymentIntentId, stripeDisputeId, disputeData) {
        const escrow = await this.escrowRepository.findOne({
            where: { stripePaymentIntentId },
        });
        if (!escrow) {
            this.logger.warn(`Chargeback received for unknown payment intent: ${stripePaymentIntentId}`);
            return;
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            escrow.status = escrow_entity_1.EscrowStatus.CHARGEBACKED;
            await queryRunner.manager.save(escrow);
            const log = this.transactionLogRepository.create({
                type: transaction_log_entity_1.LogType.CHARGEBACK_RECEIVED,
                escrowId: escrow.id,
                paymentId: escrow.paymentId,
                timestamp: new Date(),
                description: `Chargeback received for escrow ${escrow.id}`,
                data: disputeData,
                stripePaymentIntentId,
                stripeDisputeId,
            });
            await queryRunner.manager.save(log);
            const statusLog = this.transactionLogRepository.create({
                type: transaction_log_entity_1.LogType.ESCROW_STATUS_CHANGED,
                escrowId: escrow.id,
                paymentId: escrow.paymentId,
                timestamp: new Date(),
                description: `Escrow status changed to ${escrow_entity_1.EscrowStatus.CHARGEBACKED}`,
                data: {
                    previousStatus: escrow.status,
                    newStatus: escrow_entity_1.EscrowStatus.CHARGEBACKED,
                    reason: "Chargeback received",
                    disputeId: stripeDisputeId,
                },
                stripePaymentIntentId,
                stripeDisputeId,
            });
            await queryRunner.manager.save(statusLog);
            await queryRunner.commitTransaction();
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Failed to handle chargeback: ${error.message}`, error.stack);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    calculateRiskScore(fromUser, toUser, amount, metadata) {
        let riskScore = 0;
        if (fromUser.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
            riskScore += 0.3;
        }
        if (amount > 1000) {
            riskScore += 0.4;
        }
        else if (amount > 500) {
            riskScore += 0.2;
        }
        else if (amount > 100) {
            riskScore += 0.1;
        }
        return Math.min(riskScore, 1);
    }
    async findOne(id) {
        const escrow = await this.escrowRepository.findOne({
            where: { id },
            relations: ["deliveryProofs"],
        });
        if (!escrow) {
            throw new common_1.NotFoundException("Escrow not found");
        }
        return escrow;
    }
    async findByUser(userId, limit = 20, offset = 0) {
        const [escrows, total] = await this.escrowRepository.findAndCount({
            where: [{ fromUserId: userId }, { toUserId: userId }],
            take: limit,
            skip: offset,
            order: { createdAt: "DESC" },
        });
        return { escrows, total };
    }
    async processScheduledReleases() {
        const now = new Date();
        const escrows = await this.escrowRepository.find({
            where: {
                status: escrow_entity_1.EscrowStatus.PENDING,
                scheduleReleaseAt: now < new Date() ? now : undefined,
            },
        });
        let processed = 0;
        for (const escrow of escrows) {
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();
            try {
                escrow.status = escrow_entity_1.EscrowStatus.RELEASED;
                escrow.releasedAt = new Date();
                await queryRunner.manager.save(escrow);
                const log = this.transactionLogRepository.create({
                    type: transaction_log_entity_1.LogType.FUNDS_RELEASED,
                    escrowId: escrow.id,
                    paymentId: escrow.paymentId,
                    timestamp: new Date(),
                    description: `Funds auto-released from escrow ${escrow.id} to ${escrow.toAlias}`,
                    data: {
                        amount: escrow.amount,
                        previousStatus: escrow_entity_1.EscrowStatus.PENDING,
                        releasedAt: escrow.releasedAt,
                        scheduleReleaseAt: escrow.scheduleReleaseAt,
                        automated: true,
                    },
                });
                await queryRunner.manager.save(log);
                const statusLog = this.transactionLogRepository.create({
                    type: transaction_log_entity_1.LogType.ESCROW_STATUS_CHANGED,
                    escrowId: escrow.id,
                    paymentId: escrow.paymentId,
                    timestamp: new Date(),
                    description: `Escrow status changed to ${escrow_entity_1.EscrowStatus.RELEASED}`,
                    data: {
                        previousStatus: escrow_entity_1.EscrowStatus.PENDING,
                        newStatus: escrow_entity_1.EscrowStatus.RELEASED,
                        reason: "Automatic release based on schedule",
                    },
                });
                await queryRunner.manager.save(statusLog);
                await queryRunner.commitTransaction();
                processed++;
            }
            catch (error) {
                await queryRunner.rollbackTransaction();
                this.logger.error(`Failed to auto-release escrow ${escrow.id}: ${error.message}`, error.stack);
            }
            finally {
                await queryRunner.release();
            }
        }
        return processed;
    }
};
EscrowService = EscrowService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(escrow_entity_1.Escrow)),
    __param(1, (0, typeorm_1.InjectRepository)(delivery_proof_entity_1.DeliveryProof)),
    __param(2, (0, typeorm_1.InjectRepository)(transaction_log_entity_1.TransactionLog)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], EscrowService);
exports.EscrowService = EscrowService;
//# sourceMappingURL=escrow.service.js.map