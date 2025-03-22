import { AuthService } from "./auth.service";
import { LoginDto, VerifyMagicLinkDto } from "./dto";
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
            wallet: {
                id: string;
                balance: number;
            };
        };
        token: string;
    }>;
    getProfile(req: any): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("../../entities").UserRole;
        status: import("../../entities").UserStatus;
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
            wallet: {
                id: string;
                balance: number;
            };
        };
        token: string;
    }>;
}
