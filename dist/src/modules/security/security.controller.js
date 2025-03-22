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
var SecurityController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityController = void 0;
const common_1 = require("@nestjs/common");
const risk_assessment_service_1 = require("./risk-assessment.service");
const three_ds_service_1 = require("./three-ds.service");
const dispute_service_1 = require("./dispute.service");
const escrow_service_1 = require("./escrow.service");
const escrow_dto_1 = require("../../dtos/escrow.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
let SecurityController = SecurityController_1 = class SecurityController {
    constructor(riskAssessmentService, threeDsService, disputeService, escrowService) {
        this.riskAssessmentService = riskAssessmentService;
        this.threeDsService = threeDsService;
        this.disputeService = disputeService;
        this.escrowService = escrowService;
        this.logger = new common_1.Logger(SecurityController_1.name);
    }
    extractRequestMetadata(req) {
        var _a;
        return {
            ip: req.ip,
            userAgent: req.headers["user-agent"],
            timestamp: new Date().toISOString(),
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
        };
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
        try {
            const { title, description, totalAmount, sellerId, expirationDays, milestones, terms, documents, } = body;
            const requestMetadata = this.extractRequestMetadata(req);
            return this.escrowService.createEscrow({
                title,
                description,
                totalAmount,
                buyerId: req.user.id,
                sellerId,
                expirationDays,
                milestones,
                terms,
                documents,
            }, requestMetadata);
        }
        catch (error) {
            this.logger.error(`Error creating escrow: ${error.message}`, error.stack);
            throw error;
        }
    }
    async fundEscrow(id, req) {
        const requestMetadata = this.extractRequestMetadata(req);
        return this.escrowService.fundEscrow(id, req.user.id, requestMetadata);
    }
    async submitDeliveryProof(id, data, req) {
        const requestMetadata = this.extractRequestMetadata(req);
        return this.escrowService.submitDeliveryProof(id, data, req.user.id, requestMetadata);
    }
    async getEscrowProofs(id, req) {
        const escrow = await this.escrowService.getEscrowById(id);
        if (escrow.buyerId !== req.user.id && escrow.sellerId !== req.user.id) {
            throw new common_1.ForbiddenException("You do not have access to this escrow");
        }
        return this.escrowService.getEscrowProofs(id);
    }
    async reviewDeliveryProof(proofId, data, req) {
        const requestMetadata = this.extractRequestMetadata(req);
        return this.escrowService.reviewDeliveryProof(proofId, data.decision, req.user.id, data.rejectionReason, requestMetadata);
    }
    async updateMilestone(escrowId, milestoneId, body, req) {
        const { status } = body;
        const requestMetadata = this.extractRequestMetadata(req);
        return this.escrowService.updateMilestone({
            escrowId,
            milestoneId,
            status,
            userId: req.user.id,
        }, requestMetadata);
    }
    async completeEscrow(id, req) {
        const escrow = await this.escrowService.getEscrowById(id);
        if (escrow.buyerId !== req.user.id) {
            throw new common_1.ForbiddenException("Only the buyer can manually complete an escrow");
        }
        return this.escrowService.completeEscrow(id);
    }
    async cancelEscrow(id, req) {
        const requestMetadata = this.extractRequestMetadata(req);
        return this.escrowService.cancelEscrow(id, req.user.id, requestMetadata);
    }
    async getEscrows(query, req) {
        const { status, limit, offset } = query;
        return this.escrowService.getEscrowsByUser(req.user.id, status, limit ? parseInt(limit) : undefined, offset ? parseInt(offset) : undefined);
    }
    async getEscrowById(id, req) {
        const escrow = await this.escrowService.getEscrowById(id);
        if (escrow.buyerId !== req.user.id && escrow.sellerId !== req.user.id) {
            throw new common_1.ForbiddenException("You do not have access to this escrow");
        }
        return escrow;
    }
};
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Create a 3DS payment intent" }),
    (0, common_1.Post)("3ds/create-intent"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "create3dsIntent", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Check 3DS payment status" }),
    (0, common_1.Get)("3ds/check/:paymentIntentId"),
    __param(0, (0, common_1.Param)("paymentIntentId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "check3dsStatus", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Assess transaction risk" }),
    (0, common_1.Post)("risk/assess"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "assessRisk", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get pending risk reviews" }),
    (0, common_1.Get)("risk/reviews"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getPendingRiskReviews", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Review a risk assessment" }),
    (0, common_1.Patch)("risk/review/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "reviewRiskAssessment", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Create a dispute" }),
    (0, common_1.Post)("disputes"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "createDispute", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Add evidence to a dispute" }),
    (0, common_1.Post)("disputes/:id/evidence"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "addDisputeEvidence", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Resolve a dispute" }),
    (0, common_1.Patch)("disputes/:id/resolve"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "resolveDispute", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get disputes" }),
    (0, common_1.Get)("disputes"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getDisputes", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get a dispute by ID" }),
    (0, common_1.Get)("disputes/:id"),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getDisputeById", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Create an escrow agreement" }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Escrow created successfully" }),
    (0, common_1.Post)("escrows"),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "createEscrow", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Fund an escrow" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Escrow funded successfully" }),
    (0, common_1.Post)("escrows/:id/fund"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "fundEscrow", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Submit delivery proof for an escrow" }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Proof submitted successfully" }),
    (0, common_1.Post)("escrows/:id/proof"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, escrow_dto_1.DeliveryProofSubmitDTO, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "submitDeliveryProof", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get proofs for an escrow" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Proofs retrieved successfully" }),
    (0, common_1.Get)("escrows/:id/proofs"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getEscrowProofs", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Review a submitted proof" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Proof reviewed successfully" }),
    (0, common_1.Patch)("escrows/proofs/:proofId"),
    __param(0, (0, common_1.Param)("proofId")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, escrow_dto_1.ReviewProofDTO, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "reviewDeliveryProof", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Update a milestone" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Milestone updated successfully" }),
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
    (0, swagger_1.ApiOperation)({ summary: "Complete an escrow" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Escrow completed successfully" }),
    (0, common_1.Post)("escrows/:id/complete"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "completeEscrow", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Cancel an escrow" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Escrow cancelled successfully" }),
    (0, common_1.Post)("escrows/:id/cancel"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "cancelEscrow", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get user's escrows" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Escrows retrieved successfully" }),
    (0, common_1.Get)("escrows"),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getEscrows", null);
__decorate([
    (0, swagger_1.ApiOperation)({ summary: "Get an escrow by ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Escrow retrieved successfully" }),
    (0, common_1.Get)("escrows/:id"),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SecurityController.prototype, "getEscrowById", null);
SecurityController = SecurityController_1 = __decorate([
    (0, swagger_1.ApiTags)("Security"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)("security"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [risk_assessment_service_1.RiskAssessmentService,
        three_ds_service_1.ThreeDsService,
        dispute_service_1.DisputeService,
        escrow_service_1.EscrowService])
], SecurityController);
exports.SecurityController = SecurityController;
//# sourceMappingURL=security.controller.js.map