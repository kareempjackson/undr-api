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
exports.CreatorsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const creators_service_1 = require("./creators.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const privacy_critical_decorator_1 = require("../common/decorators/privacy-critical.decorator");
const public_decorator_1 = require("../auth/decorators/public.decorator");
let CreatorsController = class CreatorsController {
    constructor(creatorsService) {
        this.creatorsService = creatorsService;
    }
    async getDashboard(req) {
        return this.creatorsService.getDashboard(req.user.sub);
    }
    async getEarnings(req) {
        return this.creatorsService.getEarnings(req.user.sub);
    }
    async getPaymentLink(req) {
        return this.creatorsService.getPaymentLink(req.user.sub);
    }
    async getPaymentLinkByAlias(alias) {
        return this.creatorsService.getPaymentLinkByAlias(alias);
    }
    async testGetPaymentLinkByAlias(alias) {
        return this.creatorsService.getPaymentLinkByAlias(alias);
    }
};
__decorate([
    (0, common_1.Get)("dashboard"),
    (0, roles_decorator_1.Roles)("CREATOR"),
    (0, swagger_1.ApiOperation)({ summary: "Get creator dashboard data" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Dashboard data retrieved successfully",
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CreatorsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)("earnings"),
    (0, roles_decorator_1.Roles)("CREATOR"),
    (0, swagger_1.ApiOperation)({ summary: "Get creator earnings data" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Earnings data retrieved successfully",
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CreatorsController.prototype, "getEarnings", null);
__decorate([
    (0, common_1.Get)("payment-link"),
    (0, roles_decorator_1.Roles)("CREATOR"),
    (0, swagger_1.ApiOperation)({ summary: "Get creator payment link" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Payment link retrieved successfully",
    }),
    (0, privacy_critical_decorator_1.PrivacyCritical)({
        regionOnly: true,
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CreatorsController.prototype, "getPaymentLink", null);
__decorate([
    (0, common_1.Get)(":alias/payment-link"),
    (0, swagger_1.ApiOperation)({ summary: "Get creator payment link by alias" }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: "Payment link retrieved successfully",
    }),
    __param(0, (0, common_1.Param)("alias")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CreatorsController.prototype, "getPaymentLinkByAlias", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)("test-payment-link/:alias"),
    __param(0, (0, common_1.Param)("alias")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CreatorsController.prototype, "testGetPaymentLinkByAlias", null);
CreatorsController = __decorate([
    (0, swagger_1.ApiTags)("Creators"),
    (0, common_1.Controller)("creators"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [creators_service_1.CreatorsService])
], CreatorsController);
exports.CreatorsController = CreatorsController;
//# sourceMappingURL=creators.controller.js.map