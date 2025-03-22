import { PaymentMethod } from "../../../entities/payment.entity";
export declare class DepositDto {
    amount: number;
    paymentMethod: PaymentMethod;
}
export declare class PayCreatorDto {
    creatorId: string;
    amount: number;
    description?: string;
}
export * from "./deposit.dto";
export * from "./pay-creator.dto";
export * from "./complete-deposit.dto";
export * from "./pay-by-alias.dto";
