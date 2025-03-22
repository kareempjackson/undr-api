import { Repository } from "typeorm";
import { User } from "../../entities/user.entity";
import { Payment } from "../../entities/payment.entity";
import { ConfigService } from "@nestjs/config";
import { AliasService } from "../common/services/alias.service";
export declare class CreatorsService {
    private userRepository;
    private paymentRepository;
    private configService;
    private aliasService;
    constructor(userRepository: Repository<User>, paymentRepository: Repository<Payment>, configService: ConfigService, aliasService: AliasService);
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
    getPaymentLink(creatorId: string): Promise<{
        alias: string;
        paymentUrl: string;
        apiEndpoint: string;
    }>;
    getPaymentLinkByAlias(alias: string): Promise<{
        alias: string;
        paymentUrl: string;
        apiEndpoint: string;
    }>;
}
