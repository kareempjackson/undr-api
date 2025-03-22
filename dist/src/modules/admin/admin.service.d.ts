import { Repository } from "typeorm";
import { User } from "../../entities/user.entity";
import { Payment } from "../../entities/payment.entity";
export declare class AdminService {
    private userRepository;
    private paymentRepository;
    constructor(userRepository: Repository<User>, paymentRepository: Repository<Payment>);
    getAllUsers(): Promise<User[]>;
    getAllTransactions(): Promise<Payment[]>;
    updateUserStatus(userId: string, status: string): Promise<{
        success: boolean;
        message: string;
    }>;
    updateUserRole(userId: string, role: string): Promise<{
        success: boolean;
        message: string;
    }>;
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
}
