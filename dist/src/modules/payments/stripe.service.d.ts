import { ConfigService } from "@nestjs/config";
import Stripe from "stripe";
export declare class StripeService {
    private configService;
    private stripe;
    private readonly logger;
    constructor(configService: ConfigService);
    createPaymentIntent(amount: number): Promise<{
        id: string;
        client_secret: string;
        payment_method_types: string[];
    }>;
    private getWebhookSecret;
    handleWebhook(payload: any, signature: string): Promise<{
        success: boolean;
        paymentIntentId: string;
        amount: number;
        metadata: Stripe.Metadata;
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
}
