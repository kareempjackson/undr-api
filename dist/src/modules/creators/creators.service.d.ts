import { Repository } from "typeorm";
import { User } from "../../entities/user.entity";
import { Payment } from "../../entities/payment.entity";
export declare class CreatorsService {
    private userRepository;
    private paymentRepository;
    constructor(userRepository: Repository<User>, paymentRepository: Repository<Payment>);
    getDashboard(creatorId: string): Promise<{
        balance: number;
        totalEarnings: number;
        paymentCount: number;
        recentTransactions: Payment[];
    }>;
    getEarnings(creatorId: string): Promise<{
        earningsByMonth: {};
        totalEarnings: number;
        transactionCount: number;
    }>;
}
