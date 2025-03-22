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
export declare class DeliveryProofSubmitDTO {
    type: ProofType;
    evidence: Record<string, any>;
}
export declare class EscrowQueryDTO {
    userId?: string;
    status?: EscrowStatus[];
    limit?: number;
    offset?: number;
}
export declare class EscrowResponseDTO {
    id: string;
    paymentId: string;
    amount: number;
    stripePaymentIntentId?: string;
    fromUserId: string;
    toUserId: string;
    fromAlias: string;
    toAlias: string;
    status: EscrowStatus;
    scheduleReleaseAt: Date;
    releasedAt?: Date;
    refundedAt?: Date;
    isHighRisk: boolean;
    createdAt: Date;
    updatedAt: Date;
    metadata?: Record<string, any>;
    deliveryProofs?: any[];
}
export declare class RefundRequestDTO {
    reason: string;
}
