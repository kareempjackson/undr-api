import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Payment, ThreeDsStatus } from "../../entities/payment.entity";
import Stripe from "stripe";

@Injectable()
export class ThreeDsService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private configService: ConfigService
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>("STRIPE_SECRET_KEY"),
      {
        apiVersion: "2022-08-01",
      }
    );
  }

  /**
   * Create a 3DS payment intent with Stripe
   * @param amount Amount in cents
   * @param currency Currency code
   * @param paymentMethodId Stripe payment method ID
   * @param customerId Stripe customer ID
   * @param metadata Additional metadata
   */
  async create3dsPaymentIntent(
    amount: number,
    currency: string,
    paymentMethodId: string,
    customerId?: string,
    metadata?: Record<string, string>
  ): Promise<{
    clientSecret: string;
    requires3ds: boolean;
    paymentIntentId: string;
  }> {
    try {
      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        payment_method: paymentMethodId,
        confirmation_method: "manual",
        confirm: true,
        return_url: `${this.configService.get<string>(
          "FRONTEND_URL"
        )}/payment/confirmation`,
        use_stripe_sdk: true,
        metadata,
      };

      if (customerId) {
        paymentIntentParams.customer = customerId;
      }

      const paymentIntent = await this.stripe.paymentIntents.create(
        paymentIntentParams
      );

      // Check if 3DS is required
      const requires3ds =
        paymentIntent.status === "requires_action" &&
        paymentIntent.next_action?.type === "use_stripe_sdk";

      return {
        clientSecret: paymentIntent.client_secret,
        requires3ds,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error) {
      console.error("Error creating 3DS payment intent:", error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Update payment with 3DS status
   * @param paymentId Payment ID
   * @param threeDsStatus 3DS status
   * @param threeDsUrl 3DS URL
   * @param threeDsResult 3DS result
   */
  async updatePaymentWith3dsStatus(
    paymentId: string,
    threeDsStatus: ThreeDsStatus,
    threeDsUrl?: string,
    threeDsResult?: any
  ): Promise<Payment> {
    const payment = await this.paymentRepository.findOneBy({ id: paymentId });

    if (!payment) {
      throw new Error("Payment not found");
    }

    payment.threeDsStatus = threeDsStatus;

    if (threeDsUrl) {
      payment.threeDsUrl = threeDsUrl;
    }

    if (threeDsResult) {
      payment.threeDsResult = threeDsResult;
    }

    return this.paymentRepository.save(payment);
  }

  /**
   * Check 3DS payment confirmation status
   * @param paymentIntentId Stripe payment intent ID
   */
  async check3dsConfirmationStatus(paymentIntentId: string): Promise<{
    status:
      | "succeeded"
      | "requires_payment_method"
      | "requires_action"
      | "canceled"
      | "processing"
      | "requires_capture";
    threeDsStatus: ThreeDsStatus;
    paymentIntent: Stripe.PaymentIntent;
  }> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        paymentIntentId
      );

      let threeDsStatus = ThreeDsStatus.NOT_REQUIRED;

      if (paymentIntent.status === "succeeded") {
        threeDsStatus = ThreeDsStatus.AUTHENTICATED;
      } else if (paymentIntent.status === "requires_payment_method") {
        threeDsStatus = ThreeDsStatus.FAILED;
      } else if (paymentIntent.status === "requires_action") {
        threeDsStatus = ThreeDsStatus.REQUIRED;
      } else if (paymentIntent.status === "canceled") {
        threeDsStatus = ThreeDsStatus.REJECTED;
      }

      return {
        status: paymentIntent.status as any,
        threeDsStatus,
        paymentIntent,
      };
    } catch (error) {
      console.error("Error checking 3DS confirmation status:", error);
      throw new Error(`Failed to check 3DS status: ${error.message}`);
    }
  }
}
