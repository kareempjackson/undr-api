import { UserRole } from "../../../entities/user.entity";
export declare class LoginDto {
    email: string;
    role?: UserRole;
}
export declare class VerifyMagicLinkDto {
    token: string;
}
export declare class CheckUserDto {
    email: string;
}
export * from "./verify-magic-link.dto";
