import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";
import { LoginDto } from "./dto";
import { MagicLinkService } from "./magic-link.service";
import { User, UserStatus } from "../../entities/user.entity";
import { Wallet } from "../../entities/wallet.entity";
import { MagicLink } from "../../entities/magic-link.entity";
export declare class AuthService {
    private userRepository;
    private walletRepository;
    private magicLinkRepository;
    private jwtService;
    private magicLinkService;
    constructor(userRepository: Repository<User>, walletRepository: Repository<Wallet>, magicLinkRepository: Repository<MagicLink>, jwtService: JwtService, magicLinkService: MagicLinkService);
    login(loginDto: LoginDto): Promise<{
        message: string;
    }>;
    verifyMagicLink(token: string): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: import("../../entities/user.entity").UserRole;
            status: UserStatus.ACTIVE | UserStatus.SUSPENDED | UserStatus.DELETED;
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
        role: import("../../entities/user.entity").UserRole;
        status: UserStatus;
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
        role: import("../../entities/user.entity").UserRole;
        status: UserStatus;
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
            role: import("../../entities/user.entity").UserRole;
            status: UserStatus;
            wallet: {
                id: string;
                balance: number;
            };
        };
        token: string;
    }>;
}
