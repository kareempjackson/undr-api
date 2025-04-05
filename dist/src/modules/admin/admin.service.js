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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../entities/user.entity");
const payment_entity_1 = require("../../entities/payment.entity");
const common_enums_1 = require("../../entities/common.enums");
const date_fns_1 = require("date-fns");
const dispute_entity_1 = require("../../entities/dispute.entity");
const escrow_entity_1 = require("../../entities/escrow.entity");
const wallet_entity_1 = require("../../entities/wallet.entity");
const dispute_evidence_entity_1 = require("../../entities/dispute-evidence.entity");
const dispute_message_entity_1 = require("../../entities/dispute-message.entity");
const withdrawal_entity_1 = require("../../entities/withdrawal.entity");
const deposit_entity_1 = require("../../entities/deposit.entity");
const transaction_log_entity_1 = require("../../entities/transaction-log.entity");
let AdminService = class AdminService {
    constructor(userRepository, paymentRepository, disputeRepository, escrowRepository, walletRepository, disputeEvidenceRepository, disputeMessageRepository, withdrawalRepository, depositRepository, transactionLogRepository) {
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
        this.disputeRepository = disputeRepository;
        this.escrowRepository = escrowRepository;
        this.walletRepository = walletRepository;
        this.disputeEvidenceRepository = disputeEvidenceRepository;
        this.disputeMessageRepository = disputeMessageRepository;
        this.withdrawalRepository = withdrawalRepository;
        this.depositRepository = depositRepository;
        this.transactionLogRepository = transactionLogRepository;
    }
    async getAllUsers(search, role, status, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const queryBuilder = this.userRepository.createQueryBuilder("user");
        if (search) {
            queryBuilder.where("(user.email ILIKE :search OR user.alias ILIKE :search OR user.name ILIKE :search)", { search: `%${search}%` });
        }
        if (role) {
            queryBuilder.andWhere("user.role = :role", { role });
        }
        if (status) {
            queryBuilder.andWhere("user.status = :status", { status });
        }
        const [users, total] = await Promise.all([
            queryBuilder
                .select([
                "user.id",
                "user.email",
                "user.name",
                "user.alias",
                "user.role",
                "user.status",
                "user.createdAt",
                "user.updatedAt",
                "user.profileImage",
            ])
                .skip(skip)
                .take(limit)
                .getMany(),
            queryBuilder.getCount(),
        ]);
        return {
            users,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getUserDetails(userId) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ["wallet"],
        });
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        const [paymentsSent, paymentsReceived, disputes, withdrawals, deposits] = await Promise.all([
            this.paymentRepository.count({ where: { fromUser: { id: userId } } }),
            this.paymentRepository.count({ where: { toUser: { id: userId } } }),
            this.disputeRepository.count({ where: { createdById: userId } }),
            this.withdrawalRepository.count({ where: { user: { id: userId } } }),
            this.depositRepository.count({ where: { user: { id: userId } } }),
        ]);
        return {
            user,
            stats: {
                paymentsSent,
                paymentsReceived,
                disputes,
                withdrawals,
                deposits,
            },
        };
    }
    async updateUserStatus(userId, status) {
        if (!Object.values(user_entity_1.UserStatus).includes(status)) {
            throw new common_1.BadRequestException("Invalid status");
        }
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        await this.userRepository.update(userId, { status: status });
        await this.transactionLogRepository.save({
            userId,
            action: "USER_STATUS_CHANGE",
            details: {
                oldStatus: user.status,
                newStatus: status,
            },
        });
        return { success: true, message: `User status updated to ${status}` };
    }
    async updateUserRole(userId, role) {
        if (!Object.values(user_entity_1.UserRole).includes(role)) {
            throw new common_1.BadRequestException("Invalid role");
        }
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        await this.userRepository.update(userId, { role: role });
        await this.transactionLogRepository.save({
            userId,
            action: "USER_ROLE_CHANGE",
            details: {
                oldRole: user.role,
                newRole: role,
            },
        });
        return { success: true, message: `User role updated to ${role}` };
    }
    async flagUser(userId, reason, details) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        if (user.status === user_entity_1.UserStatus.SUSPENDED) {
            await this.userRepository.update(userId, { status: user_entity_1.UserStatus.ACTIVE });
            await this.transactionLogRepository.save({
                userId,
                action: "USER_FLAG_REMOVED",
                details: {
                    previousReason: reason,
                },
            });
            return { success: true, message: "User flag removed" };
        }
        await this.userRepository.update(userId, { status: user_entity_1.UserStatus.SUSPENDED });
        await this.transactionLogRepository.save({
            userId,
            action: "USER_FLAGGED",
            details: {
                reason,
                details,
            },
        });
        return { success: true, message: "User flagged" };
    }
    async getAllTransactions() {
        return this.paymentRepository.find({
            relations: ["fromUser", "toUser"],
        });
    }
    getDateRange(timeframe) {
        const now = new Date();
        switch (timeframe) {
            case "7days":
                return { start: (0, date_fns_1.subDays)(now, 7), end: now };
            case "30days":
                return { start: (0, date_fns_1.subDays)(now, 30), end: now };
            case "90days":
                return { start: (0, date_fns_1.subDays)(now, 90), end: now };
            case "12months":
                return { start: (0, date_fns_1.subMonths)(now, 12), end: now };
            default:
                return { start: (0, date_fns_1.subDays)(now, 30), end: now };
        }
    }
    async getAnalytics(timeframe) {
        const { start, end } = this.getDateRange(timeframe);
        const [summaryData, revenueData, userData, transactionData, topCreators, paymentMethods,] = await Promise.all([
            this.getSummaryData(start, end),
            this.getRevenueData(timeframe),
            this.getUserData(timeframe),
            this.getTransactionData(timeframe),
            this.getTopCreators(5),
            this.getPaymentMethodsDistribution(),
        ]);
        return {
            summary: summaryData,
            revenueData,
            userData,
            transactionData,
            topCreators,
            paymentMethods,
        };
    }
    async getSummaryData(start, end) {
        const completedPayments = await this.paymentRepository.find({
            where: {
                status: common_enums_1.PaymentStatus.COMPLETED,
                createdAt: (0, typeorm_2.Between)(start, end),
            },
        });
        const totalRevenue = completedPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
        const totalUsers = await this.userRepository.count({
            where: {
                createdAt: (0, typeorm_2.LessThanOrEqual)(end),
                role: user_entity_1.UserRole.FAN,
            },
        });
        const totalCreators = await this.userRepository.count({
            where: {
                createdAt: (0, typeorm_2.LessThanOrEqual)(end),
                role: user_entity_1.UserRole.CREATOR,
            },
        });
        const totalTransactions = await this.paymentRepository.count({
            where: {
                createdAt: (0, typeorm_2.Between)(start, end),
            },
        });
        const prevStart = new Date(start);
        prevStart.setDate(prevStart.getDate() -
            (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const prevCompletedPayments = await this.paymentRepository.find({
            where: {
                status: common_enums_1.PaymentStatus.COMPLETED,
                createdAt: (0, typeorm_2.Between)(prevStart, start),
            },
        });
        const prevRevenue = prevCompletedPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
        const prevUsers = await this.userRepository.count({
            where: {
                createdAt: (0, typeorm_2.LessThan)(start),
                role: user_entity_1.UserRole.FAN,
            },
        });
        const prevCreators = await this.userRepository.count({
            where: {
                createdAt: (0, typeorm_2.LessThan)(start),
                role: user_entity_1.UserRole.CREATOR,
            },
        });
        const prevTransactions = await this.paymentRepository.count({
            where: {
                createdAt: (0, typeorm_2.Between)(prevStart, start),
            },
        });
        const calculateGrowth = (current, previous) => {
            if (previous === 0)
                return 100;
            return Math.round(((current - previous) / previous) * 100);
        };
        return {
            totalRevenue,
            totalUsers,
            totalCreators,
            totalTransactions,
            revenueGrowth: calculateGrowth(totalRevenue, prevRevenue),
            userGrowth: calculateGrowth(totalUsers, prevUsers),
            creatorGrowth: calculateGrowth(totalCreators, prevCreators),
            transactionGrowth: calculateGrowth(totalTransactions, prevTransactions),
        };
    }
    async getRevenueAnalytics(timeframe) {
        return this.getRevenueData(timeframe);
    }
    async getRevenueData(timeframe) {
        const { start, end } = this.getDateRange(timeframe);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        let interval = "day";
        let dateFormat = "yyyy-MM-dd";
        if (days > 90) {
            interval = "month";
            dateFormat = "yyyy-MM";
        }
        else if (days > 31) {
            interval = "week";
            dateFormat = "yyyy-ww";
        }
        const payments = await this.paymentRepository.find({
            where: {
                createdAt: (0, typeorm_2.Between)(start, end),
                status: common_enums_1.PaymentStatus.COMPLETED,
            },
        });
        const revenueByPeriod = {};
        payments.forEach((payment) => {
            let key;
            if (interval === "day") {
                key = (0, date_fns_1.format)(payment.createdAt, dateFormat);
            }
            else if (interval === "week") {
                const weekNumber = Math.ceil((payment.createdAt.getDate() +
                    new Date(payment.createdAt.getFullYear(), payment.createdAt.getMonth(), 1).getDay()) /
                    7);
                key = `${(0, date_fns_1.format)(payment.createdAt, "yyyy-MM")}-W${weekNumber}`;
            }
            else {
                key = (0, date_fns_1.format)(payment.createdAt, dateFormat);
            }
            revenueByPeriod[key] =
                (revenueByPeriod[key] || 0) + Number(payment.amount);
        });
        const labels = Object.keys(revenueByPeriod).sort();
        const data = labels.map((label) => revenueByPeriod[label]);
        return { labels, data, interval };
    }
    async getUserAnalytics(timeframe) {
        return this.getUserData(timeframe);
    }
    async getUserData(timeframe) {
        const { start, end } = this.getDateRange(timeframe);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        let interval = "day";
        let dateFormat = "yyyy-MM-dd";
        if (days > 90) {
            interval = "month";
            dateFormat = "yyyy-MM";
        }
        else if (days > 31) {
            interval = "week";
            dateFormat = "yyyy-ww";
        }
        const users = await this.userRepository.find({
            where: {
                createdAt: (0, typeorm_2.Between)(start, end),
            },
            select: {
                role: true,
                createdAt: true,
            },
        });
        const usersByPeriod = {};
        const creatorsByPeriod = {};
        users.forEach((user) => {
            let key;
            if (interval === "day") {
                key = (0, date_fns_1.format)(user.createdAt, dateFormat);
            }
            else if (interval === "week") {
                const weekNumber = Math.ceil((user.createdAt.getDate() +
                    new Date(user.createdAt.getFullYear(), user.createdAt.getMonth(), 1).getDay()) /
                    7);
                key = `${(0, date_fns_1.format)(user.createdAt, "yyyy-MM")}-W${weekNumber}`;
            }
            else {
                key = (0, date_fns_1.format)(user.createdAt, dateFormat);
            }
            if (user.role === user_entity_1.UserRole.FAN) {
                usersByPeriod[key] = (usersByPeriod[key] || 0) + 1;
            }
            else if (user.role === user_entity_1.UserRole.CREATOR) {
                creatorsByPeriod[key] = (creatorsByPeriod[key] || 0) + 1;
            }
        });
        const labels = Array.from(new Set([...Object.keys(usersByPeriod), ...Object.keys(creatorsByPeriod)])).sort();
        const userData = labels.map((label) => usersByPeriod[label] || 0);
        const creatorData = labels.map((label) => creatorsByPeriod[label] || 0);
        return {
            labels,
            datasets: [
                {
                    label: "Users",
                    data: userData,
                },
                {
                    label: "Creators",
                    data: creatorData,
                },
            ],
            interval,
        };
    }
    async getTransactionAnalytics(timeframe) {
        return this.getTransactionData(timeframe);
    }
    async getTransactionData(timeframe) {
        const { start, end } = this.getDateRange(timeframe);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        let interval = "day";
        let dateFormat = "yyyy-MM-dd";
        if (days > 90) {
            interval = "month";
            dateFormat = "yyyy-MM";
        }
        else if (days > 31) {
            interval = "week";
            dateFormat = "yyyy-ww";
        }
        const transactions = await this.paymentRepository.find({
            where: {
                createdAt: (0, typeorm_2.Between)(start, end),
            },
            select: {
                status: true,
                createdAt: true,
            },
        });
        const transactionsByPeriod = {};
        transactions.forEach((transaction) => {
            let key;
            if (interval === "day") {
                key = (0, date_fns_1.format)(transaction.createdAt, dateFormat);
            }
            else if (interval === "week") {
                const weekNumber = Math.ceil((transaction.createdAt.getDate() +
                    new Date(transaction.createdAt.getFullYear(), transaction.createdAt.getMonth(), 1).getDay()) /
                    7);
                key = `${(0, date_fns_1.format)(transaction.createdAt, "yyyy-MM")}-W${weekNumber}`;
            }
            else {
                key = (0, date_fns_1.format)(transaction.createdAt, dateFormat);
            }
            transactionsByPeriod[key] = (transactionsByPeriod[key] || 0) + 1;
        });
        const labels = Object.keys(transactionsByPeriod).sort();
        const data = labels.map((label) => transactionsByPeriod[label]);
        return { labels, data, interval };
    }
    async getTopCreators(limit = 5) {
        const creators = await this.userRepository.find({
            where: {
                role: user_entity_1.UserRole.CREATOR,
            },
            relations: ["paymentsReceived"],
        });
        const topCreators = creators.map((creator) => {
            const totalRevenue = creator.paymentsReceived
                .filter((payment) => payment.status === common_enums_1.PaymentStatus.COMPLETED)
                .reduce((sum, payment) => sum + Number(payment.amount), 0);
            return {
                id: creator.id,
                name: creator.name,
                email: creator.email,
                totalRevenue,
                growth: Math.floor(Math.random() * 40) - 10,
                fanCount: Math.floor(Math.random() * 1000) + 10,
            };
        });
        return topCreators
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, limit);
    }
    async getPaymentMethodsDistribution() {
        const payments = await this.paymentRepository.find({
            where: {
                status: common_enums_1.PaymentStatus.COMPLETED,
            },
            select: {
                method: true,
                amount: true,
            },
        });
        const methodTotals = {};
        payments.forEach((payment) => {
            const method = payment.method || "UNKNOWN";
            methodTotals[method] =
                (methodTotals[method] || 0) + Number(payment.amount);
        });
        const labels = Object.keys(methodTotals);
        const data = labels.map((label) => methodTotals[label]);
        return { labels, data };
    }
    async getAllEscrows(status, search, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const queryBuilder = this.escrowRepository
            .createQueryBuilder("escrow")
            .leftJoinAndSelect("escrow.buyer", "buyer")
            .leftJoinAndSelect("escrow.seller", "seller");
        if (search) {
            queryBuilder.where("(escrow.title ILIKE :search OR escrow.id::text ILIKE :search OR buyer.alias ILIKE :search OR seller.alias ILIKE :search)", { search: `%${search}%` });
        }
        if (status) {
            queryBuilder.andWhere("escrow.status = :status", { status });
        }
        const [escrows, total] = await Promise.all([
            queryBuilder
                .select([
                "escrow.id",
                "escrow.totalAmount",
                "escrow.title",
                "escrow.status",
                "escrow.createdAt",
                "escrow.expiresAt",
                "escrow.completedAt",
                "buyer.id",
                "buyer.alias",
                "seller.id",
                "seller.alias",
            ])
                .orderBy("escrow.createdAt", "DESC")
                .skip(skip)
                .take(limit)
                .getMany(),
            queryBuilder.getCount(),
        ]);
        return {
            escrows,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getEscrowDetails(escrowId) {
        const escrow = await this.escrowRepository.findOne({
            where: { id: escrowId },
            relations: ["buyer", "seller", "milestones", "disputes", "payment"],
        });
        if (!escrow) {
            throw new common_1.NotFoundException("Escrow not found");
        }
        return { escrow };
    }
    async releaseEscrow(escrowId) {
        const escrow = await this.escrowRepository.findOne({
            where: { id: escrowId },
            relations: ["buyer", "seller", "payment"],
        });
        if (!escrow) {
            throw new common_1.NotFoundException("Escrow not found");
        }
        if (escrow.status !== escrow_entity_1.EscrowStatus.FUNDED &&
            escrow.status !== escrow_entity_1.EscrowStatus.DISPUTED) {
            throw new common_1.BadRequestException(`Cannot release escrow in ${escrow.status} status`);
        }
        await this.escrowRepository.update(escrowId, {
            status: escrow_entity_1.EscrowStatus.RELEASED,
            completedAt: new Date(),
        });
        const sellerWallet = await this.walletRepository.findOne({
            where: { user: { id: escrow.sellerId } },
        });
        if (!sellerWallet) {
            throw new common_1.NotFoundException("Seller wallet not found");
        }
        await this.walletRepository.update(sellerWallet.id, {
            balance: Number(sellerWallet.balance) + Number(escrow.totalAmount),
        });
        await this.transactionLogRepository.save({
            userId: escrow.sellerId,
            action: "ESCROW_RELEASE",
            amount: escrow.totalAmount,
            details: {
                escrowId,
                releasedBy: "ADMIN",
            },
        });
        return { success: true, message: "Escrow funds released to seller" };
    }
    async refundEscrow(escrowId) {
        const escrow = await this.escrowRepository.findOne({
            where: { id: escrowId },
            relations: ["buyer", "seller", "payment"],
        });
        if (!escrow) {
            throw new common_1.NotFoundException("Escrow not found");
        }
        if (escrow.status !== escrow_entity_1.EscrowStatus.FUNDED &&
            escrow.status !== escrow_entity_1.EscrowStatus.DISPUTED) {
            throw new common_1.BadRequestException(`Cannot refund escrow in ${escrow.status} status`);
        }
        await this.escrowRepository.update(escrowId, {
            status: escrow_entity_1.EscrowStatus.REFUNDED,
            completedAt: new Date(),
        });
        const buyerWallet = await this.walletRepository.findOne({
            where: { user: { id: escrow.buyerId } },
        });
        if (!buyerWallet) {
            throw new common_1.NotFoundException("Buyer wallet not found");
        }
        await this.walletRepository.update(buyerWallet.id, {
            balance: Number(buyerWallet.balance) + Number(escrow.totalAmount),
        });
        await this.transactionLogRepository.save({
            userId: escrow.buyerId,
            action: "ESCROW_REFUND",
            amount: escrow.totalAmount,
            details: {
                escrowId,
                refundedBy: "ADMIN",
            },
        });
        return { success: true, message: "Escrow funds refunded to buyer" };
    }
    async getAllDisputes(status, search, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const queryBuilder = this.disputeRepository
            .createQueryBuilder("dispute")
            .leftJoinAndSelect("dispute.escrow", "escrow")
            .leftJoinAndSelect("dispute.createdBy", "createdBy")
            .leftJoinAndSelect("escrow.buyer", "buyer")
            .leftJoinAndSelect("escrow.seller", "seller");
        if (search) {
            queryBuilder.where("(dispute.id::text ILIKE :search OR escrow.id::text ILIKE :search OR buyer.alias ILIKE :search OR seller.alias ILIKE :search OR dispute.reason ILIKE :search)", { search: `%${search}%` });
        }
        if (status) {
            queryBuilder.andWhere("dispute.status = :status", { status });
        }
        const [disputes, total] = await Promise.all([
            queryBuilder
                .select([
                "dispute.id",
                "dispute.status",
                "dispute.reason",
                "dispute.createdAt",
                "dispute.resolvedAt",
                "dispute.resolution",
                "escrow.id",
                "escrow.totalAmount",
                "escrow.title",
                "createdBy.id",
                "createdBy.alias",
                "buyer.id",
                "buyer.alias",
                "seller.id",
                "seller.alias",
            ])
                .orderBy("dispute.createdAt", "DESC")
                .skip(skip)
                .take(limit)
                .getMany(),
            queryBuilder.getCount(),
        ]);
        return {
            disputes,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async getDisputeDetails(disputeId) {
        const dispute = await this.disputeRepository.findOne({
            where: { id: disputeId },
            relations: [
                "escrow",
                "createdBy",
                "reviewedBy",
                "escrow.buyer",
                "escrow.seller",
                "evidence",
                "messages",
                "messages.sender",
            ],
        });
        if (!dispute) {
            throw new common_1.NotFoundException("Dispute not found");
        }
        return { dispute };
    }
    async resolveDispute(disputeId, resolution, notes, buyerAmount, sellerAmount) {
        const dispute = await this.disputeRepository.findOne({
            where: { id: disputeId },
            relations: ["escrow", "escrow.buyer", "escrow.seller"],
        });
        if (!dispute) {
            throw new common_1.NotFoundException("Dispute not found");
        }
        if (dispute.status === dispute_entity_1.DisputeStatus.RESOLVED_BY_ADMIN ||
            dispute.status === dispute_entity_1.DisputeStatus.MUTUALLY_RESOLVED ||
            dispute.status === dispute_entity_1.DisputeStatus.CLOSED) {
            throw new common_1.BadRequestException(`Dispute is already resolved`);
        }
        const escrow = dispute.escrow;
        const totalAmount = Number(escrow.totalAmount);
        switch (resolution) {
            case dispute_entity_1.DisputeResolution.BUYER_REFUND:
                buyerAmount = totalAmount;
                sellerAmount = 0;
                break;
            case dispute_entity_1.DisputeResolution.SELLER_RECEIVE:
                buyerAmount = 0;
                sellerAmount = totalAmount;
                break;
            case dispute_entity_1.DisputeResolution.SPLIT:
                buyerAmount = totalAmount / 2;
                sellerAmount = totalAmount / 2;
                break;
            case dispute_entity_1.DisputeResolution.CUSTOM:
                if (buyerAmount === undefined || sellerAmount === undefined) {
                    throw new common_1.BadRequestException("Custom resolution requires buyerAmount and sellerAmount");
                }
                if (Number(buyerAmount) + Number(sellerAmount) !== totalAmount) {
                    throw new common_1.BadRequestException("Sum of buyer and seller amounts must equal the escrow total");
                }
                break;
            default:
                throw new common_1.BadRequestException("Invalid resolution type");
        }
        await this.disputeRepository.update(disputeId, {
            status: dispute_entity_1.DisputeStatus.RESOLVED_BY_ADMIN,
            resolution,
            buyerAmount,
            sellerAmount,
            resolvedAt: new Date(),
            resolutionNotes: notes,
        });
        await this.escrowRepository.update(escrow.id, {
            status: escrow_entity_1.EscrowStatus.COMPLETED,
            completedAt: new Date(),
        });
        if (buyerAmount > 0) {
            const buyerWallet = await this.walletRepository.findOne({
                where: { user: { id: escrow.buyerId } },
            });
            if (buyerWallet) {
                await this.walletRepository.update(buyerWallet.id, {
                    balance: Number(buyerWallet.balance) + buyerAmount,
                });
                await this.transactionLogRepository.save({
                    userId: escrow.buyerId,
                    action: "DISPUTE_RESOLUTION_REFUND",
                    amount: buyerAmount,
                    details: {
                        disputeId,
                        escrowId: escrow.id,
                        resolution,
                    },
                });
            }
        }
        if (sellerAmount > 0) {
            const sellerWallet = await this.walletRepository.findOne({
                where: { user: { id: escrow.sellerId } },
            });
            if (sellerWallet) {
                await this.walletRepository.update(sellerWallet.id, {
                    balance: Number(sellerWallet.balance) + sellerAmount,
                });
                await this.transactionLogRepository.save({
                    userId: escrow.sellerId,
                    action: "DISPUTE_RESOLUTION_RELEASE",
                    amount: sellerAmount,
                    details: {
                        disputeId,
                        escrowId: escrow.id,
                        resolution,
                    },
                });
            }
        }
        return {
            success: true,
            message: "Dispute resolved successfully",
            resolution: {
                type: resolution,
                buyerAmount,
                sellerAmount,
                notes,
            },
        };
    }
    async getChargebackBufferDetails() {
        const chargebackBufferWallet = await this.walletRepository.findOne({
            where: { chargebackBuffer: true },
        });
        if (!chargebackBufferWallet) {
            throw new common_1.NotFoundException("Chargeback buffer wallet not found");
        }
        const now = new Date();
        const oneMonthAgo = (0, date_fns_1.subMonths)(now, 1);
        const bufferEvents = await this.transactionLogRepository.find({
            where: [
                { action: "CHARGEBACK_BUFFER_ALLOCATION" },
                { action: "CHARGEBACK_BUFFER_DEDUCTION" },
            ],
            order: { createdAt: "DESC" },
        });
        const lastMonthEvents = bufferEvents.filter((event) => new Date(event.createdAt) >= oneMonthAgo);
        const totalAllocated = bufferEvents
            .filter((event) => event.action === "CHARGEBACK_BUFFER_ALLOCATION")
            .reduce((sum, event) => sum + Number(event.amount || 0), 0);
        const totalDeducted = bufferEvents
            .filter((event) => event.action === "CHARGEBACK_BUFFER_DEDUCTION")
            .reduce((sum, event) => sum + Number(event.amount || 0), 0);
        const lastMonthAllocated = lastMonthEvents
            .filter((event) => event.action === "CHARGEBACK_BUFFER_ALLOCATION")
            .reduce((sum, event) => sum + Number(event.amount || 0), 0);
        const lastMonthDeducted = lastMonthEvents
            .filter((event) => event.action === "CHARGEBACK_BUFFER_DEDUCTION")
            .reduce((sum, event) => sum + Number(event.amount || 0), 0);
        return {
            currentBalance: chargebackBufferWallet.balance,
            stats: {
                totalAllocated,
                totalDeducted,
                lastMonthAllocated,
                lastMonthDeducted,
                bufferUtilization: (totalDeducted /
                    (Number(chargebackBufferWallet.balance) + totalDeducted)) *
                    100,
                chargebackCount: bufferEvents.filter((e) => e.action === "CHARGEBACK_BUFFER_DEDUCTION").length,
            },
        };
    }
    async getChargebackBufferEvents(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [events, total] = await Promise.all([
            this.transactionLogRepository.find({
                where: [
                    { action: "CHARGEBACK_BUFFER_ALLOCATION" },
                    { action: "CHARGEBACK_BUFFER_DEDUCTION" },
                ],
                order: { createdAt: "DESC" },
                skip,
                take: limit,
            }),
            this.transactionLogRepository.count({
                where: [
                    { action: "CHARGEBACK_BUFFER_ALLOCATION" },
                    { action: "CHARGEBACK_BUFFER_DEDUCTION" },
                ],
            }),
        ]);
        const formattedEvents = events.map((event) => {
            var _a, _b, _c, _d;
            return ({
                id: event.id,
                type: event.action === "CHARGEBACK_BUFFER_ALLOCATION" ? "credit" : "debit",
                amount: event.amount,
                reason: ((_a = event.details) === null || _a === void 0 ? void 0 : _a.reason) || event.action,
                escrowId: (_b = event.details) === null || _b === void 0 ? void 0 : _b.escrowId,
                relatedUser: (_c = event.details) === null || _c === void 0 ? void 0 : _c.relatedUser,
                createdAt: event.createdAt,
                balance: (_d = event.details) === null || _d === void 0 ? void 0 : _d.balanceAfter,
            });
        });
        return {
            events: formattedEvents,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
    }
    async allocateToChargebackBuffer(amount) {
        if (amount <= 0) {
            throw new common_1.BadRequestException("Allocation amount must be positive");
        }
        const chargebackBufferWallet = await this.walletRepository.findOne({
            where: { chargebackBuffer: true },
        });
        if (!chargebackBufferWallet) {
            throw new common_1.NotFoundException("Chargeback buffer wallet not found");
        }
        const newBalance = Number(chargebackBufferWallet.balance) + amount;
        await this.walletRepository.update(chargebackBufferWallet.id, {
            balance: newBalance,
        });
        await this.transactionLogRepository.save({
            action: "CHARGEBACK_BUFFER_ALLOCATION",
            amount,
            details: {
                reason: "Admin allocation",
                balanceBefore: chargebackBufferWallet.balance,
                balanceAfter: newBalance,
            },
        });
        return {
            success: true,
            message: `Successfully allocated ${amount} to chargeback buffer`,
            newBalance,
        };
    }
    async getSystemLogs(type, level, search, startDate, endDate, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const queryBuilder = this.transactionLogRepository
            .createQueryBuilder("log")
            .leftJoinAndSelect("log.user", "user");
        if (type) {
            queryBuilder.andWhere("log.action ILIKE :type", { type: `%${type}%` });
        }
        if (level) {
            queryBuilder.andWhere("log.level = :level", { level });
        }
        if (search) {
            queryBuilder.andWhere("(log.action ILIKE :search OR log.details::text ILIKE :search OR user.alias ILIKE :search)", { search: `%${search}%` });
        }
        if (startDate) {
            queryBuilder.andWhere("log.createdAt >= :startDate", { startDate });
        }
        if (endDate) {
            queryBuilder.andWhere("log.createdAt <= :endDate", { endDate });
        }
        const [logs, total] = await Promise.all([
            queryBuilder
                .select([
                "log.id",
                "log.action",
                "log.details",
                "log.amount",
                "log.createdAt",
                "log.level",
                "user.id",
                "user.alias",
            ])
                .orderBy("log.createdAt", "DESC")
                .skip(skip)
                .take(limit)
                .getMany(),
            queryBuilder.getCount(),
        ]);
        const formattedLogs = logs.map((log) => {
            var _a, _b, _c, _d, _e;
            return ({
                id: log.id,
                type: this.getLogTypeFromAction(log.action),
                action: log.action,
                timestamp: log.createdAt,
                userAlias: (_a = log.user) === null || _a === void 0 ? void 0 : _a.alias,
                userId: (_b = log.user) === null || _b === void 0 ? void 0 : _b.id,
                adminId: (_c = log.details) === null || _c === void 0 ? void 0 : _c.adminId,
                metadata: log.details,
                level: log.level || "info",
                ipAddress: (_d = log.details) === null || _d === void 0 ? void 0 : _d.ipAddress,
                userAgent: (_e = log.details) === null || _e === void 0 ? void 0 : _e.userAgent,
            });
        });
        return {
            logs: formattedLogs,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            },
        };
    }
    getLogTypeFromAction(action) {
        if (action.includes("ESCROW")) {
            return "ESCROW_EVENT";
        }
        else if (action.includes("DISPUTE")) {
            return "DISPUTE";
        }
        else if (action.includes("PAYMENT") || action.includes("STRIPE")) {
            return "STRIPE_WEBHOOK";
        }
        else if (action.includes("ADMIN")) {
            return "ADMIN_ACTION";
        }
        else if (action.includes("USER")) {
            return "USER_EVENT";
        }
        else if (action.includes("LOGIN") ||
            action.includes("PASSWORD") ||
            action.includes("SECURITY")) {
            return "SECURITY_EVENT";
        }
        else {
            return "SYSTEM_EVENT";
        }
    }
};
AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __param(2, (0, typeorm_1.InjectRepository)(dispute_entity_1.Dispute)),
    __param(3, (0, typeorm_1.InjectRepository)(escrow_entity_1.Escrow)),
    __param(4, (0, typeorm_1.InjectRepository)(wallet_entity_1.Wallet)),
    __param(5, (0, typeorm_1.InjectRepository)(dispute_evidence_entity_1.DisputeEvidence)),
    __param(6, (0, typeorm_1.InjectRepository)(dispute_message_entity_1.DisputeMessage)),
    __param(7, (0, typeorm_1.InjectRepository)(withdrawal_entity_1.Withdrawal)),
    __param(8, (0, typeorm_1.InjectRepository)(deposit_entity_1.Deposit)),
    __param(9, (0, typeorm_1.InjectRepository)(transaction_log_entity_1.TransactionLog)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AdminService);
exports.AdminService = AdminService;
//# sourceMappingURL=admin.service.js.map