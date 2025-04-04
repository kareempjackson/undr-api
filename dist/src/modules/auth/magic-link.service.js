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
var MagicLinkService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MagicLinkService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const uuid_1 = require("uuid");
const sendgrid = require("@sendgrid/mail");
const user_entity_1 = require("../../entities/user.entity");
const magic_link_entity_1 = require("../../entities/magic-link.entity");
let MagicLinkService = MagicLinkService_1 = class MagicLinkService {
    constructor(configService, userRepository, magicLinkRepository) {
        this.configService = configService;
        this.userRepository = userRepository;
        this.magicLinkRepository = magicLinkRepository;
        this.logger = new common_1.Logger(MagicLinkService_1.name);
        const apiKey = this.configService.get("SENDGRID_API_KEY");
        if (apiKey) {
            try {
                sendgrid.setApiKey(apiKey);
            }
            catch (error) {
                this.logger.warn(`Failed to initialize SendGrid: ${error.message}`);
            }
        }
        this.devModeSkipEmail =
            this.configService.get("DEV_MODE_SKIP_EMAIL") === "true";
        if (this.devModeSkipEmail) {
            this.logger.warn("Running in development mode - emails will be logged to console instead of sent");
        }
    }
    async createMagicLink(email, userId, timestamp) {
        const tokenBase = timestamp ? `${(0, uuid_1.v4)()}-${timestamp}` : (0, uuid_1.v4)();
        const token = tokenBase.toLowerCase();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 30);
        try {
            await this.magicLinkRepository.query(`INSERT INTO magic_links (token, "expiresAt", used, "userId", "createdAt") 
         VALUES ($1, $2, $3, $4, $5)`, [token, expiresAt, false, userId, new Date()]);
            this.logger.log(`Successfully created magic link with token: ${token} for user ID: ${userId}`);
            const verifyQuery = await this.magicLinkRepository.query(`SELECT * FROM magic_links WHERE token = $1`, [token]);
            if (verifyQuery.length > 0) {
                const isUsed = verifyQuery[0].used;
                this.logger.log(`Token created verification: token=${token}, used=${isUsed}`);
                if (isUsed) {
                    this.logger.error(`CRITICAL ERROR: Token was created but immediately marked as used: ${token}`);
                }
            }
            else {
                this.logger.error(`CRITICAL ERROR: Token was not found after creation: ${token}`);
            }
            return token;
        }
        catch (error) {
            this.logger.error(`Error creating magic link: ${error.message}`);
            throw error;
        }
    }
    async sendMagicLink(email, userId) {
        if (!email) {
            throw new Error("Email is required to send a magic link");
        }
        if (!userId) {
            const user = await this.userRepository.findOne({ where: { email } });
            if (!user) {
                throw new Error(`No user found with email ${email}`);
            }
            userId = user.id;
        }
        try {
            const deleteQuery = `DELETE FROM magic_links WHERE "userId" = $1`;
            const deleteParams = [userId];
            const deleteResult = await this.magicLinkRepository.query(deleteQuery, deleteParams);
            this.logger.log(`Deleted ${deleteResult.length || 0} existing tokens for user ${userId}`);
        }
        catch (error) {
            this.logger.error(`Error deleting existing tokens: ${error.message}`);
        }
        const timestamp = Date.now();
        const token = await this.createMagicLink(email, userId, timestamp);
        const frontendUrl = this.configService.get("FRONTEND_URL");
        const magicLinkUrl = `${frontendUrl}/auth/verify?token=${token}`;
        this.logger.log(`Generated magic link for ${email} with token: ${token} (user ID: ${userId})`);
        const msg = {
            to: email,
            from: "kareem@ghostsavvy.com",
            subject: "Your Undr Magic Link",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Undr</h2>
          <p>Click the button below to sign in to your account. This link will expire in 30 minutes.</p>
          <a href="${magicLinkUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Sign In</a>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p>${magicLinkUrl}</p>
          <p><strong>Important:</strong> This link is for single use only and will expire after 30 minutes.</p>
          <p>If you don't use this link and need to sign in later, you'll need to request a new link.</p>
          <p>If you didn't request this link, you can safely ignore this email.</p>
          <p>Thank you for using Undr!</p>
        </div>
      `,
        };
        if (this.devModeSkipEmail) {
            this.logger.log("----------------------------------------");
            this.logger.log("DEVELOPMENT MODE - NOT SENDING REAL EMAIL");
            this.logger.log(`Magic Link for ${email}:`);
            this.logger.log(magicLinkUrl);
            this.logger.log("----------------------------------------");
            return;
        }
        try {
            await sendgrid.send(msg);
        }
        catch (error) {
            this.logger.error("SendGrid error:", error);
            if (error.response) {
                this.logger.error("SendGrid error response:", error.response.body);
            }
            if (!this.devModeSkipEmail) {
                throw new Error(`Failed to send magic link email: ${error.message}`);
            }
            else {
                this.logger.warn(`Email would have failed, but we're in dev mode: ${error.message}`);
            }
        }
    }
    async verifyToken(token) {
        if (!token) {
            throw new common_1.UnauthorizedException("Token is required for verification");
        }
        const normalizedToken = token.toLowerCase();
        this.logger.log(`Verifying token: ${normalizedToken}`);
        const queryRunner = this.magicLinkRepository.manager.connection.createQueryRunner();
        try {
            await queryRunner.connect();
            await queryRunner.startTransaction();
            const tokenExists = await queryRunner.manager.query(`SELECT id, token, "expiresAt", used, "userId", "createdAt" 
         FROM magic_links 
         WHERE token = $1`, [normalizedToken]);
            this.logger.log(`Token existence check returned ${tokenExists.length} results`);
            if (tokenExists.length === 0) {
                throw new common_1.UnauthorizedException("Invalid or expired token");
            }
            const foundToken = tokenExists[0];
            this.logger.log(`Token details - ID: ${foundToken.id}, created: ${foundToken.createdAt}, used: ${foundToken.used}`);
            if (foundToken.used) {
                this.logger.warn(`Token found but already used: ${normalizedToken}`);
                await queryRunner.rollbackTransaction();
                throw new common_1.UnauthorizedException("This magic link has already been used. Please request a new one.");
            }
            const expirationDate = new Date(foundToken.expiresAt);
            if (expirationDate < new Date()) {
                this.logger.warn(`Token is expired: ${normalizedToken}`);
                await queryRunner.rollbackTransaction();
                throw new common_1.UnauthorizedException("This magic link has expired. Please request a new one.");
            }
            await queryRunner.manager.query(`UPDATE magic_links SET used = true WHERE id = $1`, [foundToken.id]);
            await queryRunner.commitTransaction();
            return foundToken.userId;
        }
        catch (error) {
            if (queryRunner.isTransactionActive) {
                try {
                    await queryRunner.rollbackTransaction();
                }
                catch (rollbackError) {
                    this.logger.error(`Error rolling back transaction: ${rollbackError.message}`);
                }
            }
            this.logger.error(`Error verifying token: ${error.message}`);
            if (error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            throw new common_1.UnauthorizedException("Failed to verify magic link. Please try again.");
        }
        finally {
            if (!queryRunner.isReleased) {
                await queryRunner.release();
            }
        }
    }
};
MagicLinkService = MagicLinkService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(magic_link_entity_1.MagicLink)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], MagicLinkService);
exports.MagicLinkService = MagicLinkService;
//# sourceMappingURL=magic-link.service.js.map