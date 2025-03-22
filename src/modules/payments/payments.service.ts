import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PaymentMethod } from "../../entities/payment.entity";
import { StripeService } from "./stripe.service";
import { CryptoService } from "./crypto.service";

@Injectable()
export class PaymentsService {
  constructor(
    private configService: ConfigService,
    private stripeService: StripeService,
    private cryptoService: CryptoService
  ) {}

  async createStripePaymentIntent(amount: number) {
    return this.stripeService.createPaymentIntent(amount);
  }

  async createCryptoPayment(amount: number, method: PaymentMethod) {
    return this.cryptoService.createPayment(amount, method);
  }

  async handleStripeWebhook(payload: any, signature: string) {
    return this.stripeService.handleWebhook(payload, signature);
  }

  async handleCryptoWebhook(payload: any) {
    return this.cryptoService.handleWebhook(payload);
  }
}
