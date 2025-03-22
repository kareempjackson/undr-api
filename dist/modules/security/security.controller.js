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
exports.SecurityController = void 0;
const common_1 = require("@nestjs/common");
const risk_assessment_service_1 = require("./risk-assessment.service");
const three_ds_service_1 = require("./three-ds.service");
const dispute_service_1 = require("./dispute.service");
const escrow_service_1 = require("./escrow.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let SecurityController = class SecurityController {
    constructor(riskAssessmentService, threeDsService, disputeService, escrowService) {
        this.riskAssessmentService = riskAssessmentService;
        this.threeDsService = threeDsService;
        this.disputeService = disputeService;
        this.escrowService = escrowService;
    }
    async create3dsIntent(body, req) {
        const { amount, currency, paymentMethodId, customerId, metadata } = body;
        return this.threeDsService.create3dsPaymentIntent(amount, currency, paymentMethodId, customerId, metadata);
    }
    async check3dsStatus(paymentIntentId) {
        return this.threeDsService.check3dsConfirmationStatus(paymentIntentId);
    }
    async assessRisk(body, req) {
        const { paymentId, amount, ipAddress, deviceInfo, location } = body;
        return this.riskAssessmentService.assessTransactionRisk(req.user.id, paymentId, amount, ipAddress, deviceInfo, location);
    }
    async getPendingRiskReviews() {
        return this.riskAssessmentService.getPendingReviews();
    }
    async reviewRiskAssessment(id, body, req) {
        const { approved, notes } = body;
        return this.riskAssessmentService.reviewRiskAssessment(id, req.user.id, approved, notes);
    }
    async createDispute(body, req) {
        const { paymentId, reason, description, evidenceFiles } = body;
        return this.disputeService.createDispute({
            paymentId,
            filedByUserId: req.user.id,
            reason,
            description,
            evidenceFiles,
        });
    }
    async addDisputeEvidence(id, body, req) {
        const { description, files } = body;
        return this.disputeService.addEvidence(id, req.user.id, {
            description,
            files,
        });
    }
    async resolveDispute(id, body, req) {
        const { resolveForCustomer, resolutionNotes } = body;
        return this.disputeService.resolveDispute({
            disputeId: id,
            resolvedByUserId: req.user.id,
            resolveForCustomer,
            resolutionNotes,
        });
    }
    async getDisputes(query, req) {
        const { status, limit, offset } = query;
        return this.disputeService.getDisputes({
            status,
            userId: req.user.id,
            limit: limit ? parseInt(limit) : undefined,
            offset: offset ? parseInt(offset) : undefined,
        });
    }
    async getDisputeById(id) {
        return this.disputeService.getDisputeById(id);
    }
    async createEscrow(body, req) {
        const { title, description, totalAmount, sellerId, expirationDays, milestones, terms, } = body;
        return this.escrowService.createEscrow({
            title,
            description,
            totalAmount,
            buyerId: req.user.id,
            sellerId,
            expirationDays,
            milestones,
            terms,
        });
    }
    async fundEscrow(id, req) {
        return this.escrowService.fundEscrow(id, req.user.id);
    }
    async updateMilestone(escrowId, milestoneId, body, req) {
        const { status } = body;
        return this.escrowService.updateMilestone({
            escrowId,
            milestoneId,
            status,
            userId: req.user.id,
        });
    }
    async completeEscrow(id) {
        return this.escrowService.completeEscrow(id);
    }
    async cancelEscrow(id, req) {
        return this.escrowService.cancelEscrow(id, req.user.id);
    }
    async getEscrows(query, req) {
        const { status, limit, offset } = query;
        return this.escrowService.getEscrowsByUser(req.user.id, status, limit ? parseInt(limit) : undefined, offset ? parseInt(offset) : undefined);
    }
    async getEscrowById(id) {
        return this.escrowService.getEscrowById(id);
    }
};
__decorate([
    (0, common_1.Post)("3ds/create-intent"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "create3dsIntent", null);
__decorate([
    (0, common_1.Get)("3ds/check/:paymentIntentId"),
    __param(0, (0, common_1.Param)("paymentIntentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "check3dsStatus", null);
__decorate([
    (0, common_1.Post)("risk/assess"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "assessRisk", null);
__decorate([
    (0, common_1.Get)("risk/reviews"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getPendingRiskReviews", null);
__decorate([
    (0, common_1.Patch)("risk/review/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "reviewRiskAssessment", null);
__decorate([
    (0, common_1.Post)("disputes"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "createDispute", null);
__decorate([
    (0, common_1.Post)("disputes/:id/evidence"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "addDisputeEvidence", null);
__decorate([
    (0, common_1.Patch)("disputes/:id/resolve"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "resolveDispute", null);
__decorate([
    (0, common_1.Get)("disputes"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getDisputes", null);
__decorate([
    (0, common_1.Get)("disputes/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getDisputeById", null);
__decorate([
    (0, common_1.Post)("escrows"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "createEscrow", null);
__decorate([
    (0, common_1.Post)("escrows/:id/fund"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "fundEscrow", null);
__decorate([
    (0, common_1.Patch)("escrows/:escrowId/milestones/:milestoneId"),
    __param(0, (0, common_1.Param)("escrowId")),
    __param(1, (0, common_1.Param)("milestoneId")),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "updateMilestone", null);
__decorate([
    (0, common_1.Post)("escrows/:id/complete"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "completeEscrow", null);
__decorate([
    (0, common_1.Post)("escrows/:id/cancel"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "cancelEscrow", null);
__decorate([
    (0, common_1.Get)("escrows"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getEscrows", null);
__decorate([
    (0, common_1.Get)("escrows/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getEscrowById", null);
SecurityController = __decorate([
    (0, common_1.Controller)("security"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [risk_assessment_service_1.RiskAssessmentService,
        three_ds_service_1.ThreeDsService,
        dispute_service_1.DisputeService,
        escrow_service_1.EscrowService])
], SecurityController);
exports.SecurityController = SecurityController;
//# sourceMappingURL=security.controller.js.map