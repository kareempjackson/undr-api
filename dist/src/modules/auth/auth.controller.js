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
var AuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("./guards/jwt-auth.guard");
const public_decorator_1 = require("./decorators/public.decorator");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const magic_link_entity_1 = require("../../entities/magic-link.entity");
let AuthController = AuthController_1 = class AuthController {
    constructor(authService, magicLinkRepository) {
        this.authService = authService;
        this.magicLinkRepository = magicLinkRepository;
        this.logger = new common_1.Logger(AuthController_1.name);
        this.verificationAttempts = new Map();
        this.DEBOUNCE_TIME = 2000;
    }
    async login(loginDto) {
        return this.authService.login(loginDto);
    }
    async verifyMagicLink(verifyMagicLinkDto) {
        try {
            const { token } = verifyMagicLinkDto;
            if (!token) {
                this.logger.warn("Token is missing in request");
                throw new common_1.BadRequestException("Token is required for verification");
            }
            const normalizedToken = token.toLowerCase();
            const lastAttempt = this.verificationAttempts.get(normalizedToken);
            const now = Date.now();
            if (lastAttempt && now - lastAttempt < this.DEBOUNCE_TIME) {
                this.logger.warn(`Debounced verification request for token: ${normalizedToken.slice(0, 8)}...`);
                throw new common_1.BadRequestException("Please wait a moment before trying again.");
            }
            this.verificationAttempts.set(normalizedToken, now);
            if (this.verificationAttempts.size > 100) {
                const cutoff = now - this.DEBOUNCE_TIME * 5;
                for (const [key, timestamp] of this.verificationAttempts.entries()) {
                    if (timestamp < cutoff) {
                        this.verificationAttempts.delete(key);
                    }
                }
            }
            const tokenPreview = normalizedToken.slice(0, 8);
            this.logger.log(`Received verification request for token: ${tokenPreview}...`);
            if (normalizedToken.length < 10) {
                this.logger.warn(`Invalid token format: ${tokenPreview}...`);
                throw new common_1.BadRequestException("Invalid token format");
            }
            try {
                const result = await this.authService.verifyMagicLink(normalizedToken);
                this.logger.log(`Verification successful for token: ${tokenPreview}...`);
                this.verificationAttempts.delete(normalizedToken);
                return result;
            }
            catch (error) {
                this.logger.error(`Error during verification process: ${error.message}`);
                throw error;
            }
        }
        catch (error) {
            this.logger.error(`Verification error: ${error.message}`);
            if (error instanceof common_1.BadRequestException ||
                error instanceof common_1.UnauthorizedException ||
                error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.UnauthorizedException("Failed to verify magic link. Please try again or request a new one.");
        }
    }
    async getCurrentUser(req) {
        return this.authService.getProfile(req.user.sub || req.user.id);
    }
    async getProfile(req) {
        return this.authService.getProfile(req.user.id);
    }
    async refreshToken(req) {
        return this.authService.refreshToken(req.user.id);
    }
    async checkToken(token) {
        return this.authService.debugCheckToken(token);
    }
    async generateTestToken(email) {
        if (!email) {
            throw new common_1.BadRequestException("Email is required");
        }
        return this.authService.debugGenerateTestToken(email);
    }
    async directLogin(email) {
        if (!email) {
            throw new common_1.BadRequestException("Email is required");
        }
        return this.authService.directLogin(email);
    }
    async cleanupTokens() {
        try {
            await this.authService.cleanupExpiredTokens();
            const result = await this.magicLinkRepository.query(`DELETE FROM magic_links WHERE used = true`);
            const tokenStats = await this.magicLinkRepository.query(`
        SELECT 
          COUNT(*) as total_tokens,
          SUM(CASE WHEN used = true THEN 1 ELSE 0 END) as used_tokens,
          SUM(CASE WHEN used = false THEN 1 ELSE 0 END) as unused_tokens,
          SUM(CASE WHEN "expiresAt" < NOW() THEN 1 ELSE 0 END) as expired_tokens
        FROM magic_links
      `);
            return {
                message: "Token cleanup completed",
                tokensDeleted: result.affectedRows || 0,
                currentStats: tokenStats[0],
            };
        }
        catch (error) {
            this.logger.error(`Error cleaning tokens: ${error.message}`);
            return {
                error: true,
                message: `Failed to clean tokens: ${error.message}`,
            };
        }
    }
    async resetAllTokens() {
        try {
            const deleteResult = await this.magicLinkRepository.query(`DELETE FROM magic_links`);
            this.logger.log(`Deleted all tokens from database`);
            return {
                message: "All tokens have been deleted from the database",
                success: true,
            };
        }
        catch (error) {
            this.logger.error(`Error resetting tokens: ${error.message}`);
            return {
                error: true,
                message: `Failed to reset tokens: ${error.message}`,
            };
        }
    }
    async resetTokensForEmail(email) {
        if (!email) {
            throw new common_1.BadRequestException("Email is required");
        }
        this.logger.log(`Processing request to reset tokens for email: ${email}`);
        return this.authService.debugResetTokensForEmail(email);
    }
    async resetTokenUsageForUser(userId) {
        if (!userId) {
            throw new common_1.BadRequestException("User ID is required");
        }
        this.logger.log(`Processing request to reset token usage for user ID: ${userId}`);
        return this.authService.debugResetTokenUsageForUser(userId);
    }
    async checkUser(checkUserDto) {
        return this.authService.checkUserExists(checkUserDto.email);
    }
};
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)("login"),
    (0, swagger_1.ApiOperation)({ summary: "Login or register with email" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Magic link sent" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)("verify"),
    (0, swagger_1.ApiOperation)({ summary: "Verify magic link token" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "User logged in successfully" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.VerifyMagicLinkDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyMagicLink", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)("me"),
    (0, swagger_1.ApiOperation)({ summary: "Get current user data" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Current user data retrieved" }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getCurrentUser", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)("profile"),
    (0, swagger_1.ApiOperation)({ summary: "Get user profile" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "User profile retrieved" }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)("refresh-token"),
    (0, swagger_1.ApiOperation)({ summary: "Refresh JWT token" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Token refreshed" }),
    (0, swagger_1.ApiBearerAuth)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)("debug/check-token/:token"),
    (0, swagger_1.ApiOperation)({ summary: "[DEBUG] Check if a token exists" }),
    __param(0, (0, common_1.Param)("token")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "checkToken", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)("debug/generate-test-token"),
    (0, swagger_1.ApiOperation)({ summary: "[DEBUG] Generate a test token" }),
    __param(0, (0, common_1.Query)("email")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "generateTestToken", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)("debug/direct-login"),
    (0, swagger_1.ApiOperation)({ summary: "[DEBUG] Direct login that bypasses TypeORM" }),
    __param(0, (0, common_1.Query)("email")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "directLogin", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)("debug/cleanup-tokens"),
    (0, swagger_1.ApiOperation)({ summary: "[DEBUG] Clean up tokens in database" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "cleanupTokens", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)("debug/reset-all-tokens"),
    (0, swagger_1.ApiOperation)({ summary: "[DEBUG] Reset all tokens in database" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetAllTokens", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)("debug/reset-tokens-for-email"),
    (0, swagger_1.ApiOperation)({ summary: "[DEBUG] Reset all tokens for a specific email" }),
    __param(0, (0, common_1.Query)("email")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetTokensForEmail", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)("debug/reset-token-usage-for-user"),
    (0, swagger_1.ApiOperation)({
        summary: "[DEBUG] Reset token usage status for a specific user",
    }),
    __param(0, (0, common_1.Query)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetTokenUsageForUser", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)("check-user"),
    (0, swagger_1.ApiOperation)({ summary: "Check if a user exists and get their role" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "User existence information" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CheckUserDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "checkUser", null);
AuthController = AuthController_1 = __decorate([
    (0, swagger_1.ApiTags)("Authentication"),
    (0, common_1.Controller)("auth"),
    __param(1, (0, typeorm_1.InjectRepository)(magic_link_entity_1.MagicLink)),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        typeorm_2.Repository])
], AuthController);
exports.AuthController = AuthController;
//# sourceMappingURL=auth.controller.js.map