import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import { Payment, ThreeDsStatus } from "../../entities/payment.entity";
import Stripe from "stripe";
export declare class ThreeDsService {
    private paymentRepository;
    private configService;
    private stripe;
    constructor(paymentRepository: Repository<Payment>, configService: ConfigService);
    create3dsPaymentIntent(amount: number, currency: string, paymentMethodId: string, customerId?: string, metadata?: Record<string, string>): Promise<{
        clientSecret: string;
        requires3ds: boolean;
        paymentIntentId: string;
    }>;
    updatePaymentWith3dsStatus(paymentId: string, threeDsStatus: ThreeDsStatus, threeDsUrl?: string, threeDsResult?: any): Promise<Payment>;
    check3dsConfirmationStatus(paymentIntentId: string): Promise<{
        status: "succeeded" | "requires_payment_method" | "requires_action" | "canceled" | "processing" | "requires_capture";
        threeDsStatus: ThreeDsStatus;
        paymentIntent: Stripe.PaymentIntent;
    }>;
}
