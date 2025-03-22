import { User } from "./user.entity";
import { Escrow } from "./escrow.entity";
export declare enum ProofType {
    IMAGE = "IMAGE",
    DOCUMENT = "DOCUMENT",
    VIDEO = "VIDEO",
    LINK = "LINK",
    TEXT = "TEXT"
}
export declare enum ProofStatus {
    PENDING = "PENDING",
    ACCEPTED = "ACCEPTED",
    REJECTED = "REJECTED"
}
export declare class DeliveryProof {
    id: string;
    escrowId: string;
    escrow: Escrow;
    submittedById: string;
    submittedBy: User;
    type: ProofType;
    description: string;
    files: string[];
    status: ProofStatus;
    reviewedById: string;
    reviewedBy: User;
    rejectionReason: string;
    reviewedAt: Date;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
