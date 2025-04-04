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
const common_enums_1 = require("../../entities/common.enums");
const user_entity_1 = require("../../entities/user.entity");
const wallet_entity_1 = require("../../entities/wallet.entity");
const delivery_proof_entity_1 = require("../../entities/delivery-proof.entity");
const transaction_log_entity_1 = require("../../entities/transaction-log.entity");
const notification_service_1 = require("../notification/notification.service");
const notification_entity_1 = require("../../entities/notification.entity");
let EscrowService = EscrowService_1 = class EscrowService {
    constructor(escrowRepository, milestoneRepository, paymentRepository, userRepository, walletRepository, deliveryProofRepository, transactionLogRepository, dataSource, notificationService) {
        this.escrowRepository = escrowRepository;
        this.milestoneRepository = milestoneRepository;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.deliveryProofRepository = deliveryProofRepository;
        this.transactionLogRepository = transactionLogRepository;
        this.dataSource = dataSource;
        this.notificationService = notificationService;
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
        const escrow = this.escrowRepository.create({
            title,
            description,
            totalAmount,
            buyerId,
            sellerId,
            expiresAt: new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000),
            status: escrow_entity_1.EscrowStatus.PENDING,
            terms,
            evidenceFiles: documents,
        });
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            const savedEscrow = await queryRunner.manager.save(escrow);
            const milestoneEntities = milestones.map((m) => {
                return this.milestoneRepository.create({
                    escrowId: savedEscrow.id,
                    amount: m.amount,
                    description: m.description,
                    sequence: m.sequence,
                    status: escrow_entity_1.MilestoneStatus.PENDING,
                });
            });
            await queryRunner.manager.save(milestoneEntities);
            await this.logTransaction(queryRunner.manager, transaction_log_entity_1.TransactionType.ESCROW_CREATED, buyerId, savedEscrow.id, "escrow", {
                title: savedEscrow.title,
                totalAmount: savedEscrow.totalAmount,
                sellerId,
            }, requestMetadata);
            await queryRunner.commitTransaction();
            const completeEscrow = await this.escrowRepository.findOne({
                where: { id: savedEscrow.id },
                relations: ["milestones", "buyer", "seller"],
            });
            this.sendEscrowCreatedNotifications(completeEscrow, buyer, seller);
            return completeEscrow;
        }
        catch (error) {
            await queryRunner.rollbackTransaction();
            this.logger.error(`Error creating escrow: ${error.message}`, error.stack);
            throw error;
        }
        finally {
            await queryRunner.release();
        }
    }
    async sendEscrowCreatedNotifications(escrow, buyer, seller) {
        try {
            await this.notificationService.createNotification({
                userId: buyer.id,
                type: notification_entity_1.NotificationType.ESCROW_CREATED,
                title: "New Escrow Created",
                message: `You've created a new escrow agreement: "${escrow.title}" with ${seller.name || seller.email}`,
                actionUrl: `/escrows/${escrow.id}`,
                metadata: {
                    escrowId: escrow.id,
                    amount: escrow.totalAmount,
                    otherParty: {
                        id: seller.id,
                        name: seller.name,
                    },
                },
            });
            await this.notificationService.createNotification({
                userId: seller.id,
                type: notification_entity_1.NotificationType.ESCROW_CREATED,
                title: "New Escrow Agreement",
                message: `${buyer.name || buyer.email} has created a new escrow agreement with you: "${escrow.title}"`,
                actionUrl: `/escrows/${escrow.id}`,
                metadata: {
                    escrowId: escrow.id,
                    amount: escrow.totalAmount,
                    otherParty: {
                        id: buyer.id,
                        name: buyer.name,
                    },
                },
            });
        }
        catch (error) {
            this.logger.error(`Error sending escrow creation notifications: ${error.message}`, error.stack);
        }
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
            payment.status = common_enums_1.PaymentStatus.ESCROW;
            payment.method = common_enums_1.PaymentMethod.WALLET;
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
            await this.sendEscrowFundedNotifications(updatedEscrow);
            return updatedEscrow;
        });
    }
    async sendEscrowFundedNotifications(escrow) {
        try {
            await this.notificationService.createNotification({
                userId: escrow.buyerId,
                type: notification_entity_1.NotificationType.ESCROW_FUNDED,
                title: "Escrow Successfully Funded",
                message: `You've successfully funded the escrow "${escrow.title}" with $${escrow.totalAmount}`,
                actionUrl: `/escrows/${escrow.id}`,
                metadata: {
                    escrowId: escrow.id,
                    amount: escrow.totalAmount,
                },
            });
            await this.notificationService.createNotification({
                userId: escrow.sellerId,
                type: notification_entity_1.NotificationType.ESCROW_FUNDED,
                title: "Escrow Funded",
                message: `The escrow "${escrow.title}" has been funded with $${escrow.totalAmount}. You can now begin work.`,
                actionUrl: `/escrows/${escrow.id}`,
                metadata: {
                    escrowId: escrow.id,
                    amount: escrow.totalAmount,
                },
            });
        }
        catch (error) {
            this.logger.error(`Error sending escrow funded notifications: ${error.message}`, error.stack);
        }
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
            await this.logTransaction(manager, transaction_log_entity_1.TransactionType.ESCROW_PROOF_SUBMITTED, userId, savedProof.id, "deliveryProof", {
                escrowId,
                proof: savedProof.id,
                proofType: data.type,
            }, requestMetadata);
            await this.sendProofSubmittedNotification(escrow, savedProof);
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
            await this.logTransaction(manager, decision === "accept"
                ? transaction_log_entity_1.TransactionType.ESCROW_PROOF_REVIEWED
                : transaction_log_entity_1.TransactionType.ESCROW_PROOF_REVIEWED, userId, proof.id, "deliveryProof", Object.assign({ escrowId: proof.escrowId, proof: proof.id, decision }, (rejectionReason && { rejectionReason })), requestMetadata);
            if (decision === "accept") {
                await this.sendProofApprovedNotification(escrow, proof);
            }
            else {
                await this.sendProofRejectedNotification(escrow, proof, rejectionReason);
            }
            return updatedProof;
        });
    }
    async sendProofSubmittedNotification(escrow, proof) {
        try {
            await this.notificationService.createNotification({
                userId: escrow.buyerId,
                type: notification_entity_1.NotificationType.PROOF_SUBMITTED,
                title: "Delivery Proof Submitted",
                message: `The seller has submitted a delivery proof for "${escrow.title}". Please review it.`,
                actionUrl: `/escrows/${escrow.id}/proofs/${proof.id}`,
                metadata: {
                    escrowId: escrow.id,
                    proofId: proof.id,
                    proofType: proof.type,
                },
            });
        }
        catch (error) {
            this.logger.error(`Error sending proof submitted notification: ${error.message}`, error.stack);
        }
    }
    async sendProofApprovedNotification(escrow, proof) {
        try {
            await this.notificationService.createNotification({
                userId: escrow.sellerId,
                type: notification_entity_1.NotificationType.PROOF_APPROVED,
                title: "Delivery Proof Approved",
                message: `Your delivery proof for "${escrow.title}" has been approved.`,
                actionUrl: `/escrows/${escrow.id}/proofs/${proof.id}`,
                metadata: {
                    escrowId: escrow.id,
                    proofId: proof.id,
                },
            });
        }
        catch (error) {
            this.logger.error(`Error sending proof approved notification: ${error.message}`, error.stack);
        }
    }
    async sendProofRejectedNotification(escrow, proof, rejectionReason) {
        try {
            await this.notificationService.createNotification({
                userId: escrow.sellerId,
                type: notification_entity_1.NotificationType.PROOF_REJECTED,
                title: "Delivery Proof Rejected",
                message: `Your delivery proof for "${escrow.title}" was rejected${rejectionReason ? `: ${rejectionReason}` : ""}.`,
                actionUrl: `/escrows/${escrow.id}/proofs/${proof.id}`,
                metadata: {
                    escrowId: escrow.id,
                    proofId: proof.id,
                    rejectionReason,
                },
            });
        }
        catch (error) {
            this.logger.error(`Error sending proof rejected notification: ${error.message}`, error.stack);
        }
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
            await this.sendMilestoneUpdateNotifications(escrow, milestone, status, userId);
            return updatedMilestone;
        });
    }
    async sendMilestoneUpdateNotifications(escrow, milestone, status, updatedByUserId) {
        try {
            const isBuyer = updatedByUserId === escrow.buyerId;
            const otherPartyId = isBuyer ? escrow.sellerId : escrow.buyerId;
            let title = "Milestone Updated";
            let buyerMessage = "";
            let sellerMessage = "";
            if (status === escrow_entity_1.MilestoneStatus.COMPLETED) {
                title = "Milestone Completed";
                buyerMessage = `You've marked milestone "${milestone.description}" as completed for escrow "${escrow.title}".`;
                sellerMessage = `The buyer has marked milestone "${milestone.description}" as completed for escrow "${escrow.title}".`;
            }
            else if (status === escrow_entity_1.MilestoneStatus.DISPUTED) {
                title = "Milestone Disputed";
                const action = isBuyer ? "buyer" : "seller";
                buyerMessage = isBuyer
                    ? `You've marked milestone "${milestone.description}" as disputed for escrow "${escrow.title}".`
                    : `The seller has marked milestone "${milestone.description}" as disputed for escrow "${escrow.title}".`;
                sellerMessage = isBuyer
                    ? `The buyer has marked milestone "${milestone.description}" as disputed for escrow "${escrow.title}".`
                    : `You've marked milestone "${milestone.description}" as disputed for escrow "${escrow.title}".`;
            }
            if (updatedByUserId === escrow.buyerId) {
                await this.notificationService.createNotification({
                    userId: escrow.buyerId,
                    type: notification_entity_1.NotificationType.MILESTONE_UPDATED,
                    title,
                    message: buyerMessage,
                    actionUrl: `/escrows/${escrow.id}`,
                    metadata: {
                        escrowId: escrow.id,
                        milestoneId: milestone.id,
                        status,
                        milestoneAmount: milestone.amount,
                    },
                });
            }
            else {
                await this.notificationService.createNotification({
                    userId: escrow.sellerId,
                    type: notification_entity_1.NotificationType.MILESTONE_UPDATED,
                    title,
                    message: sellerMessage,
                    actionUrl: `/escrows/${escrow.id}`,
                    metadata: {
                        escrowId: escrow.id,
                        milestoneId: milestone.id,
                        status,
                        milestoneAmount: milestone.amount,
                    },
                });
            }
            await this.notificationService.createNotification({
                userId: otherPartyId,
                type: notification_entity_1.NotificationType.MILESTONE_UPDATED,
                title,
                message: otherPartyId === escrow.buyerId ? buyerMessage : sellerMessage,
                actionUrl: `/escrows/${escrow.id}`,
                metadata: {
                    escrowId: escrow.id,
                    milestoneId: milestone.id,
                    status,
                    milestoneAmount: milestone.amount,
                },
            });
        }
        catch (error) {
            this.logger.error(`Error sending milestone update notifications: ${error.message}`, error.stack);
        }
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
                status: common_enums_1.PaymentStatus.COMPLETED,
            });
        }
        escrow.status = escrow_entity_1.EscrowStatus.COMPLETED;
        escrow.completedAt = new Date();
        const updatedEscrow = await manager.save(escrow_entity_1.Escrow, escrow);
        await this.logTransaction(manager || this.dataSource.manager, transaction_log_entity_1.TransactionType.ESCROW_COMPLETED, escrow.buyerId, escrow.id, "escrow", {
            escrowId: escrow.id,
            totalAmount: escrow.totalAmount,
        }, null);
        if (!transactionManager) {
            await this.sendEscrowCompletedNotifications(escrow);
        }
        return updatedEscrow;
    }
    async sendEscrowCompletedNotifications(escrow) {
        try {
            await this.notificationService.createNotification({
                userId: escrow.sellerId,
                type: notification_entity_1.NotificationType.ESCROW_COMPLETED,
                title: "Escrow Completed - Funds Released",
                message: `The escrow for "${escrow.title}" has been completed and $${escrow.totalAmount} has been released to your wallet.`,
                actionUrl: `/escrows/${escrow.id}`,
                metadata: {
                    escrowId: escrow.id,
                    amount: escrow.totalAmount,
                },
            });
            await this.notificationService.createNotification({
                userId: escrow.buyerId,
                type: notification_entity_1.NotificationType.ESCROW_COMPLETED,
                title: "Escrow Completed",
                message: `The escrow for "${escrow.title}" has been completed and funds have been released to the seller.`,
                actionUrl: `/escrows/${escrow.id}`,
                metadata: {
                    escrowId: escrow.id,
                    amount: escrow.totalAmount,
                },
            });
        }
        catch (error) {
            this.logger.error(`Error sending escrow completed notifications: ${error.message}`, error.stack);
        }
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
                        status: common_enums_1.PaymentStatus.REFUNDED,
                    });
                }
            }
            escrow.status = escrow_entity_1.EscrowStatus.CANCELLED;
            await this.logTransaction(manager, transaction_log_entity_1.TransactionType.ESCROW_CANCELLED, userId, escrow.id, "escrow", {
                escrowId,
                cancelledBy: userId,
                reason: "User requested cancellation",
            }, requestMetadata);
            const savedEscrow = await manager.save(escrow_entity_1.Escrow, escrow);
            await this.sendEscrowCancelledNotifications(escrow, userId);
            return savedEscrow;
        });
    }
    async sendEscrowCancelledNotifications(escrow, cancelledByUserId) {
        try {
            const isCancelledByBuyer = cancelledByUserId === escrow.buyerId;
            const otherPartyId = isCancelledByBuyer
                ? escrow.sellerId
                : escrow.buyerId;
            await this.notificationService.createNotification({
                userId: cancelledByUserId,
                type: notification_entity_1.NotificationType.ESCROW_RELEASED,
                title: "Escrow Cancelled",
                message: `You have cancelled the escrow for "${escrow.title}".${isCancelledByBuyer
                    ? " Your funds have been returned to your wallet."
                    : ""}`,
                actionUrl: `/escrows/${escrow.id}`,
                metadata: {
                    escrowId: escrow.id,
                    amount: escrow.totalAmount,
                },
            });
            await this.notificationService.createNotification({
                userId: otherPartyId,
                type: notification_entity_1.NotificationType.ESCROW_RELEASED,
                title: "Escrow Cancelled",
                message: `The escrow for "${escrow.title}" has been cancelled by the ${isCancelledByBuyer ? "buyer" : "seller"}.`,
                actionUrl: `/escrows/${escrow.id}`,
                metadata: {
                    escrowId: escrow.id,
                    amount: escrow.totalAmount,
                    cancelledBy: cancelledByUserId,
                },
            });
        }
        catch (error) {
            this.logger.error(`Error sending escrow cancelled notifications: ${error.message}`, error.stack);
        }
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
    async processScheduledReleases() {
        const now = new Date();
        this.logger.log(`Processing scheduled escrow releases at ${now.toISOString()}`);
        const escrows = await this.escrowRepository.find({
            where: {
                status: escrow_entity_1.EscrowStatus.FUNDED,
                scheduleReleaseAt: now < new Date() ? now : undefined,
            },
            relations: ["milestones"],
        });
        this.logger.log(`Found ${escrows.length} escrows scheduled for automatic release`);
        let releasedCount = 0;
        for (const escrow of escrows) {
            try {
                await this.dataSource.transaction(async (manager) => {
                    await this.completeEscrow(escrow.id, manager);
                    await this.logTransaction(manager, transaction_log_entity_1.TransactionType.ESCROW_COMPLETED, escrow.buyerId, escrow.id, "Escrow", {
                        escrowId: escrow.id,
                        totalAmount: escrow.totalAmount,
                        scheduleReleaseAt: escrow.scheduleReleaseAt,
                        reason: "Automatic release based on schedule",
                    });
                });
                await this.sendAutomaticReleaseNotifications(escrow);
                releasedCount++;
                this.logger.log(`Successfully released escrow ${escrow.id}`);
            }
            catch (error) {
                this.logger.error(`Failed to release escrow ${escrow.id}: ${error.message}`, error.stack);
            }
        }
        this.logger.log(`Successfully processed ${releasedCount} of ${escrows.length} scheduled releases`);
        return releasedCount;
    }
    async sendAutomaticReleaseNotifications(escrow) {
        try {
            await this.notificationService.createNotification({
                userId: escrow.sellerId,
                type: notification_entity_1.NotificationType.ESCROW_RELEASED,
                title: "Escrow Funds Automatically Released",
                message: `Funds for escrow "${escrow.title}" have been automatically released to your wallet based on the scheduled release date.`,
                actionUrl: `/escrows/${escrow.id}`,
                metadata: {
                    escrowId: escrow.id,
                    amount: escrow.totalAmount,
                    automatic: true,
                    releaseDate: escrow.scheduleReleaseAt,
                },
            });
            await this.notificationService.createNotification({
                userId: escrow.buyerId,
                type: notification_entity_1.NotificationType.ESCROW_RELEASED,
                title: "Escrow Funds Automatically Released",
                message: `Funds for escrow "${escrow.title}" have been automatically released to the seller based on the scheduled release date.`,
                actionUrl: `/escrows/${escrow.id}`,
                metadata: {
                    escrowId: escrow.id,
                    amount: escrow.totalAmount,
                    automatic: true,
                    releaseDate: escrow.scheduleReleaseAt,
                },
            });
        }
        catch (error) {
            this.logger.error(`Error sending automatic release notifications: ${error.message}`, error.stack);
        }
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
        typeorm_2.DataSource,
        notification_service_1.NotificationService])
], EscrowService);
exports.EscrowService = EscrowService;
//# sourceMappingURL=escrow.service.js.map