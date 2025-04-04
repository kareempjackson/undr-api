import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LoginDto, VerifyMagicLinkDto } from "./dto";
import { MagicLinkService } from "./magic-link.service";
import { User, UserStatus, UserRole } from "../../entities/user.entity";
import { Wallet } from "../../entities/wallet.entity";
import { MagicLink } from "../../entities/magic-link.entity";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(MagicLink)
    private magicLinkRepository: Repository<MagicLink>,
    private jwtService: JwtService,
    private magicLinkService: MagicLinkService,
    private configService: ConfigService
  ) {}

  async login(loginDto: LoginDto) {
    const { email, role } = loginDto;

    try {
      // First check if user exists - don't create yet
      let user = await this.userRepository.findOne({ where: { email } });

      // If user exists, send a magic link with their ID
      if (user) {
        await this.magicLinkService.sendMagicLink(email, user.id);
        return { message: "Magic link sent to your email" };
      }

      // For new users, create the account with the specified role
      user = this.userRepository.create({
        email,
        status: UserStatus.PENDING,
        role: role,
      });

      // Save the user record to get an ID
      user = await this.userRepository.save(user);
      console.log(`New user created with ID: ${user.id}, role: ${user.role}`);

      // Create a wallet for the user
      const wallet = this.walletRepository.create({
        user,
        balance: 0,
      });
      await this.walletRepository.save(wallet);

      // Now that we have saved the user and have an ID, send the magic link
      await this.magicLinkService.sendMagicLink(email, user.id);
      return { message: "Magic link sent to your email" };
    } catch (error) {
      console.error(`Error in login process for ${email}:`, error);
      throw new BadRequestException(
        `Failed to send magic link: ${error.message}`
      );
    }
  }

  async verifyMagicLink(token: string) {
    // Verify token and get user ID
    const userId = await this.magicLinkService.verifyToken(token);

    // Get user data
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["wallet"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Update user status if pending and set emailVerified to true
    if (user.status === UserStatus.PENDING) {
      user.status = UserStatus.ACTIVE;
    }

    // Always set emailVerified to true when a magic link is successfully verified
    user.emailVerified = true;

    await this.userRepository.save(user);

    // Generate JWT
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
          id: user.wallet?.id || "default-wallet",
          balance: user.wallet?.balance || 0,
        },
      },
      token: this.jwtService.sign(payload),
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["wallet"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      wallet: {
        id: user.wallet?.id || "default-wallet",
        balance: user.wallet?.balance || 0,
      },
    };
  }

  async sendMagicLink(email: string, userId?: string): Promise<void> {
    if (!userId) {
      const user = await this.userRepository.findOne({ where: { email } });
      if (user) {
        userId = user.id;
      }
    }

    if (!userId) {
      throw new NotFoundException("User not found. Please sign up first.");
    }

    await this.magicLinkService.sendMagicLink(email, userId);
    return;
  }

  async getUserProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["wallet"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      wallet: {
        id: user.wallet?.id || "default-wallet",
        balance: user.wallet?.balance || 0,
      },
      profileImage: user.profileImage,
      bio: user.bio,
      location: user.location,
      createdAt: user.createdAt,
    };
  }

  async refreshToken(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["wallet"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Generate a new JWT with the latest user data (including role)
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
          id: user.wallet?.id || "default-wallet",
          balance: user.wallet?.balance || 0,
        },
      },
      token: this.jwtService.sign(payload),
    };
  }

  // Debug method to check if a token exists in the database
  async debugCheckToken(token: string) {
    // Convert token to lowercase for consistency
    const normalizedToken = token.toLowerCase();

    try {
      // First try a direct database query
      const rawResults = await this.magicLinkRepository.query(
        `SELECT * FROM magic_links WHERE token = $1`,
        [normalizedToken]
      );

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

      // If not found, try with TypeORM repository
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

      // If still not found, look for similar tokens
      const similarTokens = await this.magicLinkRepository.query(
        `SELECT * FROM magic_links WHERE token ILIKE $1`,
        [`%${normalizedToken.substring(0, 8)}%`]
      );

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

      // If nothing found
      return {
        found: false,
        message: "Token not found in database",
      };
    } catch (error) {
      return {
        found: false,
        error: error.message,
        message: "Error checking token",
      };
    }
  }

  // Debug method to generate a test token
  async debugGenerateTestToken(email: string) {
    try {
      // Find the user by email
      const user = await this.userRepository.findOne({ where: { email } });

      if (!user) {
        throw new NotFoundException(`No user found with email ${email}`);
      }

      // First clean up any existing tokens for this user
      await this.magicLinkRepository.query(
        `DELETE FROM magic_links WHERE "userId" = $1`,
        [user.id]
      );

      // Generate a fixed test token for easier testing
      const testToken = "debug-token-" + Math.floor(Math.random() * 10000);

      // Set expiration to 1 hour from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Create a magic link record directly with SQL
      await this.magicLinkRepository.query(
        `INSERT INTO magic_links (token, "expiresAt", used, "userId", "createdAt") 
         VALUES ($1, $2, $3, $4, $5)`,
        [testToken, expiresAt, false, user.id, new Date()]
      );

      // Verify the token was saved and is not marked as used
      const verifyQuery = await this.magicLinkRepository.query(
        `SELECT * FROM magic_links WHERE token = $1`,
        [testToken]
      );

      if (verifyQuery.length === 0) {
        throw new Error("Failed to save test token - not found after creation");
      }

      if (verifyQuery[0].used === true) {
        throw new Error(
          "Critical error: Token marked as used immediately after creation"
        );
      }

      // Create verification URL
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
    } catch (error) {
      return {
        success: false,
        message: "Failed to generate test token",
        error: error.message,
      };
    }
  }

  // Clean up all invalid and used magic links for a user
  async cleanMagicLinks(userId: string): Promise<void> {
    try {
      await this.magicLinkRepository.query(
        `DELETE FROM magic_links 
         WHERE ("userId" = $1 AND used = true) OR 
               ("userId" = $1 AND "expiresAt" < $2)`,
        [userId, new Date()]
      );
    } catch (error) {
      this.logger.error(`Failed to clean up magic links: ${error.message}`);
    }
  }

  // Direct login that bypasses TypeORM entirely
  async directLogin(email: string) {
    try {
      // Find user by email using direct SQL
      const userResults = await this.magicLinkRepository.query(
        `SELECT * FROM users WHERE email = $1`,
        [email]
      );

      if (userResults.length === 0) {
        throw new NotFoundException(`No user found with email ${email}`);
      }

      const user = userResults[0];

      // Clear all existing tokens
      await this.magicLinkRepository.query(
        `DELETE FROM magic_links WHERE "userId" = $1`,
        [user.id]
      );

      // Generate a simple token
      const testToken = `direct-login-${Date.now()}`;

      // Set expiration to 1 hour from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Insert token directly with SQL
      await this.magicLinkRepository.query(
        `INSERT INTO magic_links (id, token, "expiresAt", used, "userId", "createdAt") 
         VALUES (uuid_generate_v4(), $1, $2, false, $3, now())`,
        [testToken, expiresAt, user.id]
      );

      // Verify the token exists and is not used
      const verifyResult = await this.magicLinkRepository.query(
        `SELECT * FROM magic_links WHERE token = $1`,
        [testToken]
      );

      if (verifyResult.length === 0 || verifyResult[0].used === true) {
        throw new Error(
          "Failed to create usable token - check for triggers or hooks in the database"
        );
      }

      // Create verification URL
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
    } catch (error) {
      this.logger.error(`Direct login error: ${error.message}`);
      return {
        success: false,
        message: "Failed to create direct login link",
        error: error.message,
      };
    }
  }

  /**
   * Clean up expired tokens to maintain database health
   * - Marks all expired tokens as used
   * - Removes duplicate tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      // Mark all expired tokens as used
      const expiredResult = await this.magicLinkRepository.query(`
        UPDATE magic_links 
        SET used = true 
        WHERE "expiresAt" < NOW() AND used = false
        RETURNING COUNT(*)
      `);

      const count = expiredResult.length > 0 ? expiredResult[0].count : 0;
      this.logger.log(`Marked ${count} expired tokens as used`);
    } catch (error) {
      this.logger.error(`Error cleaning up expired tokens: ${error.message}`);
      // We don't throw here to avoid disrupting the verification flow
    }
  }

  /**
   * Complete the login process with a verified user ID
   * This is used after verifying a magic link token
   * @param userId The verified user ID from the token
   */
  async completeLoginWithUserId(userId: string) {
    // Get user data
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["wallet"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Update user status if pending and set emailVerified to true
    if (user.status === UserStatus.PENDING) {
      user.status = UserStatus.ACTIVE;
    }

    // Always set emailVerified to true when a magic link is successfully verified
    user.emailVerified = true;

    await this.userRepository.save(user);

    // Generate JWT
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
          id: user.wallet?.id || "default-wallet",
          balance: user.wallet?.balance || 0,
        },
      },
      token: this.jwtService.sign(payload),
    };
  }

  /**
   * [DEBUG] Reset the 'used' state of all tokens for a specific email
   * @param email The email to reset tokens for
   * @returns Object with operation status and counts
   */
  async debugResetTokensForEmail(email: string) {
    try {
      this.logger.log(`Attempting to reset tokens for email: ${email}`);

      // Find the user ID for this email
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        this.logger.warn(`No user found with email: ${email}`);
        return {
          success: false,
          message: `No user found with email: ${email}`,
        };
      }

      // Get existing tokens for this user
      const tokensBeforeQuery = await this.magicLinkRepository.query(
        `SELECT * FROM magic_links WHERE "userId" = $1`,
        [user.id]
      );

      const tokensBefore = tokensBeforeQuery.length;

      // Reset the 'used' flag for all tokens for this user
      const resetResult = await this.magicLinkRepository.query(
        `UPDATE magic_links SET used = false WHERE "userId" = $1 RETURNING *`,
        [user.id]
      );

      this.logger.log(
        `Reset ${resetResult.length} tokens for user ID ${user.id} (email: ${email})`
      );

      // Get active token details to help with debugging
      const activeTokensQuery = await this.magicLinkRepository.query(
        `SELECT token, "expiresAt", used, "createdAt" FROM magic_links 
         WHERE "userId" = $1 ORDER BY "createdAt" DESC`,
        [user.id]
      );

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
    } catch (error) {
      this.logger.error(`Error resetting tokens: ${error.message}`);
      return {
        success: false,
        message: `Failed to reset tokens: ${error.message}`,
      };
    }
  }

  async debugResetTokenUsageForUser(userId: string) {
    if (!userId) {
      throw new BadRequestException("User ID is required");
    }

    this.logger.log(`Resetting token usage status for user ID: ${userId}`);

    try {
      // Get all tokens for this user
      const userTokens = await this.magicLinkRepository.query(
        `SELECT id, token, used, "createdAt", "expiresAt"
         FROM magic_links
         WHERE "userId" = $1`,
        [userId]
      );

      this.logger.log(`Found ${userTokens.length} tokens for user`);

      // Reset the 'used' flag for all tokens
      if (userTokens.length > 0) {
        const resetResult = await this.magicLinkRepository.query(
          `UPDATE magic_links
           SET used = false
           WHERE "userId" = $1
           RETURNING id, token, used`,
          [userId]
        );

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
    } catch (error) {
      this.logger.error(`Error resetting token usage: ${error.message}`);
      return {
        success: false,
        message: `Failed to reset tokens: ${error.message}`,
      };
    }
  }

  /**
   * Check if a user exists and get their role
   * @param email User's email address
   * @returns Object with exists flag and role if user exists
   */
  async checkUserExists(email: string) {
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
    } catch (error) {
      this.logger.error(`Error checking user existence: ${error.message}`);
      throw new BadRequestException(`Failed to check user: ${error.message}`);
    }
  }
}
