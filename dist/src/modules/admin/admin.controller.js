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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_service_1 = require("./admin.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const dispute_entity_1 = require("../../entities/dispute.entity");
const escrow_entity_1 = require("../../entities/escrow.entity");
const user_entity_1 = require("../../entities/user.entity");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getAllUsers(search, role, status, page = 1, limit = 10) {
        return this.adminService.getAllUsers(search, role, status, page, limit);
    }
    async getUserDetails(userId) {
        return this.adminService.getUserDetails(userId);
    }
    async updateUserStatus(userId, data) {
        return this.adminService.updateUserStatus(userId, data.status);
    }
    async updateUserRole(userId, data) {
        return this.adminService.updateUserRole(userId, data.role);
    }
    async flagUser(userId, data) {
        return this.adminService.flagUser(userId, data.reason, data.details);
    }
    async getAllEscrows(status, search, page = 1, limit = 10) {
        return this.adminService.getAllEscrows(status, search, page, limit);
    }
    async getEscrowDetails(escrowId) {
        return this.adminService.getEscrowDetails(escrowId);
    }
    async releaseEscrow(escrowId) {
        return this.adminService.releaseEscrow(escrowId);
    }
    async refundEscrow(escrowId) {
        return this.adminService.refundEscrow(escrowId);
    }
    async getAllDisputes(status, search, page = 1, limit = 10) {
        return this.adminService.getAllDisputes(status, search, page, limit);
    }
    async getDisputeDetails(disputeId) {
        return this.adminService.getDisputeDetails(disputeId);
    }
    async resolveDispute(disputeId, data) {
        return this.adminService.resolveDispute(disputeId, data.resolution, data.notes, data.buyerAmount, data.sellerAmount);
    }
    async getChargebackBufferDetails() {
        return this.adminService.getChargebackBufferDetails();
    }
    async getChargebackBufferEvents(page = 1, limit = 10) {
        return this.adminService.getChargebackBufferEvents(page, limit);
    }
    async allocateToChargebackBuffer(data) {
        return this.adminService.allocateToChargebackBuffer(data.amount);
    }
    async getSystemLogs(type, level, search, startDate, endDate, page = 1, limit = 10) {
        return this.adminService.getSystemLogs(type, level, search, startDate, endDate, page, limit);
    }
    async getAnalytics(timeframe) {
        return this.adminService.getAnalytics(timeframe);
    }
    async getRevenueAnalytics(timeframe) {
        return this.adminService.getRevenueAnalytics(timeframe);
    }
    async getUserAnalytics(timeframe) {
        return this.adminService.getUserAnalytics(timeframe);
    }
    async getTransactionAnalytics(timeframe) {
        return this.adminService.getTransactionAnalytics(timeframe);
    }
    async getTopCreators(limit = 5) {
        return this.adminService.getTopCreators(limit);
    }
    async getPaymentMethodsDistribution() {
        return this.adminService.getPaymentMethodsDistribution();
    }
};
__decorate([
    (0, common_1.Get)("users"),
    (0, swagger_1.ApiOperation)({ summary: "Get all users" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "List of all users" }),
    (0, swagger_1.ApiQuery)({ name: "search", required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: "role", required: false, enum: user_entity_1.UserRole }),
    (0, swagger_1.ApiQuery)({ name: "status", required: false, enum: user_entity_1.UserStatus }),
    (0, swagger_1.ApiQuery)({ name: "page", required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: "limit", required: false, type: Number }),
    __param(0, (0, common_1.Query)("search")),
    __param(1, (0, common_1.Query)("role")),
    __param(2, (0, common_1.Query)("status")),
    __param(3, (0, common_1.Query)("page")),
    __param(4, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Get)("users/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Get user details" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "User details retrieved" }),
    (0, swagger_1.ApiParam)({ name: "id", description: "User ID" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserDetails", null);
__decorate([
    (0, common_1.Patch)("users/:id/status"),
    (0, swagger_1.ApiOperation)({ summary: "Update user status" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "User status updated" }),
    (0, swagger_1.ApiParam)({ name: "id", description: "User ID" }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: "object",
            properties: {
                status: { type: "string", enum: Object.values(user_entity_1.UserStatus) },
            },
        },
    }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserStatus", null);
__decorate([
    (0, common_1.Patch)("users/:id/role"),
    (0, swagger_1.ApiOperation)({ summary: "Update user role" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "User role updated" }),
    (0, swagger_1.ApiParam)({ name: "id", description: "User ID" }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: "object",
            properties: { role: { type: "string", enum: Object.values(user_entity_1.UserRole) } },
        },
    }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserRole", null);
__decorate([
    (0, common_1.Patch)("users/:id/flag"),
    (0, swagger_1.ApiOperation)({ summary: "Flag user account" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "User account flagged" }),
    (0, swagger_1.ApiParam)({ name: "id", description: "User ID" }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: "object",
            properties: { reason: { type: "string" }, details: { type: "string" } },
        },
    }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "flagUser", null);
__decorate([
    (0, common_1.Get)("escrows"),
    (0, swagger_1.ApiOperation)({ summary: "Get all escrows" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "List of all escrows" }),
    (0, swagger_1.ApiQuery)({ name: "status", required: false, enum: escrow_entity_1.EscrowStatus }),
    (0, swagger_1.ApiQuery)({ name: "search", required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: "page", required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: "limit", required: false, type: Number }),
    __param(0, (0, common_1.Query)("status")),
    __param(1, (0, common_1.Query)("search")),
    __param(2, (0, common_1.Query)("page")),
    __param(3, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllEscrows", null);
__decorate([
    (0, common_1.Get)("escrows/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Get escrow details" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Escrow details retrieved" }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Escrow ID" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getEscrowDetails", null);
__decorate([
    (0, common_1.Patch)("escrows/:id/release"),
    (0, swagger_1.ApiOperation)({ summary: "Release escrow funds to seller" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Escrow funds released to seller" }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Escrow ID" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "releaseEscrow", null);
__decorate([
    (0, common_1.Patch)("escrows/:id/refund"),
    (0, swagger_1.ApiOperation)({ summary: "Refund escrow funds to buyer" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Escrow funds refunded to buyer" }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Escrow ID" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "refundEscrow", null);
__decorate([
    (0, common_1.Get)("disputes"),
    (0, swagger_1.ApiOperation)({ summary: "Get all disputes" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "List of all disputes" }),
    (0, swagger_1.ApiQuery)({ name: "status", required: false, enum: dispute_entity_1.DisputeStatus }),
    (0, swagger_1.ApiQuery)({ name: "search", required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: "page", required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: "limit", required: false, type: Number }),
    __param(0, (0, common_1.Query)("status")),
    __param(1, (0, common_1.Query)("search")),
    __param(2, (0, common_1.Query)("page")),
    __param(3, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllDisputes", null);
__decorate([
    (0, common_1.Get)("disputes/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Get dispute details" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Dispute details retrieved" }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Dispute ID" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDisputeDetails", null);
__decorate([
    (0, common_1.Patch)("disputes/:id/resolve"),
    (0, swagger_1.ApiOperation)({ summary: "Resolve a dispute" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Dispute resolved" }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Dispute ID" }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: "object",
            properties: {
                resolution: { type: "string", enum: Object.values(dispute_entity_1.DisputeResolution) },
                notes: { type: "string" },
                buyerAmount: { type: "number" },
                sellerAmount: { type: "number" },
            },
        },
    }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "resolveDispute", null);
__decorate([
    (0, common_1.Get)("chargeback-buffer"),
    (0, swagger_1.ApiOperation)({ summary: "Get chargeback buffer details" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Chargeback buffer details retrieved",
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getChargebackBufferDetails", null);
__decorate([
    (0, common_1.Get)("chargeback-buffer/events"),
    (0, swagger_1.ApiOperation)({ summary: "Get chargeback buffer events" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Chargeback buffer events retrieved",
    }),
    (0, swagger_1.ApiQuery)({ name: "page", required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: "limit", required: false, type: Number }),
    __param(0, (0, common_1.Query)("page")),
    __param(1, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getChargebackBufferEvents", null);
__decorate([
    (0, common_1.Post)("chargeback-buffer/allocate"),
    (0, swagger_1.ApiOperation)({ summary: "Allocate funds to chargeback buffer" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Funds allocated to chargeback buffer",
    }),
    (0, swagger_1.ApiBody)({
        schema: { type: "object", properties: { amount: { type: "number" } } },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "allocateToChargebackBuffer", null);
__decorate([
    (0, common_1.Get)("logs"),
    (0, swagger_1.ApiOperation)({ summary: "Get system logs" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "System logs retrieved" }),
    (0, swagger_1.ApiQuery)({ name: "type", required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: "level", required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: "search", required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: "startDate", required: false, type: Date }),
    (0, swagger_1.ApiQuery)({ name: "endDate", required: false, type: Date }),
    (0, swagger_1.ApiQuery)({ name: "page", required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: "limit", required: false, type: Number }),
    __param(0, (0, common_1.Query)("type")),
    __param(1, (0, common_1.Query)("level")),
    __param(2, (0, common_1.Query)("search")),
    __param(3, (0, common_1.Query)("startDate")),
    __param(4, (0, common_1.Query)("endDate")),
    __param(5, (0, common_1.Query)("page")),
    __param(6, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Date,
        Date, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSystemLogs", null);
__decorate([
    (0, common_1.Get)("analytics"),
    (0, swagger_1.ApiOperation)({ summary: "Get all analytics data" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Analytics data retrieved" }),
    (0, swagger_1.ApiQuery)({ name: "timeframe", required: false, type: String }),
    __param(0, (0, common_1.Query)("timeframe")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)("analytics/revenue"),
    (0, swagger_1.ApiOperation)({ summary: "Get revenue analytics" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Revenue analytics retrieved" }),
    (0, swagger_1.ApiQuery)({ name: "timeframe", required: false, type: String }),
    __param(0, (0, common_1.Query)("timeframe")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRevenueAnalytics", null);
__decorate([
    (0, common_1.Get)("analytics/users"),
    (0, swagger_1.ApiOperation)({ summary: "Get user analytics" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "User analytics retrieved" }),
    (0, swagger_1.ApiQuery)({ name: "timeframe", required: false, type: String }),
    __param(0, (0, common_1.Query)("timeframe")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserAnalytics", null);
__decorate([
    (0, common_1.Get)("analytics/transactions"),
    (0, swagger_1.ApiOperation)({ summary: "Get transaction analytics" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Transaction analytics retrieved" }),
    (0, swagger_1.ApiQuery)({ name: "timeframe", required: false, type: String }),
    __param(0, (0, common_1.Query)("timeframe")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTransactionAnalytics", null);
__decorate([
    (0, common_1.Get)("analytics/top-creators"),
    (0, swagger_1.ApiOperation)({ summary: "Get top performing creators" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Top creators retrieved" }),
    (0, swagger_1.ApiQuery)({ name: "limit", required: false, type: Number }),
    __param(0, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTopCreators", null);
__decorate([
    (0, common_1.Get)("analytics/payment-methods"),
    (0, swagger_1.ApiOperation)({ summary: "Get payment methods distribution" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Payment methods distribution retrieved",
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPaymentMethodsDistribution", null);
AdminController = __decorate([
    (0, swagger_1.ApiTags)("Admin"),
    (0, common_1.Controller)("admin"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)("ADMIN"),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
exports.AdminController = AdminController;
//# sourceMappingURL=admin.controller.js.map