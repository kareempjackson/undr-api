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
exports.EscrowController = void 0;
const common_1 = require("@nestjs/common");
const escrow_service_1 = require("../services/escrow.service");
const jwt_auth_guard_1 = require("../modules/auth/guards/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
const escrow_dto_1 = require("../dtos/escrow.dto");
let EscrowController = class EscrowController {
    constructor(escrowService) {
        this.escrowService = escrowService;
    }
    async createEscrow(createEscrowDto, req) {
        const requestMetadata = this.extractRequestMetadata(req);
        if (req.user.id !== createEscrowDto.fromUserId) {
            throw new common_1.ForbiddenException("Only the sender can create an escrow");
        }
        return this.escrowService.createEscrow(createEscrowDto, requestMetadata);
    }
    async getEscrow(id, req) {
        const escrow = await this.escrowService.findOne(id);
        if (req.user.id !== escrow.fromUserId &&
            req.user.id !== escrow.toUserId) {
            throw new common_1.ForbiddenException("Access denied");
        }
        return escrow;
    }
    async getUserEscrows(query, req) {
        const limit = query.limit || 20;
        const offset = query.offset || 0;
        return this.escrowService.findByUser(req.user.id, limit, offset);
    }
    async submitProof(id, proofDto, req) {
        const requestMetadata = this.extractRequestMetadata(req);
        return this.escrowService.submitDeliveryProof(id, proofDto, req.user.id, requestMetadata);
    }
    async releaseFunds(id, req) {
        const requestMetadata = this.extractRequestMetadata(req);
        return this.escrowService.releaseFunds(id, req.user.id, requestMetadata);
    }
    async issueRefund(id, refundDto, req) {
        const requestMetadata = this.extractRequestMetadata(req);
        return this.escrowService.issueRefund(id, req.user.id, refundDto.reason, requestMetadata);
    }
    extractRequestMetadata(req) {
        return {
            ipHash: this.hashIp(req.ip || ""),
            userAgent: req.headers["user-agent"],
            deviceFingerprint: req.headers["x-device-fingerprint"],
        };
    }
    hashIp(ip) {
        return Buffer.from(ip).toString("base64");
    }
};
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: "Create a new escrow" }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: "Escrow created successfully",
        type: escrow_dto_1.EscrowResponseDTO,
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [escrow_dto_1.EscrowCreateDTO, Object]),
    __metadata("design:returntype", Promise)
], EscrowController.prototype, "createEscrow", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Get escrow by ID" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Return the escrow",
        type: escrow_dto_1.EscrowResponseDTO,
    }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EscrowController.prototype, "getEscrow", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "Get escrows for the current user" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Return the escrows",
        type: [escrow_dto_1.EscrowResponseDTO],
    }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [escrow_dto_1.EscrowQueryDTO, Object]),
    __metadata("design:returntype", Promise)
], EscrowController.prototype, "getUserEscrows", null);
__decorate([
    (0, common_1.Post)(":id/proof"),
    (0, swagger_1.ApiOperation)({ summary: "Submit proof of delivery" }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Proof submitted successfully" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, escrow_dto_1.DeliveryProofSubmitDTO, Object]),
    __metadata("design:returntype", Promise)
], EscrowController.prototype, "submitProof", null);
__decorate([
    (0, common_1.Post)(":id/release"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Release funds from escrow" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Funds released successfully" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EscrowController.prototype, "releaseFunds", null);
__decorate([
    (0, common_1.Post)(":id/refund"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Issue a refund" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Refund issued successfully" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, escrow_dto_1.RefundRequestDTO, Object]),
    __metadata("design:returntype", Promise)
], EscrowController.prototype, "issueRefund", null);
EscrowController = __decorate([
    (0, swagger_1.ApiTags)("escrow"),
    (0, common_1.Controller)("escrow"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [escrow_service_1.EscrowService])
], EscrowController);
exports.EscrowController = EscrowController;
//# sourceMappingURL=escrow.controller.js.map