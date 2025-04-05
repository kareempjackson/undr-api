import { Repository } from "typeorm";
import { User, UserRole, UserStatus } from "../../entities/user.entity";
import { Payment } from "../../entities/payment.entity";
import { Dispute, DisputeResolution, DisputeStatus } from "../../entities/dispute.entity";
import { Escrow, EscrowStatus } from "../../entities/escrow.entity";
import { Wallet } from "../../entities/wallet.entity";
import { DisputeEvidence } from "../../entities/dispute-evidence.entity";
import { DisputeMessage } from "../../entities/dispute-message.entity";
import { Withdrawal } from "../../entities/withdrawal.entity";
import { Deposit } from "../../entities/deposit.entity";
import { TransactionLog } from "../../entities/transaction-log.entity";
export declare class AdminService {
    private userRepository;
    private paymentRepository;
    private disputeRepository;
    private escrowRepository;
    private walletRepository;
    private disputeEvidenceRepository;
    private disputeMessageRepository;
    private withdrawalRepository;
    private depositRepository;
    private transactionLogRepository;
    constructor(userRepository: Repository<User>, paymentRepository: Repository<Payment>, disputeRepository: Repository<Dispute>, escrowRepository: Repository<Escrow>, walletRepository: Repository<Wallet>, disputeEvidenceRepository: Repository<DisputeEvidence>, disputeMessageRepository: Repository<DisputeMessage>, withdrawalRepository: Repository<Withdrawal>, depositRepository: Repository<Deposit>, transactionLogRepository: Repository<TransactionLog>);
    getAllUsers(search?: string, role?: UserRole, status?: UserStatus, page?: number, limit?: number): Promise<{
        users: User[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getUserDetails(userId: string): Promise<{
        user: User;
        stats: {
            paymentsSent: number;
            paymentsReceived: number;
            disputes: number;
            withdrawals: number;
            deposits: number;
        };
    }>;
    updateUserStatus(userId: string, status: string): Promise<{
        success: boolean;
        message: string;
    }>;
    updateUserRole(userId: string, role: string): Promise<{
        success: boolean;
        message: string;
    }>;
    flagUser(userId: string, reason: string, details?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAllTransactions(): Promise<Payment[]>;
    private getDateRange;
    getAnalytics(timeframe: string): Promise<{
        summary: {
            totalRevenue: number;
            totalUsers: number;
            totalCreators: number;
            totalTransactions: number;
            revenueGrowth: number;
            userGrowth: number;
            creatorGrowth: number;
            transactionGrowth: number;
        };
        revenueData: {
            labels: string[];
            data: any[];
            interval: string;
        };
        userData: {
            labels: string[];
            datasets: {
                label: string;
                data: any[];
            }[];
            interval: string;
        };
        transactionData: {
            labels: string[];
            data: any[];
            interval: string;
        };
        topCreators: {
            id: string;
            name: string;
            email: string;
            totalRevenue: number;
            growth: number;
            fanCount: number;
        }[];
        paymentMethods: {
            labels: string[];
            data: any[];
        };
    }>;
    private getSummaryData;
    getRevenueAnalytics(timeframe: string): Promise<{
        labels: string[];
        data: any[];
        interval: string;
    }>;
    private getRevenueData;
    getUserAnalytics(timeframe: string): Promise<{
        labels: string[];
        datasets: {
            label: string;
            data: any[];
        }[];
        interval: string;
    }>;
    private getUserData;
    getTransactionAnalytics(timeframe: string): Promise<{
        labels: string[];
        data: any[];
        interval: string;
    }>;
    private getTransactionData;
    getTopCreators(limit?: number): Promise<{
        id: string;
        name: string;
        email: string;
        totalRevenue: number;
        growth: number;
        fanCount: number;
    }[]>;
    getPaymentMethodsDistribution(): Promise<{
        labels: string[];
        data: any[];
    }>;
    getAllEscrows(status?: EscrowStatus, search?: string, page?: number, limit?: number): Promise<{
        escrows: Escrow[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getEscrowDetails(escrowId: string): Promise<{
        escrow: Escrow;
    }>;
    releaseEscrow(escrowId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    refundEscrow(escrowId: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getAllDisputes(status?: DisputeStatus, search?: string, page?: number, limit?: number): Promise<{
        disputes: Dispute[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getDisputeDetails(disputeId: string): Promise<{
        dispute: Dispute;
    }>;
    resolveDispute(disputeId: string, resolution: DisputeResolution, notes?: string, buyerAmount?: number, sellerAmount?: number): Promise<{
        success: boolean;
        message: string;
        resolution: {
            type: DisputeResolution;
            buyerAmount: number;
            sellerAmount: number;
            notes: string;
        };
    }>;
    getChargebackBufferDetails(): Promise<{
        currentBalance: number;
        stats: {
            totalAllocated: number;
            totalDeducted: number;
            lastMonthAllocated: number;
            lastMonthDeducted: number;
            bufferUtilization: number;
            chargebackCount: number;
        };
    }>;
    getChargebackBufferEvents(page?: number, limit?: number): Promise<{
        events: {
            id: string;
            type: string;
            amount: number;
            reason: any;
            escrowId: any;
            relatedUser: any;
            createdAt: Date;
            balance: any;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    allocateToChargebackBuffer(amount: number): Promise<{
        success: boolean;
        message: string;
        newBalance: number;
    }>;
    getSystemLogs(type?: string, level?: string, search?: string, startDate?: Date, endDate?: Date, page?: number, limit?: number): Promise<{
        logs: {
            id: string;
            type: string;
            action: string;
            timestamp: Date;
            userAlias: string;
            userId: string;
            adminId: any;
            metadata: Record<string, any>;
            level: string;
            ipAddress: any;
            userAgent: any;
        }[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    private getLogTypeFromAction;
}
