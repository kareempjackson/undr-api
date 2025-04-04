import { AuthService } from "./auth.service";
import { LoginDto, VerifyMagicLinkDto, CheckUserDto } from "./dto";
import { Repository } from "typeorm";
import { MagicLink } from "../../entities/magic-link.entity";
export declare class AuthController {
    private readonly authService;
    private magicLinkRepository;
    private readonly logger;
    constructor(authService: AuthService, magicLinkRepository: Repository<MagicLink>);
    private verificationAttempts;
    private readonly DEBOUNCE_TIME;
    login(loginDto: LoginDto): Promise<{
        message: string;
    }>;
    verifyMagicLink(verifyMagicLinkDto: VerifyMagicLinkDto): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: import("../../entities").UserRole;
            status: import("../../entities").UserStatus.ACTIVE | import("../../entities").UserStatus.SUSPENDED | import("../../entities").UserStatus.DELETED;
            emailVerified: boolean;
            wallet: {
                id: string;
                balance: number;
            };
        };
        token: string;
    }>;
    getCurrentUser(req: any): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("../../entities").UserRole;
        status: import("../../entities").UserStatus;
        emailVerified: boolean;
        wallet: {
            id: string;
            balance: number;
        };
    }>;
    getProfile(req: any): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("../../entities").UserRole;
        status: import("../../entities").UserStatus;
        emailVerified: boolean;
        wallet: {
            id: string;
            balance: number;
        };
    }>;
    refreshToken(req: any): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: import("../../entities").UserRole;
            status: import("../../entities").UserStatus;
            emailVerified: boolean;
            wallet: {
                id: string;
                balance: number;
            };
        };
        token: string;
    }>;
    checkToken(token: string): Promise<{
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
    generateTestToken(email: string): Promise<{
        success: boolean;
        message: string;
        token: string;
        verifyUrl: string;
        tokenDetails: any;
        user: {
            id: string;
            email: string;
            role: import("../../entities").UserRole;
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
    cleanupTokens(): Promise<{
        message: string;
        tokensDeleted: any;
        currentStats: any;
        error?: undefined;
    } | {
        error: boolean;
        message: string;
        tokensDeleted?: undefined;
        currentStats?: undefined;
    }>;
    resetAllTokens(): Promise<{
        message: string;
        success: boolean;
        error?: undefined;
    } | {
        error: boolean;
        message: string;
        success?: undefined;
    }>;
    resetTokensForEmail(email: string): Promise<{
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
    resetTokenUsageForUser(userId: string): Promise<{
        success: boolean;
        message: string;
        tokens: any;
    } | {
        success: boolean;
        message: string;
        tokens?: undefined;
    }>;
    checkUser(checkUserDto: CheckUserDto): Promise<{
        exists: boolean;
        role: import("../../entities").UserRole;
        id: string;
    }>;
}
