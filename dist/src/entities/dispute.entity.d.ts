import { User } from "./user.entity";
import { Payment } from "./payment.entity";
export declare enum DisputeStatus {
    OPEN = "OPEN",
    UNDER_REVIEW = "UNDER_REVIEW",
    RESOLVED_FOR_MERCHANT = "RESOLVED_FOR_MERCHANT",
    RESOLVED_FOR_CUSTOMER = "RESOLVED_FOR_CUSTOMER",
    ESCALATED = "ESCALATED",
    CLOSED = "CLOSED"
}
export declare enum DisputeReason {
    PRODUCT_NOT_RECEIVED = "PRODUCT_NOT_RECEIVED",
    PRODUCT_NOT_AS_DESCRIBED = "PRODUCT_NOT_AS_DESCRIBED",
    UNAUTHORIZED_TRANSACTION = "UNAUTHORIZED_TRANSACTION",
    DUPLICATE_TRANSACTION = "DUPLICATE_TRANSACTION",
    SUBSCRIPTION_CANCELED = "SUBSCRIPTION_CANCELED",
    OTHER = "OTHER"
}
export declare class Dispute {
    id: string;
    paymentId: string;
    payment: Payment;
    filedByUserId: string;
    filedByUser: User;
    status: DisputeStatus;
    reason: DisputeReason;
    description: string;
    evidenceFiles: string[];
    responsePacket: object;
    resolutionNotes: string;
    resolvedByUserId: string;
    resolvedByUser: User;
    createdAt: Date;
    updatedAt: Date;
    resolvedAt: Date;
}
