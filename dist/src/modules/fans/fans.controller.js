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
exports.FansController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const fans_service_1 = require("./fans.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const dto_1 = require("./dto");
const privacy_critical_decorator_1 = require("../common/decorators/privacy-critical.decorator");
let FansController = class FansController {
    constructor(fansService) {
        this.fansService = fansService;
    }
    async deposit(req, depositDto) {
        return this.fansService.deposit(req.user.sub, depositDto);
    }
    async getDepositStatus(req, depositId) {
        return this.fansService.getDepositStatus(req.user.sub, depositId);
    }
    async completeDeposit(req, completeDepositDto) {
        return this.fansService.completeDeposit(req.user.sub, completeDepositDto);
    }
    async payCreator(req, payDto) {
        return this.fansService.payCreator(req.user.sub, payDto);
    }
    async payByAlias(req, alias, payDto) {
        payDto.toAlias = alias;
        return this.fansService.payByAlias(req.user.sub, payDto);
    }
    async getTransactionHistory(req) {
        return this.fansService.getTransactionHistory(req.user.sub);
    }
};
__decorate([
    (0, common_1.Post)("deposit"),
    (0, roles_decorator_1.Roles)("FAN", "CREATOR"),
    (0, swagger_1.ApiOperation)({ summary: "Deposit funds into wallet" }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Deposit initiated successfully" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.DepositDto]),
    __metadata("design:returntype", Promise)
], FansController.prototype, "deposit", null);
__decorate([
    (0, common_1.Get)("deposit-status/:depositId"),
    (0, roles_decorator_1.Roles)("FAN", "CREATOR"),
    (0, swagger_1.ApiOperation)({ summary: "Check status of a deposit" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Deposit status retrieved" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("depositId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FansController.prototype, "getDepositStatus", null);
__decorate([
    (0, common_1.Post)("complete-deposit"),
    (0, roles_decorator_1.Roles)("FAN", "CREATOR"),
    (0, swagger_1.ApiOperation)({ summary: "Manually complete a deposit (fallback method)" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Deposit completed successfully" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CompleteDepositDto]),
    __metadata("design:returntype", Promise)
], FansController.prototype, "completeDeposit", null);
__decorate([
    (0, common_1.Post)("pay"),
    (0, roles_decorator_1.Roles)("FAN", "CREATOR"),
    (0, swagger_1.ApiOperation)({ summary: "Pay a creator" }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Payment processed successfully" }),
    (0, privacy_critical_decorator_1.PrivacyCritical)({
        regionOnly: true,
        detectProxy: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.PayCreatorDto]),
    __metadata("design:returntype", Promise)
], FansController.prototype, "payCreator", null);
__decorate([
    (0, common_1.Post)("pay/:alias"),
    (0, roles_decorator_1.Roles)("FAN", "CREATOR"),
    (0, swagger_1.ApiOperation)({ summary: "Pay a creator using their alias" }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Payment processed successfully" }),
    (0, privacy_critical_decorator_1.PrivacyCritical)({
        storeNoIpData: true,
        detectProxy: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("alias")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.PayByAliasDto]),
    __metadata("design:returntype", Promise)
], FansController.prototype, "payByAlias", null);
__decorate([
    (0, common_1.Get)("history"),
    (0, roles_decorator_1.Roles)("FAN", "CREATOR"),
    (0, swagger_1.ApiOperation)({ summary: "Get transaction history" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Transaction history retrieved" }),
    (0, privacy_critical_decorator_1.PrivacyCritical)({
        regionOnly: true,
    }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FansController.prototype, "getTransactionHistory", null);
FansController = __decorate([
    (0, swagger_1.ApiTags)("Fans"),
    (0, common_1.Controller)("fans"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [fans_service_1.FansService])
], FansController);
exports.FansController = FansController;
//# sourceMappingURL=fans.controller.js.map