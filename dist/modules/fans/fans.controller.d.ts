import { FansService } from "./fans.service";
import { DepositDto, PayCreatorDto, CompleteDepositDto } from "./dto";
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
        paymentId: string;
        amount: number;
        status: import("../../entities").PaymentStatus;
        createdAt: Date;
    }>;
    getTransactionHistory(req: any): Promise<{
        deposits: {
            id: string;
            type: string;
            amount: number;
            status: import("../../entities").DepositStatus;
            method: import("../../entities").PaymentMethod;
            createdAt: Date;
        }[];
        paymentsSent: {
            id: string;
            type: string;
            amount: number;
            status: import("../../entities").PaymentStatus;
            method: import("../../entities").PaymentMethod;
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
            status: import("../../entities").PaymentStatus;
            method: import("../../entities").PaymentMethod;
            createdAt: Date;
            sender: {
                id: string;
                name: string;
            };
            description: string;
        }[];
    }>;
}
