import { User } from "./user.entity";
import { PaymentMethod, WithdrawalStatus } from "./common.enums";
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
