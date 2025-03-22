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
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getAllUsers() {
        return this.adminService.getAllUsers();
    }
    async getAllTransactions() {
        return this.adminService.getAllTransactions();
    }
    async updateUserStatus(userId, data) {
        return this.adminService.updateUserStatus(userId, data.status);
    }
    async updateUserRole(userId, data) {
        return this.adminService.updateUserRole(userId, data.role);
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
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Get)("transactions"),
    (0, swagger_1.ApiOperation)({ summary: "Get all transactions" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "List of all transactions" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllTransactions", null);
__decorate([
    (0, common_1.Patch)("users/:id/status"),
    (0, swagger_1.ApiOperation)({ summary: "Update user status" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "User status updated" }),
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
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserRole", null);
__decorate([
    (0, common_1.Get)("analytics"),
    (0, swagger_1.ApiOperation)({ summary: "Get all analytics data" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Analytics data retrieved" }),
    __param(0, (0, common_1.Query)("timeframe")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Get)("analytics/revenue"),
    (0, swagger_1.ApiOperation)({ summary: "Get revenue analytics" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Revenue analytics retrieved" }),
    __param(0, (0, common_1.Query)("timeframe")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRevenueAnalytics", null);
__decorate([
    (0, common_1.Get)("analytics/users"),
    (0, swagger_1.ApiOperation)({ summary: "Get user analytics" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "User analytics retrieved" }),
    __param(0, (0, common_1.Query)("timeframe")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserAnalytics", null);
__decorate([
    (0, common_1.Get)("analytics/transactions"),
    (0, swagger_1.ApiOperation)({ summary: "Get transaction analytics" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Transaction analytics retrieved" }),
    __param(0, (0, common_1.Query)("timeframe")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTransactionAnalytics", null);
__decorate([
    (0, common_1.Get)("analytics/top-creators"),
    (0, swagger_1.ApiOperation)({ summary: "Get top performing creators" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Top creators retrieved" }),
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