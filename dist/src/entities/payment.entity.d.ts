import { User } from "./user.entity";
export declare enum PaymentMethod {
    WALLET = "WALLET",
    CREDIT_CARD = "CREDIT_CARD",
    CRYPTO_BTC = "CRYPTO_BTC",
    CRYPTO_ETH = "CRYPTO_ETH",
    CRYPTO_USDT = "CRYPTO_USDT"
}
export declare enum PaymentStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    REFUNDED = "REFUNDED",
    DISPUTED = "DISPUTED",
    HELD = "HELD",
    ESCROW = "ESCROW"
}
export declare enum ThreeDsStatus {
    NOT_REQUIRED = "NOT_REQUIRED",
    REQUIRED = "REQUIRED",
    AUTHENTICATED = "AUTHENTICATED",
    FAILED = "FAILED",
    REJECTED = "REJECTED"
}
export declare class Payment {
    id: string;
    amount: number;
    status: PaymentStatus;
    method: PaymentMethod;
    description: string;
    externalId: string;
    threeDsStatus: ThreeDsStatus;
    threeDsUrl: string;
    threeDsResult: object;
    riskScore: number;
    hasDispute: boolean;
    isHighRisk: boolean;
    ipAddress: string;
    deviceInfo: object;
    browserInfo: string;
    isInternational: boolean;
    invoiceDetails: object;
    receiptData: object;
    createdAt: Date;
    updatedAt: Date;
    fromUserId: string;
    fromUser: User;
    toUserId: string;
    toUser: User;
}
