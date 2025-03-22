import { Wallet } from "./wallet.entity";
import { Payment } from "./payment.entity";
import { Deposit } from "./deposit.entity";
import { Withdrawal } from "./withdrawal.entity";
import { MagicLink } from "./magic-link.entity";
export declare enum UserRole {
    ADMIN = "ADMIN",
    CREATOR = "CREATOR",
    FAN = "FAN",
    AGENCY = "AGENCY"
}
export declare enum UserStatus {
    ACTIVE = "ACTIVE",
    PENDING = "PENDING",
    SUSPENDED = "SUSPENDED",
    DELETED = "DELETED"
}
export declare enum MfaMethod {
    NONE = "NONE",
    EMAIL = "EMAIL",
    SMS = "SMS",
    AUTHENTICATOR = "AUTHENTICATOR",
    BIOMETRIC = "BIOMETRIC"
}
export declare class User {
    id: string;
    email: string;
    name: string;
    alias: string;
    role: UserRole;
    status: UserStatus;
    profileImage: string;
    bio: string;
    location: string;
    emailVerified: boolean;
    featured: boolean;
    mfaMethod: MfaMethod;
    mfaSecret: string;
    mfaEnabled: boolean;
    highSecurityMode: boolean;
    trustedDevices: object[];
    loginHistory: object[];
    phoneNumber: string;
    phoneVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    wallet: Wallet;
    paymentsSent: Payment[];
    paymentsReceived: Payment[];
    deposits: Deposit[];
    withdrawals: Withdrawal[];
    magicLinks: MagicLink[];
}
