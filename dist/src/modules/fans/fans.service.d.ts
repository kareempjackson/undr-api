import { Repository } from "typeorm";
import { PaymentsService } from "../payments/payments.service";
import { DepositDto, PayCreatorDto, CompleteDepositDto } from "./dto";
import { User } from "../../entities/user.entity";
import { Wallet } from "../../entities/wallet.entity";
import { Payment, PaymentMethod, PaymentStatus } from "../../entities/payment.entity";
import { Deposit, DepositStatus } from "../../entities/deposit.entity";
export declare class FansService {
    private userRepository;
    private walletRepository;
    private paymentRepository;
    private depositRepository;
    private paymentsService;
    private readonly logger;
    constructor(userRepository: Repository<User>, walletRepository: Repository<Wallet>, paymentRepository: Repository<Payment>, depositRepository: Repository<Deposit>, paymentsService: PaymentsService);
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
        paymentId: string;
        amount: number;
        status: PaymentStatus;
        createdAt: Date;
    }>;
    getTransactionHistory(userId: string): Promise<{
        deposits: {
            id: string;
            type: string;
            amount: number;
            status: DepositStatus;
            method: PaymentMethod;
            createdAt: Date;
        }[];
        paymentsSent: {
            id: string;
            type: string;
            amount: number;
            status: PaymentStatus;
            method: PaymentMethod;
            createdAt: Date;
            recipient: {
                id: string;
                name: string;
            };
            description: string;
        }[];
        paymentsReceived: {
            id: string;
            type: string;
            amount: number;
            status: PaymentStatus;
            method: PaymentMethod;
            createdAt: Date;
            sender: {
                id: string;
                name: string;
            };
            description: string;
        }[];
    }>;
}
