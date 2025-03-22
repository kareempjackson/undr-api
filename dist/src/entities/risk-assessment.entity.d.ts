import { Payment } from "./payment.entity";
import { User } from "./user.entity";
export declare enum RiskLevel {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export declare enum RiskFlag {
    UNUSUAL_LOCATION = "UNUSUAL_LOCATION",
    MULTIPLE_FAILED_ATTEMPTS = "MULTIPLE_FAILED_ATTEMPTS",
    RAPID_SUCCESSION_PAYMENTS = "RAPID_SUCCESSION_PAYMENTS",
    LARGE_TRANSACTION = "LARGE_TRANSACTION",
    NEW_PAYMENT_METHOD = "NEW_PAYMENT_METHOD",
    UNUSUAL_TIME = "UNUSUAL_TIME",
    IP_MISMATCH = "IP_MISMATCH",
    DEVICE_CHANGE = "DEVICE_CHANGE",
    BEHAVIORAL_ANOMALY = "BEHAVIORAL_ANOMALY"
}
export declare class RiskAssessment {
    id: string;
    paymentId: string;
    payment: Payment;
    userId: string;
    user: User;
    riskLevel: RiskLevel;
    riskFlags: RiskFlag[];
    riskScore: number;
    riskDetails: string;
    deviceInfo: object;
    ipAddress: string;
    location: string;
    requires3ds: boolean;
    requiresMfa: boolean;
    blocked: boolean;
    reviewRequired: boolean;
    reviewedByUserId: string;
    reviewedByUser: User;
    reviewNotes: string;
    createdAt: Date;
    updatedAt: Date;
    reviewedAt: Date;
}
