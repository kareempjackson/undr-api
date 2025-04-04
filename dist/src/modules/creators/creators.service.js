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
exports.CreatorsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../entities/user.entity");
const payment_entity_1 = require("../../entities/payment.entity");
const common_enums_1 = require("../../entities/common.enums");
const config_1 = require("@nestjs/config");
const alias_service_1 = require("../common/services/alias.service");
let CreatorsService = class CreatorsService {
    constructor(userRepository, paymentRepository, configService, aliasService) {
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
        this.configService = configService;
        this.aliasService = aliasService;
    }
    async getDashboard(creatorId) {
        var _a;
        const creator = await this.userRepository.findOne({
            where: { id: creatorId },
            relations: ["wallet"],
        });
        if (!creator || creator.role !== user_entity_1.UserRole.CREATOR) {
            throw new common_1.NotFoundException("Creator not found");
        }
        const paymentCount = await this.paymentRepository.count({
            where: { toUserId: creatorId },
        });
        const payments = await this.paymentRepository.find({
            where: {
                toUserId: creatorId,
                status: common_enums_1.PaymentStatus.COMPLETED,
            },
        });
        const totalEarnings = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
        const recentTransactions = await this.paymentRepository.find({
            where: { toUserId: creatorId },
            order: { createdAt: "DESC" },
            take: 5,
            relations: ["fromUser"],
        });
        return {
            balance: ((_a = creator.wallet) === null || _a === void 0 ? void 0 : _a.balance) || 0,
            totalEarnings,
            paymentCount,
            recentTransactions,
        };
    }
    async getEarnings(creatorId) {
        const creator = await this.userRepository.findOne({
            where: { id: creatorId },
        });
        if (!creator || creator.role !== user_entity_1.UserRole.CREATOR) {
            throw new common_1.NotFoundException("Creator not found");
        }
        const payments = await this.paymentRepository.find({
            where: {
                toUserId: creatorId,
                status: common_enums_1.PaymentStatus.COMPLETED,
            },
            order: { createdAt: "DESC" },
        });
        const earningsByMonth = payments.reduce((acc, payment) => {
            const date = new Date(payment.createdAt);
            const month = `${date.getFullYear()}-${(date.getMonth() + 1)
                .toString()
                .padStart(2, "0")}`;
            if (!acc[month]) {
                acc[month] = 0;
            }
            acc[month] += payment.amount;
            return acc;
        }, {});
        return {
            earningsByMonth,
            totalEarnings: payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
            transactionCount: payments.length,
        };
    }
    async getPaymentLink(creatorId) {
        const creator = await this.userRepository.findOne({
            where: { id: creatorId },
        });
        if (!creator || creator.role !== user_entity_1.UserRole.CREATOR) {
            throw new common_1.NotFoundException("Creator not found");
        }
        const alias = await this.aliasService.generateUniqueAlias(creatorId);
        const frontendUrl = this.configService.get("FRONTEND_URL") || "http://localhost:3000";
        return {
            alias,
            paymentUrl: `${frontendUrl}/pay/${alias}`,
            apiEndpoint: `/api/fans/pay/${alias}`,
        };
    }
    async getPaymentLinkByAlias(alias) {
        const creator = await this.aliasService.findUserByAlias(alias);
        if (creator.role !== user_entity_1.UserRole.CREATOR) {
            throw new common_1.NotFoundException("Creator not found");
        }
        const frontendUrl = this.configService.get("FRONTEND_URL") || "http://localhost:3000";
        return {
            alias,
            paymentUrl: `${frontendUrl}/pay/${alias}`,
            apiEndpoint: `/api/fans/pay/${alias}`,
        };
    }
};
CreatorsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        alias_service_1.AliasService])
], CreatorsService);
exports.CreatorsService = CreatorsService;
//# sourceMappingURL=creators.service.js.map