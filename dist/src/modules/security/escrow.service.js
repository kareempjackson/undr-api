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
const payment_entity_1 = require("../../entities/payment.entity");
const user_entity_1 = require("../../entities/user.entity");
const wallet_entity_1 = require("../../entities/wallet.entity");
const delivery_proof_entity_1 = require("../../entities/delivery-proof.entity");
const transaction_log_entity_1 = require("../../entities/transaction-log.entity");
let EscrowService = EscrowService_1 = class EscrowService {
    constructor(escrowRepository, milestoneRepository, paymentRepository, userRepository, walletRepository, deliveryProofRepository, transactionLogRepository, dataSource) {
        this.escrowRepository = escrowRepository;
        this.milestoneRepository = milestoneRepository;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.deliveryProofRepository = deliveryProofRepository;
        this.transactionLogRepository = transactionLogRepository;
        this.dataSource = dataSource;
        this.logger = new common_1.Logger(EscrowService_1.name);
    }
    async createEscrow(params, requestMetadata) {
        const { title, description, totalAmount, buyerId, sellerId, expirationDays, milestones, terms, documents, } = params;
        const buyer = await this.userRepository.findOne({
            where: { id: buyerId },
            relations: ["wallet"],
        });
        const seller = await this.userRepository.findOne({
            where: { id: sellerId },
        });
        if (!buyer) {
            throw new common_1.BadRequestException("Buyer not found");
        }
        if (!seller) {
            throw new common_1.BadRequestException("Seller not found");
        }
        if (!buyer.wallet || Number(buyer.wallet.balance) < totalAmount) {
            throw new common_1.BadRequestException("Insufficient funds in buyer wallet");
        }
        const milestonesTotal = milestones.reduce((sum, m) => sum + Number(m.amount), 0);
        if (Math.abs(milestonesTotal - totalAmount) > 0.01) {
            throw new common_1.BadRequestException("Sum of milestone amounts must equal the total escrow amount");
        }
        const escrow = new escrow_entity_1.Escrow();
        escrow.title = title;
        escrow.description = description;
        escrow.totalAmount = totalAmount;
        escrow.buyerId = buyerId;
        escrow.sellerId = sellerId;
        escrow.status = escrow_entity_1.EscrowStatus.PENDING;
        escrow.expiresAt = new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000);
        if (terms) {
            escrow.terms = terms;
        }
        if (documents && documents.length > 0) {
            escrow.evidenceFiles = documents;
        }
        return this.dataSource.transaction(async (manager) => {
            const savedEscrow = await manager.save(escrow_entity_1.Escrow, escrow);
            const escrowMilestones = milestones.map((milestone) => {
                const escrowMilestone = new escrow_entity_1.EscrowMilestone();
                escrowMilestone.escrowId = savedEscrow.id;
                escrowMilestone.amount = milestone.amount;
                escrowMilestone.description = milestone.description;
                escrowMilestone.sequence = milestone.sequence;
                escrowMilestone.status = escrow_entity_1.MilestoneStatus.PENDING;
                return escrowMilestone;
            });
            await manager.save(escrow_entity_1.EscrowMilestone, escrowMilestones);
            await this.logTransaction(manager, transaction_log_entity_1.TransactionType.ESCROW_CREATED, buyerId, savedEscrow.id, "Escrow", {
                escrowId: savedEscrow.id,
                title,
                totalAmount,
                sellerId,
            }, requestMetadata);
            return manager.findOne(escrow_entity_1.Escrow, {
                where: { id: savedEscrow.id },
                relations: ["milestones"],
            });
        });
    }
    async fundEscrow(escrowId, buyerId, requestMetadata) {
        return this.dataSource.transaction(async (manager) => {
            const escrow = await manager.findOne(escrow_entity_1.Escrow, {
                where: { id: escrowId },
                relations: ["milestones"],
            });
            if (!escrow) {
                throw new common_1.NotFoundException("Escrow not found");
            }
            if (escrow.buyerId !== buyerId) {
                throw new common_1.ForbiddenException("Only the buyer can fund the escrow");
            }
            if (escrow.status !== escrow_entity_1.EscrowStatus.PENDING) {
                throw new common_1.BadRequestException("Escrow is not in pending status");
            }
            const buyer = await manager.findOne(user_entity_1.User, {
                where: { id: buyerId },
                relations: ["wallet"],
            });
            if (!buyer ||
                !buyer.wallet ||
                Number(buyer.wallet.balance) < Number(escrow.totalAmount)) {
                throw new common_1.BadRequestException("Insufficient funds in buyer wallet");
            }
            buyer.wallet.balance =
                Number(buyer.wallet.balance) - Number(escrow.totalAmount);
            await manager.save(wallet_entity_1.Wallet, buyer.wallet);
            const payment = new payment_entity_1.Payment();
            payment.amount = escrow.totalAmount;
            payment.fromUserId = escrow.buyerId;
            payment.toUserId = escrow.sellerId;
            payment.status = payment_entity_1.PaymentStatus.ESCROW;
            payment.method = payment_entity_1.PaymentMethod.WALLET;
            payment.description = `Escrow payment for: ${escrow.title}`;
            const savedPayment = await manager.save(payment_entity_1.Payment, payment);
            escrow.status = escrow_entity_1.EscrowStatus.FUNDED;
            escrow.paymentId = savedPayment.id;
            const updatedEscrow = await manager.save(escrow_entity_1.Escrow, escrow);
            await this.logTransaction(manager, transaction_log_entity_1.TransactionType.ESCROW_FUNDED, buyerId, escrowId, "Escrow", {
                escrowId,
                totalAmount: escrow.totalAmount,
                paymentId: savedPayment.id,
            }, requestMetadata);
            return updatedEscrow;
        });
    }
    async submitDeliveryProof(escrowId, data, userId, requestMetadata) {
        return this.dataSource.transaction(async (manager) => {
            const escrow = await manager.findOne(escrow_entity_1.Escrow, {
                where: { id: escrowId },
            });
            if (!escrow) {
                throw new common_1.NotFoundException("Escrow not found");
            }
            if (escrow.sellerId !== userId) {
                throw new common_1.ForbiddenException("Only the seller can submit delivery proof");
            }
            if (escrow.status !== escrow_entity_1.EscrowStatus.FUNDED) {
                throw new common_1.BadRequestException("Proof can only be submitted for funded escrows");
            }
            const proof = new delivery_proof_entity_1.DeliveryProof();
            proof.escrowId = escrowId;
            proof.submittedById = userId;
            proof.type = data.type;
            proof.description = data.description;
            proof.files = data.files;
            proof.status = delivery_proof_entity_1.ProofStatus.PENDING;
            proof.metadata = data.metadata || {};
            const savedProof = await manager.save(delivery_proof_entity_1.DeliveryProof, proof);
            await this.logTransaction(manager, transaction_log_entity_1.TransactionType.ESCROW_PROOF_SUBMITTED, userId, escrowId, "Escrow", {
                escrowId,
                proofId: savedProof.id,
                type: data.type,
                files: data.files,
            }, requestMetadata);
            return savedProof;
        });
    }
    async reviewDeliveryProof(proofId, decision, userId, rejectionReason, requestMetadata) {
        return this.dataSource.transaction(async (manager) => {
            const proof = await manager.findOne(delivery_proof_entity_1.DeliveryProof, {
                where: { id: proofId },
                relations: ["escrow"],
            });
            if (!proof) {
                throw new common_1.NotFoundException("Delivery proof not found");
            }
            const escrow = proof.escrow;
            if (escrow.buyerId !== userId) {
                throw new common_1.ForbiddenException("Only the buyer can review delivery proof");
            }
            if (proof.status !== delivery_proof_entity_1.ProofStatus.PENDING) {
                throw new common_1.BadRequestException("Proof has already been reviewed");
            }
            proof.status =
                decision === "accept" ? delivery_proof_entity_1.ProofStatus.ACCEPTED : delivery_proof_entity_1.ProofStatus.REJECTED;
            proof.reviewedById = userId;
            proof.reviewedAt = new Date();
            if (decision === "reject" && rejectionReason) {
                proof.rejectionReason = rejectionReason;
            }
            const updatedProof = await manager.save(delivery_proof_entity_1.DeliveryProof, proof);
            if (decision === "accept") {
                await this.completeEscrow(escrow.id, manager);
            }
            await this.logTransaction(manager, transaction_log_entity_1.TransactionType.ESCROW_PROOF_REVIEWED, userId, proof.escrowId, "Escrow", {
                escrowId: proof.escrowId,
                proofId,
                decision,
                rejectionReason,
            }, requestMetadata);
            return updatedProof;
        });
    }
    async updateMilestone(params, requestMetadata) {
        return this.dataSource.transaction(async (manager) => {
            const { escrowId, milestoneId, status, userId } = params;
            const escrow = await manager.findOne(escrow_entity_1.Escrow, {
                where: { id: escrowId },
                relations: ["milestones"],
            });
            if (!escrow) {
                throw new common_1.NotFoundException("Escrow not found");
            }
            if (status === escrow_entity_1.MilestoneStatus.COMPLETED && userId !== escrow.buyerId) {
                throw new common_1.ForbiddenException("Only the buyer can mark a milestone as completed");
            }
            if (status === escrow_entity_1.MilestoneStatus.DISPUTED &&
                userId !== escrow.buyerId &&
                userId !== escrow.sellerId) {
                throw new common_1.ForbiddenException("Only the buyer or seller can dispute a milestone");
            }
            const milestone = escrow.milestones.find((m) => m.id === milestoneId);
            if (!milestone) {
                throw new common_1.NotFoundException("Milestone not found");
            }
            milestone.status = status;
            if (status === escrow_entity_1.MilestoneStatus.COMPLETED) {
                milestone.completedAt = new Date();
            }
            const updatedMilestone = await manager.save(escrow_entity_1.EscrowMilestone, milestone);
            const allMilestones = await manager.find(escrow_entity_1.EscrowMilestone, {
                where: { escrowId },
            });
            const allCompleted = allMilestones.every((m) => m.status === escrow_entity_1.MilestoneStatus.COMPLETED);
            if (allCompleted) {
                await this.completeEscrow(escrowId, manager);
            }
            await this.logTransaction(manager, transaction_log_entity_1.TransactionType.MILESTONE_UPDATED, userId, milestoneId, "EscrowMilestone", {
                escrowId,
                milestoneId,
                status,
            }, requestMetadata);
            return updatedMilestone;
        });
    }
    async completeEscrow(escrowId, transactionManager) {
        const manager = transactionManager || this.dataSource.manager;
        const escrow = await manager.findOne(escrow_entity_1.Escrow, {
            where: { id: escrowId },
            relations: ["milestones"],
        });
        if (!escrow) {
            throw new common_1.NotFoundException("Escrow not found");
        }
        if (escrow.status !== escrow_entity_1.EscrowStatus.FUNDED) {
            throw new common_1.BadRequestException("Escrow is not in funded status");
        }
        const seller = await manager.findOne(user_entity_1.User, {
            where: { id: escrow.sellerId },
            relations: ["wallet"],
        });
        if (!seller || !seller.wallet) {
            throw new common_1.NotFoundException("Seller wallet not found");
        }
        seller.wallet.balance =
            Number(seller.wallet.balance) + Number(escrow.totalAmount);
        await manager.save(wallet_entity_1.Wallet, seller.wallet);
        if (escrow.paymentId) {
            await manager.update(payment_entity_1.Payment, escrow.paymentId, {
                status: payment_entity_1.PaymentStatus.COMPLETED,
            });
        }
        escrow.status = escrow_entity_1.EscrowStatus.COMPLETED;
        escrow.completedAt = new Date();
        const updatedEscrow = await manager.save(escrow_entity_1.Escrow, escrow);
        if (!transactionManager) {
            await this.logTransaction(manager, transaction_log_entity_1.TransactionType.ESCROW_COMPLETED, escrow.buyerId, escrowId, "Escrow", {
                escrowId,
                totalAmount: escrow.totalAmount,
                sellerId: escrow.sellerId,
            });
        }
        return updatedEscrow;
    }
    async cancelEscrow(escrowId, userId, requestMetadata) {
        return this.dataSource.transaction(async (manager) => {
            const escrow = await manager.findOne(escrow_entity_1.Escrow, {
                where: { id: escrowId },
            });
            if (!escrow) {
                throw new common_1.NotFoundException("Escrow not found");
            }
            if (userId !== escrow.buyerId && userId !== escrow.sellerId) {
                throw new common_1.ForbiddenException("Only the buyer or seller can cancel the escrow");
            }
            if (escrow.status !== escrow_entity_1.EscrowStatus.PENDING &&
                escrow.status !== escrow_entity_1.EscrowStatus.FUNDED) {
                throw new common_1.BadRequestException("Escrow cannot be cancelled in its current state");
            }
            if (escrow.status === escrow_entity_1.EscrowStatus.FUNDED) {
                const buyer = await manager.findOne(user_entity_1.User, {
                    where: { id: escrow.buyerId },
                    relations: ["wallet"],
                });
                if (!buyer || !buyer.wallet) {
                    throw new common_1.NotFoundException("Buyer wallet not found");
                }
                buyer.wallet.balance =
                    Number(buyer.wallet.balance) + Number(escrow.totalAmount);
                await manager.save(wallet_entity_1.Wallet, buyer.wallet);
                if (escrow.paymentId) {
                    await manager.update(payment_entity_1.Payment, escrow.paymentId, {
                        status: payment_entity_1.PaymentStatus.REFUNDED,
                    });
                }
            }
            escrow.status = escrow_entity_1.EscrowStatus.CANCELLED;
            const updatedEscrow = await manager.save(escrow_entity_1.Escrow, escrow);
            await this.logTransaction(manager, transaction_log_entity_1.TransactionType.ESCROW_CANCELLED, userId, escrowId, "Escrow", {
                escrowId,
                status: escrow.status,
                cancelledBy: userId,
            }, requestMetadata);
            return updatedEscrow;
        });
    }
    async getEscrowsByUser(userId, status, limit, offset) {
        const queryBuilder = this.escrowRepository
            .createQueryBuilder("escrow")
            .leftJoinAndSelect("escrow.milestones", "milestones")
            .where("escrow.buyerId = :userId OR escrow.sellerId = :userId", {
            userId,
        });
        if (status) {
            queryBuilder.andWhere("escrow.status = :status", { status });
        }
        const total = await queryBuilder.getCount();
        queryBuilder.orderBy("escrow.createdAt", "DESC");
        if (limit) {
            queryBuilder.take(limit);
        }
        if (offset) {
            queryBuilder.skip(offset);
        }
        const escrows = await queryBuilder.getMany();
        return { escrows, total };
    }
    async getEscrowById(escrowId) {
        const escrow = await this.escrowRepository.findOne({
            where: { id: escrowId },
            relations: ["milestones"],
        });
        if (!escrow) {
            throw new common_1.NotFoundException("Escrow not found");
        }
        return escrow;
    }
    async getEscrowProofs(escrowId) {
        const proofs = await this.deliveryProofRepository.find({
            where: { escrowId },
            order: { createdAt: "DESC" },
        });
        return proofs;
    }
    async logTransaction(manager, type, userId, entityId, entityType, data, requestMetadata) {
        try {
            const log = new transaction_log_entity_1.TransactionLog();
            log.type = type;
            log.userId = userId;
            log.entityId = entityId;
            log.entityType = entityType;
            log.data = data;
            if (requestMetadata) {
                log.ipAddress = requestMetadata.ip;
                log.userAgent = requestMetadata.userAgent;
                log.metadata = requestMetadata;
            }
            return await manager.save(transaction_log_entity_1.TransactionLog, log);
        }
        catch (error) {
            this.logger.error(`Failed to log transaction: ${error.message}`, error.stack);
            return null;
        }
    }
};
EscrowService = EscrowService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(escrow_entity_1.Escrow)),
    __param(1, (0, typeorm_1.InjectRepository)(escrow_entity_1.EscrowMilestone)),
    __param(2, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, typeorm_1.InjectRepository)(wallet_entity_1.Wallet)),
    __param(5, (0, typeorm_1.InjectRepository)(delivery_proof_entity_1.DeliveryProof)),
    __param(6, (0, typeorm_1.InjectRepository)(transaction_log_entity_1.TransactionLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], EscrowService);
exports.EscrowService = EscrowService;
//# sourceMappingURL=escrow.service.js.map