import { FansService } from "./fans.service";
import { DepositDto, PayCreatorDto, CompleteDepositDto, PayByAliasDto } from "./dto";
export declare class FansController {
    private fansService;
    constructor(fansService: FansService);
    deposit(req: any, depositDto: DepositDto): Promise<any>;
    getDepositStatus(req: any, depositId: string): Promise<{
        status: import("../../entities").DepositStatus;
        amount: number;
        method: import("../../entities").PaymentMethod;
        transactionId: string;
        createdAt: Date;
    }>;
    completeDeposit(req: any, completeDepositDto: CompleteDepositDto): Promise<{
        message: string;
        status: import("../../entities").DepositStatus.COMPLETED;
        walletBalance: number;
        success: boolean;
    }>;
    payCreator(req: any, payDto: PayCreatorDto): Promise<{
        success: boolean;
        paymentId: string;
        fromAlias: string;
        toAlias: string;
        amount: number;
        status: import("../../entities").PaymentStatus;
        timestamp: Date;
        metadata: object;
    }>;
    payByAlias(req: any, alias: string, payDto: PayByAliasDto): Promise<{
        success: boolean;
        paymentId: string;
        fromAlias: string;
        toAlias: string;
        amount: number;
        status: import("../../entities").PaymentStatus;
        timestamp: Date;
        metadata: object;
    }>;
    getTransactionHistory(req: any): Promise<{
        userAlias: string;
        transactions: {
            id: string;
            amount: number;
            status: import("../../entities").PaymentStatus;
            description: string;
            fromAlias: string;
            toAlias: string;
            direction: string;
            timestamp: Date;
            method: import("../../entities").PaymentMethod;
            metadata: object;
        }[];
    }>;
}
