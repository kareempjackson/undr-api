import { Injectable, UnauthorizedException, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import * as sendgrid from "@sendgrid/mail";
import { User, UserStatus } from "../../entities/user.entity";
import { MagicLink } from "../../entities/magic-link.entity";

@Injectable()
export class MagicLinkService {
  private readonly logger = new Logger(MagicLinkService.name);
  private readonly devModeSkipEmail: boolean;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(MagicLink)
    private magicLinkRepository: Repository<MagicLink>
  ) {
    // Initialize SendGrid if not in development mode
    const apiKey = this.configService.get<string>("SENDGRID_API_KEY");
    if (apiKey) {
      try {
        sendgrid.setApiKey(apiKey);
      } catch (error) {
        this.logger.warn(`Failed to initialize SendGrid: ${error.message}`);
      }
    }

    // Check if we're in development mode
    this.devModeSkipEmail =
      this.configService.get<string>("DEV_MODE_SKIP_EMAIL") === "true";
    if (this.devModeSkipEmail) {
      this.logger.warn(
        "Running in development mode - emails will be logged to console instead of sent"
      );
    }
  }

  async createMagicLink(email: string): Promise<string> {
    // Find user by email
    const user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // User will be created in AuthService
      throw new Error(
        "User not found - should be created before calling this method"
      );
    }

    // Generate a token
    const token = uuidv4();

    // Set expiration to 15 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // Create a magic link record
    const magicLink = this.magicLinkRepository.create({
      token,
      expiresAt,
      user,
      userId: user.id,
    });

    await this.magicLinkRepository.save(magicLink);

    return token;
  }

  async sendMagicLink(email: string): Promise<void> {
    const token = await this.createMagicLink(email);

    // Create the magic link URL - make sure to use FRONTEND_URL which should be port 3000
    const frontendUrl = this.configService.get("FRONTEND_URL");
    const magicLinkUrl = `${frontendUrl}/auth/verify?token=${token}`;

    this.logger.log(`Generated magic link for ${email} with token: ${token}`);

    // Create email message
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

    // In development mode, just log the link instead of sending
    if (this.devModeSkipEmail) {
      this.logger.log("----------------------------------------");
      this.logger.log("DEVELOPMENT MODE - NOT SENDING REAL EMAIL");
      this.logger.log(`Magic Link for ${email}:`);
      this.logger.log(magicLinkUrl);
      this.logger.log("----------------------------------------");
      return; // Skip actual sending
    }

    // Send the email in production
    try {
      await sendgrid.send(msg);
    } catch (error) {
      this.logger.error("SendGrid error:", error);
      if (error.response) {
        this.logger.error("SendGrid error response:", error.response.body);
      }

      // If in production, throw the error
      // In development with fallback disabled, also throw
      if (!this.devModeSkipEmail) {
        throw new Error(`Failed to send magic link email: ${error.message}`);
      } else {
        // This shouldn't happen since we return early in dev mode, but just in case
        this.logger.warn(
          `Email would have failed, but we're in dev mode: ${error.message}`
        );
      }
    }
  }

  async verifyToken(token: string): Promise<string> {
    // Find the magic link by token
    const magicLink = await this.magicLinkRepository.findOne({
      where: { token },
      relations: ["user"],
    });

    if (!magicLink) {
      throw new UnauthorizedException("Invalid or expired magic link");
    }

    // Check if the link is expired
    if (new Date() > magicLink.expiresAt) {
      throw new UnauthorizedException("Magic link has expired");
    }

    // Check if the link has been used
    if (magicLink.used) {
      throw new UnauthorizedException("Magic link has already been used");
    }

    // Mark the link as used
    magicLink.used = true;
    await this.magicLinkRepository.save(magicLink);

    return magicLink.userId;
  }
}
