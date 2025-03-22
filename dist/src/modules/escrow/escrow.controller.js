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
var EscrowController_1;
var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscrowController = void 0;
const common_1 = require("@nestjs/common");
const escrow_service_1 = require("./escrow.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const swagger_1 = require("@nestjs/swagger");
const escrow_dto_1 = require("../../dtos/escrow.dto");
const request_with_user_interface_1 = require("../../interfaces/request-with-user.interface");
let EscrowController = EscrowController_1 = class EscrowController {
    constructor(escrowService) {
        this.escrowService = escrowService;
        this.logger = new common_1.Logger(EscrowController_1.name);
    }
    async createEscrow(createEscrowDto, req) {
        const requestMetadata = this.extractRequestMetadata(req);
        if (createEscrowDto.fromUserId !== req.user.id) {
            throw new common_1.ForbiddenException("You can only create escrows from your own account");
        }
        const escrow = await this.escrowService.createEscrow(createEscrowDto, requestMetadata);
        return escrow;
    }
    async getEscrow(id, req) {
        const escrow = await this.escrowService.findOne(id);
        if (escrow.fromUserId !== req.user.id && escrow.toUserId !== req.user.id) {
            throw new common_1.UnauthorizedException("Not authorized to view this escrow");
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
        var _a;
        const ip = req.ip || ((_a = req.connection) === null || _a === void 0 ? void 0 : _a.remoteAddress);
        return {
            ipHash: ip ? this.hashIdentifier(ip) : undefined,
            userAgent: req.headers["user-agent"],
            deviceFingerprint: req.headers["x-device-fingerprint"],
            timestamp: new Date().toISOString(),
        };
    }
    hashIdentifier(identifier) {
        return identifier
            .split("")
            .map((c) => c.charCodeAt(0).toString(16))
            .join("");
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
    __metadata("design:paramtypes", [typeof (_a = typeof escrow_dto_1.EscrowCreateDTO !== "undefined" && escrow_dto_1.EscrowCreateDTO) === "function" ? _a : Object, typeof (_b = typeof request_with_user_interface_1.RequestWithUser !== "undefined" && request_with_user_interface_1.RequestWithUser) === "function" ? _b : Object]),
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
    __metadata("design:paramtypes", [String, typeof (_c = typeof request_with_user_interface_1.RequestWithUser !== "undefined" && request_with_user_interface_1.RequestWithUser) === "function" ? _c : Object]),
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
    __metadata("design:paramtypes", [typeof (_d = typeof escrow_dto_1.EscrowQueryDTO !== "undefined" && escrow_dto_1.EscrowQueryDTO) === "function" ? _d : Object, typeof (_e = typeof request_with_user_interface_1.RequestWithUser !== "undefined" && request_with_user_interface_1.RequestWithUser) === "function" ? _e : Object]),
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
    __metadata("design:paramtypes", [String, typeof (_f = typeof escrow_dto_1.DeliveryProofSubmitDTO !== "undefined" && escrow_dto_1.DeliveryProofSubmitDTO) === "function" ? _f : Object, typeof (_g = typeof request_with_user_interface_1.RequestWithUser !== "undefined" && request_with_user_interface_1.RequestWithUser) === "function" ? _g : Object]),
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
    __metadata("design:paramtypes", [String, typeof (_h = typeof request_with_user_interface_1.RequestWithUser !== "undefined" && request_with_user_interface_1.RequestWithUser) === "function" ? _h : Object]),
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
    __metadata("design:paramtypes", [String, typeof (_j = typeof escrow_dto_1.RefundRequestDTO !== "undefined" && escrow_dto_1.RefundRequestDTO) === "function" ? _j : Object, typeof (_k = typeof request_with_user_interface_1.RequestWithUser !== "undefined" && request_with_user_interface_1.RequestWithUser) === "function" ? _k : Object]),
    __metadata("design:returntype", Promise)
], EscrowController.prototype, "issueRefund", null);
EscrowController = EscrowController_1 = __decorate([
    (0, swagger_1.ApiTags)("escrow"),
    (0, common_1.Controller)("escrow"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [escrow_service_1.EscrowService])
], EscrowController);
exports.EscrowController = EscrowController;
//# sourceMappingURL=escrow.controller.js.map