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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const magic_link_service_1 = require("./magic-link.service");
const user_entity_1 = require("../../entities/user.entity");
const wallet_entity_1 = require("../../entities/wallet.entity");
const magic_link_entity_1 = require("../../entities/magic-link.entity");
const config_1 = require("@nestjs/config");
let AuthService = AuthService_1 = class AuthService {
    constructor(userRepository, walletRepository, magicLinkRepository, jwtService, magicLinkService, configService) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.magicLinkRepository = magicLinkRepository;
        this.jwtService = jwtService;
        this.magicLinkService = magicLinkService;
        this.configService = configService;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async login(loginDto) {
        const { email, role } = loginDto;
        try {
            let user = await this.userRepository.findOne({ where: { email } });
            if (user) {
                await this.magicLinkService.sendMagicLink(email, user.id);
                return { message: "Magic link sent to your email" };
            }
            user = this.userRepository.create({
                email,
                status: user_entity_1.UserStatus.PENDING,
                role: role,
            });
            user = await this.userRepository.save(user);
            console.log(`New user created with ID: ${user.id}, role: ${user.role}`);
            const wallet = this.walletRepository.create({
                user,
                balance: 0,
            });
            await this.walletRepository.save(wallet);
            await this.magicLinkService.sendMagicLink(email, user.id);
            return { message: "Magic link sent to your email" };
        }
        catch (error) {
            console.error(`Error in login process for ${email}:`, error);
            throw new common_1.BadRequestException(`Failed to send magic link: ${error.message}`);
        }
    }
    async verifyMagicLink(token) {
        var _a, _b;
        const userId = await this.magicLinkService.verifyToken(token);
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ["wallet"],
        });
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        if (user.status === user_entity_1.UserStatus.PENDING) {
            user.status = user_entity_1.UserStatus.ACTIVE;
        }
        user.emailVerified = true;
        await this.userRepository.save(user);
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                emailVerified: user.emailVerified,
                wallet: {
                    id: ((_a = user.wallet) === null || _a === void 0 ? void 0 : _a.id) || "default-wallet",
                    balance: ((_b = user.wallet) === null || _b === void 0 ? void 0 : _b.balance) || 0,
                },
            },
            token: this.jwtService.sign(payload),
        };
    }
    async getProfile(userId) {
        var _a, _b;
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ["wallet"],
        });
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
            wallet: {
                id: ((_a = user.wallet) === null || _a === void 0 ? void 0 : _a.id) || "default-wallet",
                balance: ((_b = user.wallet) === null || _b === void 0 ? void 0 : _b.balance) || 0,
            },
        };
    }
    async sendMagicLink(email, userId) {
        if (!userId) {
            const user = await this.userRepository.findOne({ where: { email } });
            if (user) {
                userId = user.id;
            }
        }
        if (!userId) {
            throw new common_1.NotFoundException("User not found. Please sign up first.");
        }
        await this.magicLinkService.sendMagicLink(email, userId);
        return;
    }
    async getUserProfile(userId) {
        var _a, _b;
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ["wallet"],
        });
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            emailVerified: user.emailVerified,
            wallet: {
                id: ((_a = user.wallet) === null || _a === void 0 ? void 0 : _a.id) || "default-wallet",
                balance: ((_b = user.wallet) === null || _b === void 0 ? void 0 : _b.balance) || 0,
            },
            profileImage: user.profileImage,
            bio: user.bio,
            location: user.location,
            createdAt: user.createdAt,
        };
    }
    async refreshToken(userId) {
        var _a, _b;
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ["wallet"],
        });
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                emailVerified: user.emailVerified,
                wallet: {
                    id: ((_a = user.wallet) === null || _a === void 0 ? void 0 : _a.id) || "default-wallet",
                    balance: ((_b = user.wallet) === null || _b === void 0 ? void 0 : _b.balance) || 0,
                },
            },
            token: this.jwtService.sign(payload),
        };
    }
    async debugCheckToken(token) {
        const normalizedToken = token.toLowerCase();
        try {
            const rawResults = await this.magicLinkRepository.query(`SELECT * FROM magic_links WHERE token = $1`, [normalizedToken]);
            if (rawResults.length > 0) {
                return {
                    found: true,
                    tokenDetails: {
                        id: rawResults[0].id,
                        token: rawResults[0].token,
                        used: rawResults[0].used,
                        userId: rawResults[0].userId,
                        expiresAt: rawResults[0].expiresAt,
                        createdAt: rawResults[0].createdAt,
                    },
                    message: `Token found in database`,
                };
            }
            const magicLink = await this.magicLinkRepository.findOne({
                where: { token: normalizedToken },
            });
            if (magicLink) {
                return {
                    found: true,
                    tokenDetails: {
                        id: magicLink.id,
                        token: magicLink.token,
                        used: magicLink.used,
                        userId: magicLink.userId,
                        expiresAt: magicLink.expiresAt,
                        createdAt: magicLink.createdAt,
                    },
                    message: `Token found via repository`,
                };
            }
            const similarTokens = await this.magicLinkRepository.query(`SELECT * FROM magic_links WHERE token ILIKE $1`, [`%${normalizedToken.substring(0, 8)}%`]);
            if (similarTokens.length > 0) {
                return {
                    found: false,
                    similar: similarTokens.map((t) => ({
                        id: t.id,
                        token: t.token,
                        used: t.used,
                        userId: t.userId,
                    })),
                    message: `Token not found but ${similarTokens.length} similar tokens exist`,
                };
            }
            return {
                found: false,
                message: "Token not found in database",
            };
        }
        catch (error) {
            return {
                found: false,
                error: error.message,
                message: "Error checking token",
            };
        }
    }
    async debugGenerateTestToken(email) {
        try {
            const user = await this.userRepository.findOne({ where: { email } });
            if (!user) {
                throw new common_1.NotFoundException(`No user found with email ${email}`);
            }
            await this.magicLinkRepository.query(`DELETE FROM magic_links WHERE "userId" = $1`, [user.id]);
            const testToken = "debug-token-" + Math.floor(Math.random() * 10000);
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 1);
            await this.magicLinkRepository.query(`INSERT INTO magic_links (token, "expiresAt", used, "userId", "createdAt") 
         VALUES ($1, $2, $3, $4, $5)`, [testToken, expiresAt, false, user.id, new Date()]);
            const verifyQuery = await this.magicLinkRepository.query(`SELECT * FROM magic_links WHERE token = $1`, [testToken]);
            if (verifyQuery.length === 0) {
                throw new Error("Failed to save test token - not found after creation");
            }
            if (verifyQuery[0].used === true) {
                throw new Error("Critical error: Token marked as used immediately after creation");
            }
            const frontendUrl = this.configService.get("FRONTEND_URL");
            const verifyUrl = `${frontendUrl}/auth/verify?token=${testToken}`;
            return {
                success: true,
                message: "Test token generated successfully",
                token: testToken,
                verifyUrl,
                tokenDetails: verifyQuery[0],
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                },
            };
        }
        catch (error) {
            return {
                success: false,
                message: "Failed to generate test token",
                error: error.message,
            };
        }
    }
    async cleanMagicLinks(userId) {
        try {
            await this.magicLinkRepository.query(`DELETE FROM magic_links 
         WHERE ("userId" = $1 AND used = true) OR 
               ("userId" = $1 AND "expiresAt" < $2)`, [userId, new Date()]);
        }
        catch (error) {
            this.logger.error(`Failed to clean up magic links: ${error.message}`);
        }
    }
    async directLogin(email) {
        try {
            const userResults = await this.magicLinkRepository.query(`SELECT * FROM users WHERE email = $1`, [email]);
            if (userResults.length === 0) {
                throw new common_1.NotFoundException(`No user found with email ${email}`);
            }
            const user = userResults[0];
            await this.magicLinkRepository.query(`DELETE FROM magic_links WHERE "userId" = $1`, [user.id]);
            const testToken = `direct-login-${Date.now()}`;
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 1);
            await this.magicLinkRepository.query(`INSERT INTO magic_links (id, token, "expiresAt", used, "userId", "createdAt") 
         VALUES (uuid_generate_v4(), $1, $2, false, $3, now())`, [testToken, expiresAt, user.id]);
            const verifyResult = await this.magicLinkRepository.query(`SELECT * FROM magic_links WHERE token = $1`, [testToken]);
            if (verifyResult.length === 0 || verifyResult[0].used === true) {
                throw new Error("Failed to create usable token - check for triggers or hooks in the database");
            }
            const frontendUrl = this.configService.get("FRONTEND_URL");
            const verifyUrl = `${frontendUrl}/auth/verify?token=${testToken}`;
            return {
                success: true,
                message: "Direct login link created successfully",
                token: testToken,
                verifyUrl,
                tokenDetails: verifyResult[0],
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                },
            };
        }
        catch (error) {
            this.logger.error(`Direct login error: ${error.message}`);
            return {
                success: false,
                message: "Failed to create direct login link",
                error: error.message,
            };
        }
    }
    async cleanupExpiredTokens() {
        try {
            const expiredResult = await this.magicLinkRepository.query(`
        UPDATE magic_links 
        SET used = true 
        WHERE "expiresAt" < NOW() AND used = false
        RETURNING COUNT(*)
      `);
            const count = expiredResult.length > 0 ? expiredResult[0].count : 0;
            this.logger.log(`Marked ${count} expired tokens as used`);
        }
        catch (error) {
            this.logger.error(`Error cleaning up expired tokens: ${error.message}`);
        }
    }
    async completeLoginWithUserId(userId) {
        var _a, _b;
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ["wallet"],
        });
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        if (user.status === user_entity_1.UserStatus.PENDING) {
            user.status = user_entity_1.UserStatus.ACTIVE;
        }
        user.emailVerified = true;
        await this.userRepository.save(user);
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                emailVerified: user.emailVerified,
                wallet: {
                    id: ((_a = user.wallet) === null || _a === void 0 ? void 0 : _a.id) || "default-wallet",
                    balance: ((_b = user.wallet) === null || _b === void 0 ? void 0 : _b.balance) || 0,
                },
            },
            token: this.jwtService.sign(payload),
        };
    }
    async debugResetTokensForEmail(email) {
        try {
            this.logger.log(`Attempting to reset tokens for email: ${email}`);
            const user = await this.userRepository.findOne({ where: { email } });
            if (!user) {
                this.logger.warn(`No user found with email: ${email}`);
                return {
                    success: false,
                    message: `No user found with email: ${email}`,
                };
            }
            const tokensBeforeQuery = await this.magicLinkRepository.query(`SELECT * FROM magic_links WHERE "userId" = $1`, [user.id]);
            const tokensBefore = tokensBeforeQuery.length;
            const resetResult = await this.magicLinkRepository.query(`UPDATE magic_links SET used = false WHERE "userId" = $1 RETURNING *`, [user.id]);
            this.logger.log(`Reset ${resetResult.length} tokens for user ID ${user.id} (email: ${email})`);
            const activeTokensQuery = await this.magicLinkRepository.query(`SELECT token, "expiresAt", used, "createdAt" FROM magic_links 
         WHERE "userId" = $1 ORDER BY "createdAt" DESC`, [user.id]);
            return {
                success: true,
                message: `Reset ${resetResult.length} tokens for user with email: ${email} (user ID: ${user.id})`,
                tokensBefore,
                tokensReset: resetResult.length,
                activeTokens: activeTokensQuery.map((token) => ({
                    token: token.token.substring(0, 12) + "...",
                    expiresAt: token.expiresAt,
                    used: token.used,
                    createdAt: token.createdAt,
                })),
            };
        }
        catch (error) {
            this.logger.error(`Error resetting tokens: ${error.message}`);
            return {
                success: false,
                message: `Failed to reset tokens: ${error.message}`,
            };
        }
    }
    async debugResetTokenUsageForUser(userId) {
        if (!userId) {
            throw new common_1.BadRequestException("User ID is required");
        }
        this.logger.log(`Resetting token usage status for user ID: ${userId}`);
        try {
            const userTokens = await this.magicLinkRepository.query(`SELECT id, token, used, "createdAt", "expiresAt"
         FROM magic_links
         WHERE "userId" = $1`, [userId]);
            this.logger.log(`Found ${userTokens.length} tokens for user`);
            if (userTokens.length > 0) {
                const resetResult = await this.magicLinkRepository.query(`UPDATE magic_links
           SET used = false
           WHERE "userId" = $1
           RETURNING id, token, used`, [userId]);
                this.logger.log(`Reset ${resetResult.length} tokens to unused state`);
                return {
                    success: true,
                    message: `Reset ${resetResult.length} tokens for user ID ${userId}`,
                    tokens: resetResult.map((t) => ({
                        id: t.id,
                        token: `${t.token.substring(0, 8)}...`,
                        used: t.used,
                    })),
                };
            }
            return {
                success: false,
                message: `No tokens found for user ID ${userId}`,
            };
        }
        catch (error) {
            this.logger.error(`Error resetting token usage: ${error.message}`);
            return {
                success: false,
                message: `Failed to reset tokens: ${error.message}`,
            };
        }
    }
    async checkUserExists(email) {
        try {
            this.logger.log(`Checking if user exists: ${email}`);
            const user = await this.userRepository.findOne({ where: { email } });
            if (user) {
                this.logger.log(`User found: ${email}, role: ${user.role}`);
                return {
                    exists: true,
                    role: user.role,
                    id: user.id,
                };
            }
            this.logger.log(`User not found: ${email}`);
            return {
                exists: false,
                role: null,
                id: null,
            };
        }
        catch (error) {
            this.logger.error(`Error checking user existence: ${error.message}`);
            throw new common_1.BadRequestException(`Failed to check user: ${error.message}`);
        }
    }
};
AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(wallet_entity_1.Wallet)),
    __param(2, (0, typeorm_1.InjectRepository)(magic_link_entity_1.MagicLink)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        magic_link_service_1.MagicLinkService,
        config_1.ConfigService])
], AuthService);
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map