import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";
import { LoginDto } from "./dto";
import { MagicLinkService } from "./magic-link.service";
import { User, UserStatus, UserRole } from "../../entities/user.entity";
import { Wallet } from "../../entities/wallet.entity";
import { MagicLink } from "../../entities/magic-link.entity";
import { ConfigService } from "@nestjs/config";
export declare class AuthService {
    private userRepository;
    private walletRepository;
    private magicLinkRepository;
    private jwtService;
    private magicLinkService;
    private configService;
    private readonly logger;
    constructor(userRepository: Repository<User>, walletRepository: Repository<Wallet>, magicLinkRepository: Repository<MagicLink>, jwtService: JwtService, magicLinkService: MagicLinkService, configService: ConfigService);
    login(loginDto: LoginDto): Promise<{
        message: string;
    }>;
    verifyMagicLink(token: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: UserRole;
            status: UserStatus.ACTIVE | UserStatus.SUSPENDED | UserStatus.DELETED;
            emailVerified: boolean;
            wallet: {
                id: string;
                balance: number;
            };
        };
        token: string;
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: UserRole;
        status: UserStatus;
        emailVerified: boolean;
        wallet: {
            id: string;
            balance: number;
        };
    }>;
    sendMagicLink(email: string, userId?: string): Promise<void>;
    getUserProfile(userId: string): Promise<{
        id: string;
        email: string;
        name: string;
        role: UserRole;
        status: UserStatus;
        emailVerified: boolean;
        wallet: {
            id: string;
            balance: number;
        };
        profileImage: string;
        bio: string;
        location: string;
        createdAt: Date;
    }>;
    refreshToken(userId: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: UserRole;
            status: UserStatus;
            emailVerified: boolean;
            wallet: {
                id: string;
                balance: number;
            };
        };
        token: string;
    }>;
    debugCheckToken(token: string): Promise<{
        found: boolean;
        tokenDetails: {
            id: any;
            token: any;
            used: any;
            userId: any;
            expiresAt: any;
            createdAt: any;
        };
        message: string;
        similar?: undefined;
        error?: undefined;
    } | {
        found: boolean;
        similar: any;
        message: string;
        tokenDetails?: undefined;
        error?: undefined;
    } | {
        found: boolean;
        message: string;
        tokenDetails?: undefined;
        similar?: undefined;
        error?: undefined;
    } | {
        found: boolean;
        error: any;
        message: string;
        tokenDetails?: undefined;
        similar?: undefined;
    }>;
    debugGenerateTestToken(email: string): Promise<{
        success: boolean;
        message: string;
        token: string;
        verifyUrl: string;
        tokenDetails: any;
        user: {
            id: string;
            email: string;
            role: UserRole;
        };
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        token?: undefined;
        verifyUrl?: undefined;
        tokenDetails?: undefined;
        user?: undefined;
    }>;
    cleanMagicLinks(userId: string): Promise<void>;
    directLogin(email: string): Promise<{
        success: boolean;
        message: string;
        token: string;
        verifyUrl: string;
        tokenDetails: any;
        user: {
            id: any;
            email: any;
            role: any;
        };
        error?: undefined;
    } | {
        success: boolean;
        message: string;
        error: any;
        token?: undefined;
        verifyUrl?: undefined;
        tokenDetails?: undefined;
        user?: undefined;
    }>;
    cleanupExpiredTokens(): Promise<void>;
    completeLoginWithUserId(userId: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: UserRole;
            status: UserStatus.ACTIVE | UserStatus.SUSPENDED | UserStatus.DELETED;
            emailVerified: boolean;
            wallet: {
                id: string;
                balance: number;
            };
        };
        token: string;
    }>;
    debugResetTokensForEmail(email: string): Promise<{
        success: boolean;
        message: string;
        tokensBefore?: undefined;
        tokensReset?: undefined;
        activeTokens?: undefined;
    } | {
        success: boolean;
        message: string;
        tokensBefore: any;
        tokensReset: any;
        activeTokens: any;
    }>;
    debugResetTokenUsageForUser(userId: string): Promise<{
        success: boolean;
        message: string;
        tokens: any;
    } | {
        success: boolean;
        message: string;
        tokens?: undefined;
    }>;
    checkUserExists(email: string): Promise<{
        exists: boolean;
        role: UserRole;
        id: string;
    }>;
}
