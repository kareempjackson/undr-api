import { ProofType } from "../entities/delivery-proof.entity";
import { EscrowStatus } from "../entities/escrow.entity";
export declare class EscrowCreateDTO {
    fromUserId: string;
    toUserId: string;
    amount: number;
    paymentId: string;
    stripePaymentIntentId?: string;
    metadata?: Record<string, any>;
}
export declare class MilestoneDTO {
    amount: number;
    description: string;
    sequence: number;
}
export declare class EscrowDetailedCreateDTO {
    title: string;
    description?: string;
    totalAmount: number;
    sellerId: string;
    expirationDays: number;
    milestones: MilestoneDTO[];
    terms?: Record<string, any>;
    documents?: string[];
}
export declare class DeliveryProofSubmitDTO {
    type: ProofType;
    description?: string;
    files: string[];
    metadata?: Record<string, any>;
}
export declare class ReviewProofDTO {
    decision: "accept" | "reject";
    rejectionReason?: string;
}
export declare class EscrowFilterDTO {
    status?: EscrowStatus;
    limit?: number;
    offset?: number;
}
