import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Request,
  Param,
  Query,
  BadRequestException,
  UnauthorizedException,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { LoginDto, VerifyMagicLinkDto, CheckUserDto } from "./dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { Public } from "./decorators/public.decorator";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MagicLink } from "../../entities/magic-link.entity";

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    @InjectRepository(MagicLink)
    private magicLinkRepository: Repository<MagicLink>
  ) {}

  // Track recent verification attempts to prevent redundant submissions
  private verificationAttempts = new Map<string, number>();

  // Debounce threshold (in ms)
  private readonly DEBOUNCE_TIME = 2000; // 2 seconds

  @Public()
  @Post("login")
  @ApiOperation({ summary: "Login or register with email" })
  @ApiResponse({ status: 200, description: "Magic link sent" })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post("verify")
  @ApiOperation({ summary: "Verify magic link token" })
  @ApiResponse({ status: 200, description: "User logged in successfully" })
  async verifyMagicLink(@Body() verifyMagicLinkDto: VerifyMagicLinkDto) {
    try {
      const { token } = verifyMagicLinkDto;

      if (!token) {
        this.logger.warn("Token is missing in request");
        throw new BadRequestException("Token is required for verification");
      }

      // Normalize token
      const normalizedToken = token.toLowerCase();

      // Simple debouncing to prevent multiple rapid requests for the same token
      const lastAttempt = this.verificationAttempts.get(normalizedToken);
      const now = Date.now();

      if (lastAttempt && now - lastAttempt < this.DEBOUNCE_TIME) {
        this.logger.warn(
          `Debounced verification request for token: ${normalizedToken.slice(
            0,
            8
          )}...`
        );
        throw new BadRequestException(
          "Please wait a moment before trying again."
        );
      }

      // Record this attempt time
      this.verificationAttempts.set(normalizedToken, now);

      // Clean up old entries periodically (every 100 requests)
      if (this.verificationAttempts.size > 100) {
        const cutoff = now - this.DEBOUNCE_TIME * 5; // 5x debounce time
        for (const [key, timestamp] of this.verificationAttempts.entries()) {
          if (timestamp < cutoff) {
            this.verificationAttempts.delete(key);
          }
        }
      }

      // Log the verification attempt with a partial token for security
      const tokenPreview = normalizedToken.slice(0, 8);
      this.logger.log(
        `Received verification request for token: ${tokenPreview}...`
      );

      // Basic token format validation
      if (normalizedToken.length < 10) {
        this.logger.warn(`Invalid token format: ${tokenPreview}...`);
        throw new BadRequestException("Invalid token format");
      }

      try {
        // Pass directly to auth service for verification (single verification point)
        const result = await this.authService.verifyMagicLink(normalizedToken);
        this.logger.log(
          `Verification successful for token: ${tokenPreview}...`
        );

        // Remove from debounce map after successful verification
        this.verificationAttempts.delete(normalizedToken);
        return result;
      } catch (error) {
        this.logger.error(
          `Error during verification process: ${error.message}`
        );
        throw error;
      }
    } catch (error) {
      // Log detailed error information
      this.logger.error(`Verification error: ${error.message}`);

      // Return appropriate error to client
      if (
        error instanceof BadRequestException ||
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      // Generic error for unexpected cases
      throw new UnauthorizedException(
        "Failed to verify magic link. Please try again or request a new one."
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  @ApiOperation({ summary: "Get current user data" })
  @ApiResponse({ status: 200, description: "Current user data retrieved" })
  @ApiBearerAuth()
  async getCurrentUser(@Request() req) {
    return this.authService.getProfile(req.user.sub || req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  @ApiOperation({ summary: "Get user profile" })
  @ApiResponse({ status: 200, description: "User profile retrieved" })
  @ApiBearerAuth()
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("refresh-token")
  @ApiOperation({ summary: "Refresh JWT token" })
  @ApiResponse({ status: 200, description: "Token refreshed" })
  @ApiBearerAuth()
  async refreshToken(@Request() req) {
    return this.authService.refreshToken(req.user.id);
  }

  @Public()
  @Get("debug/check-token/:token")
  @ApiOperation({ summary: "[DEBUG] Check if a token exists" })
  async checkToken(@Param("token") token: string) {
    return this.authService.debugCheckToken(token);
  }

  @Public()
  @Get("debug/generate-test-token")
  @ApiOperation({ summary: "[DEBUG] Generate a test token" })
  async generateTestToken(@Query("email") email: string) {
    if (!email) {
      throw new BadRequestException("Email is required");
    }
    return this.authService.debugGenerateTestToken(email);
  }

  @Public()
  @Get("debug/direct-login")
  @ApiOperation({ summary: "[DEBUG] Direct login that bypasses TypeORM" })
  async directLogin(@Query("email") email: string) {
    if (!email) {
      throw new BadRequestException("Email is required");
    }

    return this.authService.directLogin(email);
  }

  @Public()
  @Get("debug/cleanup-tokens")
  @ApiOperation({ summary: "[DEBUG] Clean up tokens in database" })
  async cleanupTokens() {
    try {
      // First clean up expired tokens
      await this.authService.cleanupExpiredTokens();

      // Then delete all used tokens
      const result = await this.magicLinkRepository.query(
        `DELETE FROM magic_links WHERE used = true`
      );

      // Get stats for remaining tokens
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
    } catch (error) {
      this.logger.error(`Error cleaning tokens: ${error.message}`);
      return {
        error: true,
        message: `Failed to clean tokens: ${error.message}`,
      };
    }
  }

  @Public()
  @Get("debug/reset-all-tokens")
  @ApiOperation({ summary: "[DEBUG] Reset all tokens in database" })
  async resetAllTokens() {
    try {
      // Delete ALL tokens
      const deleteResult = await this.magicLinkRepository.query(
        `DELETE FROM magic_links`
      );

      this.logger.log(`Deleted all tokens from database`);

      return {
        message: "All tokens have been deleted from the database",
        success: true,
      };
    } catch (error) {
      this.logger.error(`Error resetting tokens: ${error.message}`);
      return {
        error: true,
        message: `Failed to reset tokens: ${error.message}`,
      };
    }
  }

  @Public()
  @Get("debug/reset-tokens-for-email")
  @ApiOperation({ summary: "[DEBUG] Reset all tokens for a specific email" })
  async resetTokensForEmail(@Query("email") email: string) {
    if (!email) {
      throw new BadRequestException("Email is required");
    }
    this.logger.log(`Processing request to reset tokens for email: ${email}`);
    return this.authService.debugResetTokensForEmail(email);
  }

  @Public()
  @Get("debug/reset-token-usage-for-user")
  @ApiOperation({
    summary: "[DEBUG] Reset token usage status for a specific user",
  })
  async resetTokenUsageForUser(@Query("userId") userId: string) {
    if (!userId) {
      throw new BadRequestException("User ID is required");
    }
    this.logger.log(
      `Processing request to reset token usage for user ID: ${userId}`
    );
    return this.authService.debugResetTokenUsageForUser(userId);
  }

  @Public()
  @Post("check-user")
  @ApiOperation({ summary: "Check if a user exists and get their role" })
  @ApiResponse({ status: 200, description: "User existence information" })
  async checkUser(@Body() checkUserDto: CheckUserDto) {
    return this.authService.checkUserExists(checkUserDto.email);
  }
}
