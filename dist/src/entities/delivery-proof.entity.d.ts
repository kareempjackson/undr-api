import { Escrow } from "./escrow.entity";
export declare enum ProofType {
    SCREENSHOT = "SCREENSHOT",
    TRACKING_NUMBER = "TRACKING_NUMBER",
    DIGITAL_DELIVERY = "DIGITAL_DELIVERY",
    CREATOR_CONFIRMATION = "CREATOR_CONFIRMATION",
    FAN_CONFIRMATION = "FAN_CONFIRMATION",
    SYSTEM_VERIFICATION = "SYSTEM_VERIFICATION",
    ADMIN_OVERRIDE = "ADMIN_OVERRIDE"
}
export declare class DeliveryProof {
    id: string;
    escrowId: string;
    escrow: Escrow;
    type: ProofType;
    evidence: any;
    verified: boolean;
    verifiedAt: Date;
    verifiedBy: string;
    createdAt: Date;
    updatedAt: Date;
}
