import { ConfigService } from "@nestjs/config";
import { PaymentMethod } from "../../entities/common.enums";
export declare class CryptoService {
    private configService;
    constructor(configService: ConfigService);
    createPayment(amount: number, method: PaymentMethod): Promise<{
        id: string;
        paymentAddress: string;
        paymentAmount: string;
        currency: string;
        expiresAt: string;
    }>;
    handleWebhook(payload: any): Promise<{
        success: boolean;
        paymentId: any;
        status: any;
        actualAmount: any;
        currency: any;
    }>;
    private mapPaymentMethodToCurrency;
    private getExchangeRate;
    private getMockAddress;
}
