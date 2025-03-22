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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async login(loginDto) {
        await this.authService.sendMagicLink(loginDto.email);
        return { message: "Magic link sent to your email" };
    }
    async verifyMagicLink(verifyDto) {
        return this.authService.verifyMagicLink(verifyDto.token);
    }
    async getProfile(req) {
        var _a;
        console.log("Auth/me endpoint called with user ID:", req.user.id);
        try {
            const userProfile = await this.authService.getUserProfile(req.user.id);
            console.log("User profile retrieved:", {
                id: userProfile.id,
                email: userProfile.email,
                wallet: userProfile.wallet,
                hasWalletProperty: !!userProfile.wallet,
                walletBalance: (_a = userProfile.wallet) === null || _a === void 0 ? void 0 : _a.balance,
            });
            return userProfile;
        }
        catch (error) {
            console.error("Error retrieving user profile:", error.message);
            throw error;
        }
    }
};
__decorate([
    (0, common_1.Post)("login"),
    (0, swagger_1.ApiOperation)({ summary: "Request a magic link login" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Magic link sent" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)("verify"),
    (0, swagger_1.ApiOperation)({ summary: "Verify a magic link token" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Token verified successfully" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.VerifyMagicLinkDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyMagicLink", null);
__decorate([
    (0, common_1.Get)("me"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: "Get current user information" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "User information retrieved" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
AuthController = __decorate([
    (0, swagger_1.ApiTags)("Auth"),
    (0, common_1.Controller)("auth"),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map