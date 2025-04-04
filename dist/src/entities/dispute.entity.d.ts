import { User } from "./user.entity";
import { Escrow } from "./escrow.entity";
import { DisputeEvidence } from "./dispute-evidence.entity";
import { DisputeMessage } from "./dispute-message.entity";
export declare enum DisputeStatus {
    EVIDENCE_SUBMISSION = "EVIDENCE_SUBMISSION",
    UNDER_REVIEW = "UNDER_REVIEW",
    MUTUALLY_RESOLVED = "MUTUALLY_RESOLVED",
    RESOLVED_BY_ADMIN = "RESOLVED_BY_ADMIN",
    CLOSED = "CLOSED",
    EXPIRED = "EXPIRED",
    OPEN = "OPEN",
    RESOLVED_FOR_CUSTOMER = "RESOLVED_FOR_CUSTOMER",
    RESOLVED_FOR_MERCHANT = "RESOLVED_FOR_MERCHANT",
    ESCALATED = "ESCALATED"
}
export declare enum DisputeResolution {
    BUYER_REFUND = "BUYER_REFUND",
    SELLER_RECEIVE = "SELLER_RECEIVE",
    SPLIT = "SPLIT",
    CUSTOM = "CUSTOM"
}
export declare enum DisputeReason {
    PRODUCT_NOT_RECEIVED = "PRODUCT_NOT_RECEIVED",
    PRODUCT_NOT_AS_DESCRIBED = "PRODUCT_NOT_AS_DESCRIBED",
    UNAUTHORIZED_CHARGE = "UNAUTHORIZED_CHARGE",
    DUPLICATE_CHARGE = "DUPLICATE_CHARGE",
    SERVICES_NOT_PROVIDED = "SERVICES_NOT_PROVIDED",
    QUALITY_ISSUES = "QUALITY_ISSUES",
    OTHER = "OTHER"
}
export declare class Dispute {
    id: string;
    escrowId: string;
    escrow: Escrow;
    createdById: string;
    createdBy: User;
    reviewedById: string;
    reviewedBy: User;
    reason: string;
    details: Record<string, any>;
    status: DisputeStatus;
    resolution: DisputeResolution;
    evidenceDeadline: Date;
    resolvedAt: Date;
    buyerAmount: number;
    sellerAmount: number;
    metadata: Record<string, any>;
    paymentId: string;
    filedByUserId: string;
    resolvedByUserId: string;
    description: string;
    evidenceFiles: string[];
    responsePacket: Record<string, any>;
    resolutionNotes: string;
    createdAt: Date;
    updatedAt: Date;
    evidence: DisputeEvidence[];
    messages: DisputeMessage[];
}
