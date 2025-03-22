import { AdminService } from "./admin.service";
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    getAllUsers(): Promise<import("../../entities").User[]>;
    getAllTransactions(): Promise<import("../../entities").Payment[]>;
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
