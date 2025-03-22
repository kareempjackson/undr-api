import { User } from "./user.entity";
import { PaymentMethod } from "./payment.entity";
export declare enum WithdrawalStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    REJECTED = "REJECTED"
}
export declare class Withdrawal {
    id: string;
    amount: number;
    status: WithdrawalStatus;
    method: PaymentMethod;
    payoutDetails: Record<string, any>;
    transactionId: string;
    rejectionReason: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    user: User;
}
