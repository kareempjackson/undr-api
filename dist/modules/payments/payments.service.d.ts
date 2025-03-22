import { ConfigService } from "@nestjs/config";
import { PaymentMethod } from "../../entities/payment.entity";
import { StripeService } from "./stripe.service";
import { CryptoService } from "./crypto.service";
export declare class PaymentsService {
    private configService;
    private stripeService;
    private cryptoService;
    constructor(configService: ConfigService, stripeService: StripeService, cryptoService: CryptoService);
    createStripePaymentIntent(amount: number): Promise<{
        id: string;
        client_secret: string;
        payment_method_types: string[];
    }>;
    createCryptoPayment(amount: number, method: PaymentMethod): Promise<{
        id: string;
        paymentAddress: string;
        paymentAmount: string;
        currency: string;
        expiresAt: string;
    }>;
    handleStripeWebhook(payload: any, signature: string): Promise<{
        success: boolean;
        paymentIntentId: string;
        amount: number;
        metadata: import("stripe").Stripe.Metadata;
        errorMessage?: undefined;
        sessionId?: undefined;
        unhandled?: undefined;
        eventType?: undefined;
        bypassedWebhookVerification?: undefined;
    } | {
        success: boolean;
        paymentIntentId: string;
        errorMessage: string;
        amount?: undefined;
        metadata?: undefined;
        sessionId?: undefined;
        unhandled?: undefined;
        eventType?: undefined;
        bypassedWebhookVerification?: undefined;
    } | {
        success: boolean;
        sessionId: string;
        paymentIntentId?: undefined;
        amount?: undefined;
        metadata?: undefined;
        errorMessage?: undefined;
        unhandled?: undefined;
        eventType?: undefined;
        bypassedWebhookVerification?: undefined;
    } | {
        success: boolean;
        unhandled: boolean;
        eventType: string;
        paymentIntentId?: undefined;
        amount?: undefined;
        metadata?: undefined;
        errorMessage?: undefined;
        sessionId?: undefined;
        bypassedWebhookVerification?: undefined;
    } | {
        success: boolean;
        paymentIntentId: any;
        amount: number;
        bypassedWebhookVerification: boolean;
        metadata?: undefined;
        errorMessage?: undefined;
        sessionId?: undefined;
        unhandled?: undefined;
        eventType?: undefined;
    }>;
    handleCryptoWebhook(payload: any): Promise<{
        success: boolean;
        paymentId: any;
        status: any;
        actualAmount: any;
        currency: any;
    }>;
}
