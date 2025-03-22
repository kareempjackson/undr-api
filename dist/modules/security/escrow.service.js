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
exports.EscrowService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const escrow_entity_1 = require("../../entities/escrow.entity");
const payment_entity_1 = require("../../entities/payment.entity");
const user_entity_1 = require("../../entities/user.entity");
const wallet_entity_1 = require("../../entities/wallet.entity");
let EscrowService = class EscrowService {
    constructor(escrowRepository, milestoneRepository, paymentRepository, userRepository, walletRepository) {
        this.escrowRepository = escrowRepository;
        this.milestoneRepository = milestoneRepository;
        this.paymentRepository = paymentRepository;
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
    }
    async createEscrow(params) {
        const { title, description, totalAmount, buyerId, sellerId, expirationDays, milestones, terms, } = params;
        const buyer = await this.userRepository.findOne({
            where: { id: buyerId },
            relations: ["wallet"],
        });
        const seller = await this.userRepository.findOne({
            where: { id: sellerId },
        });
        if (!buyer || !seller) {
            throw new Error("Buyer or seller not found");
        }
        if (!buyer.wallet || Number(buyer.wallet.balance) < totalAmount) {
            throw new Error("Insufficient funds in buyer wallet");
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
        const savedEscrow = await this.escrowRepository.save(escrow);
        const escrowMilestones = milestones.map((milestone) => {
            const escrowMilestone = new escrow_entity_1.EscrowMilestone();
            escrowMilestone.escrowId = savedEscrow.id;
            escrowMilestone.amount = milestone.amount;
            escrowMilestone.description = milestone.description;
            escrowMilestone.sequence = milestone.sequence;
            escrowMilestone.status = escrow_entity_1.MilestoneStatus.PENDING;
            return escrowMilestone;
        });
        await this.milestoneRepository.save(escrowMilestones);
        return this.escrowRepository.findOne({
            where: { id: savedEscrow.id },
            relations: ["milestones"],
        });
    }
    async fundEscrow(escrowId, buyerId) {
        const escrow = await this.escrowRepository.findOne({
            where: { id: escrowId },
            relations: ["milestones"],
        });
        if (!escrow) {
            throw new Error("Escrow not found");
        }
        if (escrow.buyerId !== buyerId) {
            throw new Error("Only the buyer can fund the escrow");
        }
        if (escrow.status !== escrow_entity_1.EscrowStatus.PENDING) {
            throw new Error("Escrow is not in pending status");
        }
        const buyer = await this.userRepository.findOne({
            where: { id: buyerId },
            relations: ["wallet"],
        });
        if (!buyer ||
            !buyer.wallet ||
            Number(buyer.wallet.balance) < Number(escrow.totalAmount)) {
            throw new Error("Insufficient funds in buyer wallet");
        }
        buyer.wallet.balance =
            Number(buyer.wallet.balance) - Number(escrow.totalAmount);
        await this.walletRepository.save(buyer.wallet);
        const payment = new payment_entity_1.Payment();
        payment.amount = escrow.totalAmount;
        payment.fromUserId = escrow.buyerId;
        payment.toUserId = escrow.sellerId;
        payment.status = payment_entity_1.PaymentStatus.ESCROW;
        payment.method = payment_entity_1.PaymentMethod.WALLET;
        payment.description = `Escrow payment for: ${escrow.title}`;
        const savedPayment = await this.paymentRepository.save(payment);
        escrow.status = escrow_entity_1.EscrowStatus.FUNDED;
        escrow.paymentId = savedPayment.id;
        return this.escrowRepository.save(escrow);
    }
    async updateMilestone(params) {
        const { escrowId, milestoneId, status, userId } = params;
        const escrow = await this.escrowRepository.findOne({
            where: { id: escrowId },
            relations: ["milestones"],
        });
        if (!escrow) {
            throw new Error("Escrow not found");
        }
        if (status === escrow_entity_1.MilestoneStatus.COMPLETED && userId !== escrow.buyerId) {
            throw new Error("Only the buyer can mark a milestone as completed");
        }
        if (status === escrow_entity_1.MilestoneStatus.DISPUTED &&
            userId !== escrow.buyerId &&
            userId !== escrow.sellerId) {
            throw new Error("Only the buyer or seller can dispute a milestone");
        }
        const milestone = escrow.milestones.find((m) => m.id === milestoneId);
        if (!milestone) {
            throw new Error("Milestone not found");
        }
        milestone.status = status;
        if (status === escrow_entity_1.MilestoneStatus.COMPLETED) {
            milestone.completedAt = new Date();
        }
        const updatedMilestone = await this.milestoneRepository.save(milestone);
        const allMilestones = await this.milestoneRepository.find({
            where: { escrowId },
        });
        const allCompleted = allMilestones.every((m) => m.status === escrow_entity_1.MilestoneStatus.COMPLETED);
        if (allCompleted) {
            await this.completeEscrow(escrowId);
        }
        return updatedMilestone;
    }
    async completeEscrow(escrowId) {
        const escrow = await this.escrowRepository.findOne({
            where: { id: escrowId },
            relations: ["milestones"],
        });
        if (!escrow) {
            throw new Error("Escrow not found");
        }
        if (escrow.status !== escrow_entity_1.EscrowStatus.FUNDED) {
            throw new Error("Escrow is not in funded status");
        }
        const seller = await this.userRepository.findOne({
            where: { id: escrow.sellerId },
            relations: ["wallet"],
        });
        if (!seller || !seller.wallet) {
            throw new Error("Seller wallet not found");
        }
        seller.wallet.balance =
            Number(seller.wallet.balance) + Number(escrow.totalAmount);
        await this.walletRepository.save(seller.wallet);
        if (escrow.paymentId) {
            await this.paymentRepository.update(escrow.paymentId, {
                status: payment_entity_1.PaymentStatus.COMPLETED,
            });
        }
        escrow.status = escrow_entity_1.EscrowStatus.COMPLETED;
        escrow.completedAt = new Date();
        return this.escrowRepository.save(escrow);
    }
    async cancelEscrow(escrowId, userId) {
        const escrow = await this.escrowRepository.findOne({
            where: { id: escrowId },
        });
        if (!escrow) {
            throw new Error("Escrow not found");
        }
        if (userId !== escrow.buyerId && userId !== escrow.sellerId) {
            throw new Error("Only the buyer or seller can cancel the escrow");
        }
        if (escrow.status !== escrow_entity_1.EscrowStatus.PENDING &&
            escrow.status !== escrow_entity_1.EscrowStatus.FUNDED) {
            throw new Error("Escrow cannot be cancelled in its current state");
        }
        if (escrow.status === escrow_entity_1.EscrowStatus.FUNDED) {
            const buyer = await this.userRepository.findOne({
                where: { id: escrow.buyerId },
                relations: ["wallet"],
            });
            if (!buyer || !buyer.wallet) {
                throw new Error("Buyer wallet not found");
            }
            buyer.wallet.balance =
                Number(buyer.wallet.balance) + Number(escrow.totalAmount);
            await this.walletRepository.save(buyer.wallet);
            if (escrow.paymentId) {
                await this.paymentRepository.update(escrow.paymentId, {
                    status: payment_entity_1.PaymentStatus.REFUNDED,
                });
            }
        }
        escrow.status = escrow_entity_1.EscrowStatus.CANCELLED;
        return this.escrowRepository.save(escrow);
    }
    async getEscrowsByUser(userId, status, limit = 10, offset = 0) {
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
        const escrows = await queryBuilder
            .orderBy("escrow.createdAt", "DESC")
            .take(limit)
            .skip(offset)
            .getMany();
        return { escrows, total };
    }
    async getEscrowById(escrowId) {
        const escrow = await this.escrowRepository.findOne({
            where: { id: escrowId },
            relations: ["milestones"],
        });
        if (!escrow) {
            throw new Error("Escrow not found");
        }
        return escrow;
    }
};
EscrowService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(escrow_entity_1.Escrow)),
    __param(1, (0, typeorm_1.InjectRepository)(escrow_entity_1.EscrowMilestone)),
    __param(2, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(3, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(4, (0, typeorm_1.InjectRepository)(wallet_entity_1.Wallet)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], EscrowService);
exports.EscrowService = EscrowService;
//# sourceMappingURL=escrow.service.js.map