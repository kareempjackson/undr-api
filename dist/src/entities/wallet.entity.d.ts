import { User } from "./user.entity";
export declare class Wallet {
    id: string;
    balance: number;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    user: User;
    chargebackBuffer: boolean;
}
