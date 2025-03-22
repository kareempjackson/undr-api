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
    async createMagicLink(email, userId) {
        let user;
        if (userId) {
            user = await this.userRepository.findOne({ where: { id: userId } });
        }
        else {
            user = await this.userRepository.findOne({ where: { email } });
        }
        if (!user) {
            throw new Error("User not found - should be created before calling this method");
        }
        const token = (0, uuid_1.v4)();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
        const magicLink = this.magicLinkRepository.create({
            token,
            expiresAt,
            user,
            userId: user.id,
        });
        await this.magicLinkRepository.save(magicLink);
        return token;
    }
    async sendMagicLink(email, userId) {
        const token = await this.createMagicLink(email, userId);
        const frontendUrl = this.configService.get("FRONTEND_URL");
        const magicLinkUrl = `${frontendUrl}/auth/verify?token=${token}`;
        this.logger.log(`Generated magic link for ${email} with token: ${token}`);
        const msg = {
            to: email,
            from: this.configService.get("SMTP_FROM") || "no-reply@ghostpay.com",
            subject: "Your GhostPay Magic Link",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to GhostPay</h2>
          <p>Click the button below to sign in to your account. This link will expire in 15 minutes.</p>
          <a href="${magicLinkUrl}" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 16px 0;">Sign In</a>
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p>${magicLinkUrl}</p>
          <p>For security reasons, this link will expire in 15 minutes and can only be used once.</p>
          <p>If you didn't request this link, you can safely ignore this email.</p>
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
        const magicLink = await this.magicLinkRepository.findOne({
            where: { token },
            relations: ["user"],
        });
        if (!magicLink) {
            throw new common_1.UnauthorizedException("Invalid or expired magic link");
        }
        if (new Date() > magicLink.expiresAt) {
            throw new common_1.UnauthorizedException("Magic link has expired");
        }
        if (magicLink.used) {
            throw new common_1.UnauthorizedException("Magic link has already been used");
        }
        magicLink.used = true;
        await this.magicLinkRepository.save(magicLink);
        return magicLink.userId;
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