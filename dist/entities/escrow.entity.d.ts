import { User } from "./user.entity";
import { Payment } from "./payment.entity";
export declare enum EscrowStatus {
    PENDING = "PENDING",
    FUNDED = "FUNDED",
    RELEASED = "RELEASED",
    REFUNDED = "REFUNDED",
    DISPUTED = "DISPUTED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum MilestoneStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    DISPUTED = "DISPUTED"
}
export declare class EscrowMilestone {
    id: string;
    escrowId: string;
    amount: number;
    description: string;
    status: MilestoneStatus;
    sequence: number;
    completedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}
export declare class Escrow {
    id: string;
    totalAmount: number;
    status: EscrowStatus;
    title: string;
    description: string;
    expiresAt: Date;
    buyerId: string;
    buyer: User;
    sellerId: string;
    seller: User;
    paymentId: string;
    payment: Payment;
    milestones: EscrowMilestone[];
    terms: object;
    evidenceFiles: string[];
    createdAt: Date;
    updatedAt: Date;
    completedAt: Date;
}
