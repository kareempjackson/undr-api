import { CreatorsService } from "./creators.service";
export declare class CreatorsController {
    private creatorsService;
    constructor(creatorsService: CreatorsService);
    getDashboard(req: any): Promise<{
        balance: number;
        totalEarnings: number;
        paymentCount: number;
        recentTransactions: import("../../entities").Payment[];
    }>;
    getEarnings(req: any): Promise<{
        earningsByMonth: {};
        totalEarnings: number;
        transactionCount: number;
    }>;
    getPaymentLink(req: any): Promise<{
        alias: string;
        paymentUrl: string;
        apiEndpoint: string;
    }>;
    getPaymentLinkByAlias(alias: string): Promise<{
        alias: string;
        paymentUrl: string;
        apiEndpoint: string;
    }>;
    testGetPaymentLinkByAlias(alias: string): Promise<{
        alias: string;
        paymentUrl: string;
        apiEndpoint: string;
    }>;
}
