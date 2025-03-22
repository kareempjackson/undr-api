import { User } from "./user.entity";
import { PaymentMethod } from "./payment.entity";
export declare enum DepositStatus {
    PENDING = "PENDING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare class Deposit {
    id: string;
    amount: number;
    status: DepositStatus;
    method: PaymentMethod;
    transactionId: string;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    user: User;
}
