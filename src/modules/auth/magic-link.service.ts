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

  async createMagicLink(
    email: string,
    userId?: string,
    timestamp?: number
  ): Promise<string> {
    // Generate a token - always lowercase for consistency
    // If timestamp is provided, include it in the token to ensure uniqueness
    const tokenBase = timestamp ? `${uuidv4()}-${timestamp}` : uuidv4();
    const token = tokenBase.toLowerCase();

    // Set expiration to 30 minutes from now
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 30);

    try {
      // Create the token record directly using SQL to bypass any ORM middleware
      await this.magicLinkRepository.query(
        `INSERT INTO magic_links (token, "expiresAt", used, "userId", "createdAt") 
         VALUES ($1, $2, $3, $4, $5)`,
        [token, expiresAt, false, userId, new Date()]
      );

      this.logger.log(
        `Successfully created magic link with token: ${token} for user ID: ${userId}`
      );

      // Verify it was created with correct "used" value
      const verifyQuery = await this.magicLinkRepository.query(
        `SELECT * FROM magic_links WHERE token = $1`,
        [token]
      );

      if (verifyQuery.length > 0) {
        const isUsed = verifyQuery[0].used;
        this.logger.log(
          `Token created verification: token=${token}, used=${isUsed}`
        );

        if (isUsed) {
          // If it was created but already marked as used, this is a critical error
          this.logger.error(
            `CRITICAL ERROR: Token was created but immediately marked as used: ${token}`
          );
        }
      } else {
        this.logger.error(
          `CRITICAL ERROR: Token was not found after creation: ${token}`
        );
      }

      return token;
    } catch (error) {
      this.logger.error(`Error creating magic link: ${error.message}`);
      throw error;
    }
  }

  async sendMagicLink(email: string, userId?: string): Promise<void> {
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
      // First, delete ALL existing tokens for this user - not just unused ones
      const deleteQuery = `DELETE FROM magic_links WHERE "userId" = $1`;
      const deleteParams = [userId];

      const deleteResult = await this.magicLinkRepository.query(
        deleteQuery,
        deleteParams
      );

      this.logger.log(
        `Deleted ${deleteResult.length || 0} existing tokens for user ${userId}`
      );
    } catch (error) {
      this.logger.error(`Error deleting existing tokens: ${error.message}`);
      // Continue anyway to create a new token
    }

    // Create a new token with current timestamp to ensure uniqueness
    const timestamp = Date.now();
    const token = await this.createMagicLink(email, userId, timestamp);

    // Create the magic link URL
    const frontendUrl = this.configService.get("FRONTEND_URL");
    const magicLinkUrl = `${frontendUrl}/auth/verify?token=${token}`;

    this.logger.log(
      `Generated magic link for ${email} with token: ${token} (user ID: ${userId})`
    );

    // Send email with magic link
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
    if (!token) {
      throw new UnauthorizedException("Token is required for verification");
    }

    // Convert token to lowercase to handle case-sensitivity issues
    const normalizedToken = token.toLowerCase();

    // Log the verification attempt
    this.logger.log(`Verifying token: ${normalizedToken}`);

    // Create a query runner for transaction management
    const queryRunner =
      this.magicLinkRepository.manager.connection.createQueryRunner();

    try {
      // Start transaction
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // First check if the token exists using the queryRunner
      const tokenExists = await queryRunner.manager.query(
        `SELECT id, token, "expiresAt", used, "userId", "createdAt" 
         FROM magic_links 
         WHERE token = $1`,
        [normalizedToken]
      );

      // Log what we found
      this.logger.log(
        `Token existence check returned ${tokenExists.length} results`
      );

      if (tokenExists.length === 0) {
        // No token found - throw error
        throw new UnauthorizedException("Invalid or expired token");
      }

      const foundToken = tokenExists[0];

      // Log token details for debugging
      this.logger.log(
        `Token details - ID: ${foundToken.id}, created: ${foundToken.createdAt}, used: ${foundToken.used}`
      );

      // Check if token is already used
      if (foundToken.used) {
        this.logger.warn(`Token found but already used: ${normalizedToken}`);
        await queryRunner.rollbackTransaction();
        throw new UnauthorizedException(
          "This magic link has already been used. Please request a new one."
        );
      }

      // Check if token is expired
      const expirationDate = new Date(foundToken.expiresAt);
      if (expirationDate < new Date()) {
        this.logger.warn(`Token is expired: ${normalizedToken}`);
        await queryRunner.rollbackTransaction();
        throw new UnauthorizedException(
          "This magic link has expired. Please request a new one."
        );
      }

      // Mark token as used within the transaction
      await queryRunner.manager.query(
        `UPDATE magic_links SET used = true WHERE id = $1`,
        [foundToken.id]
      );

      // Commit the transaction
      await queryRunner.commitTransaction();

      // Return the user ID associated with the token
      return foundToken.userId;
    } catch (error) {
      // Rollback transaction on error
      if (queryRunner.isTransactionActive) {
        try {
          await queryRunner.rollbackTransaction();
        } catch (rollbackError) {
          this.logger.error(
            `Error rolling back transaction: ${rollbackError.message}`
          );
        }
      }

      this.logger.error(`Error verifying token: ${error.message}`);

      // Rethrow the original error or a generic one
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(
        "Failed to verify magic link. Please try again."
      );
    } finally {
      // Release the query runner
      if (!queryRunner.isReleased) {
        await queryRunner.release();
      }
    }
  }
}
