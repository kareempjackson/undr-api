export declare enum LogType {
    ESCROW_CREATED = "ESCROW_CREATED",
    ESCROW_STATUS_CHANGED = "ESCROW_STATUS_CHANGED",
    PROOF_SUBMITTED = "PROOF_SUBMITTED",
    FUNDS_RELEASED = "FUNDS_RELEASED",
    REFUND_ISSUED = "REFUND_ISSUED",
    DISPUTE_CREATED = "DISPUTE_CREATED",
    DISPUTE_RESOLVED = "DISPUTE_RESOLVED",
    CHARGEBACK_RECEIVED = "CHARGEBACK_RECEIVED",
    CHARGEBACK_CHALLENGED = "CHARGEBACK_CHALLENGED",
    CHARGEBACK_RESOLVED = "CHARGEBACK_RESOLVED"
}
export declare class TransactionLog {
    id: string;
    type: LogType;
    escrowId: string;
    paymentId: string;
    userId: string;
    alias: string;
    timestamp: Date;
    description: string;
    data: any;
    ipHash: string;
    deviceFingerprint: string;
    userAgent: string;
    stripePaymentIntentId: string;
    stripeDisputeId: string;
    createdAt: Date;
}
