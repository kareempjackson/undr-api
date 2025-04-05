import { AdminService } from "./admin.service";
import { DisputeResolution, DisputeStatus } from "../../entities/dispute.entity";
import { EscrowStatus } from "../../entities/escrow.entity";
import { UserRole, UserStatus } from "../../entities/user.entity";
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    getAllUsers(search?: string, role?: UserRole, status?: UserStatus, page?: number, limit?: number): Promise<{
        users: import("../../entities/user.entity").User[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getUserDetails(userId: string): Promise<{
        user: import("../../entities/user.entity").User;
        stats: {
            paymentsSent: number;
            paymentsReceived: number;
            disputes: number;
            withdrawals: number;
            deposits: number;
        };
    }>;
    updateUserStatus(userId: string, data: {
        status: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    updateUserRole(userId: string, data: {
        role: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    flagUser(userId: string, data: {
        reason: string;
        details?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    getAllEscrows(status?: EscrowStatus, search?: string, page?: number, limit?: number): Promise<{
        escrows: import("../../entities/escrow.entity").Escrow[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getEscrowDetails(escrowId: string): Promise<{
        escrow: import("../../entities/escrow.entity").Escrow;
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
        disputes: import("../../entities/dispute.entity").Dispute[];
        pagination: {
            total: number;
            page: number;
            limit: number;
            pages: number;
        };
    }>;
    getDisputeDetails(disputeId: string): Promise<{
        dispute: import("../../entities/dispute.entity").Dispute;
    }>;
    resolveDispute(disputeId: string, data: {
        resolution: DisputeResolution;
        notes?: string;
        buyerAmount?: number;
        sellerAmount?: number;
    }): Promise<{
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
    allocateToChargebackBuffer(data: {
        amount: number;
    }): Promise<{
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
    getRevenueAnalytics(timeframe: string): Promise<{
        labels: string[];
        data: any[];
        interval: string;
    }>;
    getUserAnalytics(timeframe: string): Promise<{
        labels: string[];
        datasets: {
            label: string;
            data: any[];
        }[];
        interval: string;
    }>;
    getTransactionAnalytics(timeframe: string): Promise<{
        labels: string[];
        data: any[];
        interval: string;
    }>;
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
}
