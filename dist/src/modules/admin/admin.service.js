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
let AdminService = class AdminService {
    constructor(userRepository, paymentRepository) {
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
    }
    async getAllUsers() {
        return this.userRepository.find({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                status: true,
            },
        });
    }
    async getAllTransactions() {
        return this.paymentRepository.find({
            relations: ["fromUser", "toUser"],
        });
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
        return { success: true, message: `User role updated to ${role}` };
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
};
AdminService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AdminService);
exports.AdminService = AdminService;
//# sourceMappingURL=admin.service.js.map