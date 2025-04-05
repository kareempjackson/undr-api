import { User } from "./user.entity";
export declare enum TransactionType {
    ESCROW_CREATED = "ESCROW_CREATED",
    ESCROW_FUNDED = "ESCROW_FUNDED",
    ESCROW_PROOF_SUBMITTED = "ESCROW_PROOF_SUBMITTED",
    ESCROW_PROOF_REVIEWED = "ESCROW_PROOF_REVIEWED",
    ESCROW_COMPLETED = "ESCROW_COMPLETED",
    ESCROW_CANCELLED = "ESCROW_CANCELLED",
    ESCROW_REFUNDED = "ESCROW_REFUNDED",
    ESCROW_DISPUTED = "ESCROW_DISPUTED",
    ESCROW_TERMS_UPDATED = "ESCROW_TERMS_UPDATED",
    MILESTONE_UPDATED = "MILESTONE_UPDATED",
    CHARGEBACK_BUFFER_ALLOCATION = "CHARGEBACK_BUFFER_ALLOCATION",
    CHARGEBACK_BUFFER_DEDUCTION = "CHARGEBACK_BUFFER_DEDUCTION"
}
export declare class TransactionLog {
    id: string;
    type: TransactionType;
    userId: string;
    user: User;
    entityId: string;
    entityType: string;
    data: Record<string, any>;
    ipAddress: string;
    userAgent: string;
    metadata: Record<string, any>;
    createdAt: Date;
    action: string;
    details: Record<string, any>;
    amount: number;
    level: string;
}
