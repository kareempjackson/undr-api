import { Repository } from "typeorm";
import { PaymentsService } from "../payments/payments.service";
import { DepositDto, PayCreatorDto, CompleteDepositDto, PayByAliasDto } from "./dto";
import { User } from "../../entities/user.entity";
import { Wallet } from "../../entities/wallet.entity";
import { Payment } from "../../entities/payment.entity";
import { PaymentMethod, PaymentStatus } from "../../entities/common.enums";
import { Deposit, DepositStatus } from "../../entities/deposit.entity";
import { AliasService } from "../common/services/alias.service";
export declare class FansService {
    private userRepository;
    private walletRepository;
    private paymentRepository;
    private depositRepository;
    private paymentsService;
    private aliasService;
    private readonly logger;
    constructor(userRepository: Repository<User>, walletRepository: Repository<Wallet>, paymentRepository: Repository<Payment>, depositRepository: Repository<Deposit>, paymentsService: PaymentsService, aliasService: AliasService);
    deposit(userId: string, depositDto: DepositDto): Promise<any>;
    getDepositStatus(userId: string, depositId: string): Promise<{
        status: DepositStatus;
        amount: number;
        method: PaymentMethod;
        transactionId: string;
        createdAt: Date;
    }>;
    completeDeposit(userId: string, completeDepositDto: CompleteDepositDto): Promise<{
        message: string;
        status: DepositStatus.COMPLETED;
        walletBalance: number;
        success: boolean;
    }>;
    payCreator(userId: string, payDto: PayCreatorDto): Promise<{
        success: boolean;
        paymentId: string;
        fromAlias: string;
        toAlias: string;
        amount: number;
        status: PaymentStatus;
        timestamp: Date;
        metadata: object;
    }>;
    getTransactionHistory(userId: string): Promise<{
        userAlias: string;
        transactions: {
            id: string;
            amount: number;
            status: PaymentStatus;
            description: string;
            fromAlias: string;
            toAlias: string;
            direction: string;
            timestamp: Date;
            method: PaymentMethod;
            metadata: object;
        }[];
    }>;
    payByAlias(userId: string, payDto: PayByAliasDto): Promise<{
        success: boolean;
        paymentId: string;
        fromAlias: string;
        toAlias: string;
        amount: number;
        status: PaymentStatus;
        timestamp: Date;
        metadata: object;
    }>;
}
