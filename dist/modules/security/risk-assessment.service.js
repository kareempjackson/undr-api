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
exports.RiskAssessmentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const risk_assessment_entity_1 = require("../../entities/risk-assessment.entity");
const user_entity_1 = require("../../entities/user.entity");
const payment_entity_1 = require("../../entities/payment.entity");
let RiskAssessmentService = class RiskAssessmentService {
    constructor(riskAssessmentRepository, userRepository, paymentRepository) {
        this.riskAssessmentRepository = riskAssessmentRepository;
        this.userRepository = userRepository;
        this.paymentRepository = paymentRepository;
    }
    async assessTransactionRisk(userId, paymentId, amount, ipAddress, deviceInfo, location) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ["paymentsSent"],
        });
        const riskAssessment = new risk_assessment_entity_1.RiskAssessment();
        riskAssessment.userId = userId;
        riskAssessment.paymentId = paymentId;
        riskAssessment.ipAddress = ipAddress;
        riskAssessment.deviceInfo = deviceInfo;
        riskAssessment.location = location;
        riskAssessment.riskLevel = risk_assessment_entity_1.RiskLevel.LOW;
        riskAssessment.riskScore = 0;
        riskAssessment.riskFlags = [];
        let riskScore = 0;
        const flags = [];
        if (user.location && location && user.location !== location) {
            flags.push(risk_assessment_entity_1.RiskFlag.UNUSUAL_LOCATION);
            riskScore += 15;
        }
        if ((deviceInfo === null || deviceInfo === void 0 ? void 0 : deviceInfo.fingerprint) &&
            user.trustedDevices.length > 0 &&
            !user.trustedDevices.some((device) => device.fingerprint === deviceInfo.fingerprint)) {
            flags.push(risk_assessment_entity_1.RiskFlag.DEVICE_CHANGE);
            riskScore += 10;
        }
        if (amount) {
            const averageAmount = user.paymentsSent.reduce((sum, payment) => sum + Number(payment.amount), 0) / (user.paymentsSent.length || 1);
            if (amount > averageAmount * 2 && amount > 100) {
                flags.push(risk_assessment_entity_1.RiskFlag.LARGE_TRANSACTION);
                riskScore += 20;
            }
        }
        const recentPayments = user.paymentsSent.filter((payment) => new Date().getTime() - new Date(payment.createdAt).getTime() < 3600000);
        if (recentPayments.length >= 3) {
            flags.push(risk_assessment_entity_1.RiskFlag.RAPID_SUCCESSION_PAYMENTS);
            riskScore += 15;
        }
        let riskLevel = risk_assessment_entity_1.RiskLevel.LOW;
        if (riskScore >= 50) {
            riskLevel = risk_assessment_entity_1.RiskLevel.CRITICAL;
            riskAssessment.requires3ds = true;
            riskAssessment.requiresMfa = true;
        }
        else if (riskScore >= 30) {
            riskLevel = risk_assessment_entity_1.RiskLevel.HIGH;
            riskAssessment.requires3ds = true;
        }
        else if (riskScore >= 15) {
            riskLevel = risk_assessment_entity_1.RiskLevel.MEDIUM;
        }
        riskAssessment.riskLevel = riskLevel;
        riskAssessment.riskScore = riskScore;
        riskAssessment.riskFlags = flags;
        riskAssessment.reviewRequired =
            riskLevel === risk_assessment_entity_1.RiskLevel.HIGH || riskLevel === risk_assessment_entity_1.RiskLevel.CRITICAL;
        riskAssessment.blocked = riskLevel === risk_assessment_entity_1.RiskLevel.CRITICAL;
        const savedAssessment = await this.riskAssessmentRepository.save(riskAssessment);
        if (paymentId) {
            await this.paymentRepository.update(paymentId, {
                riskScore: riskScore,
                isHighRisk: riskLevel === risk_assessment_entity_1.RiskLevel.HIGH || riskLevel === risk_assessment_entity_1.RiskLevel.CRITICAL,
            });
        }
        return savedAssessment;
    }
    async reviewRiskAssessment(riskAssessmentId, reviewerId, approved, notes) {
        const riskAssessment = await this.riskAssessmentRepository.findOneBy({
            id: riskAssessmentId,
        });
        if (!riskAssessment) {
            throw new Error("Risk assessment not found");
        }
        riskAssessment.reviewedByUserId = reviewerId;
        riskAssessment.reviewNotes = notes;
        riskAssessment.reviewedAt = new Date();
        riskAssessment.blocked = !approved;
        return this.riskAssessmentRepository.save(riskAssessment);
    }
    async getPendingReviews() {
        return this.riskAssessmentRepository.find({
            where: { reviewRequired: true, reviewedAt: null },
            relations: ["user", "payment"],
            order: { createdAt: "DESC" },
        });
    }
};
RiskAssessmentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(risk_assessment_entity_1.RiskAssessment)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(payment_entity_1.Payment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], RiskAssessmentService);
exports.RiskAssessmentService = RiskAssessmentService;
//# sourceMappingURL=risk-assessment.service.js.map