import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PaymentMethod } from "../../entities/payment.entity";
import { v4 as uuidv4 } from "uuid";

@Injectable()
export class CryptoService {
  constructor(private configService: ConfigService) {}

  async createPayment(amount: number, method: PaymentMethod) {
    // In a real implementation, this would integrate with NOWPayments or another crypto payment provider
    // For now, we'll mock the response

    const currency = this.mapPaymentMethodToCurrency(method);
    const exchangeRate = await this.getExchangeRate(currency);
    const cryptoAmount = amount / exchangeRate;

    return {
      id: uuidv4(),
      paymentAddress: this.getMockAddress(method),
      paymentAmount: cryptoAmount.toFixed(8),
      currency: currency,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour expiry
    };
  }

  async handleWebhook(payload: any) {
    // In a real implementation, this would verify and process the webhook from the crypto payment provider
    // For now, we'll assume it's valid and return the data needed to process the payment

    return {
      success: true,
      paymentId: payload.payment_id,
      status: payload.payment_status,
      actualAmount: payload.actually_paid,
      currency: payload.pay_currency,
    };
  }

  private mapPaymentMethodToCurrency(method: PaymentMethod): string {
    switch (method) {
      case PaymentMethod.CRYPTO_BTC:
        return "BTC";
      case PaymentMethod.CRYPTO_ETH:
        return "ETH";
      case PaymentMethod.CRYPTO_USDT:
        return "USDT";
      default:
        return "BTC";
    }
  }

  private async getExchangeRate(currency: string): Promise<number> {
    // In a real implementation, this would fetch the current exchange rate from an API
    // For now, we'll return mock values
    switch (currency) {
      case "BTC":
        return 30000;
      case "ETH":
        return 2000;
      case "USDT":
        return 1;
      default:
        return 1;
    }
  }

  private getMockAddress(method: PaymentMethod): string {
    switch (method) {
      case PaymentMethod.CRYPTO_BTC:
        return "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy";
      case PaymentMethod.CRYPTO_ETH:
        return "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
      case PaymentMethod.CRYPTO_USDT:
        return "TKrjq8gpLKD3WUYv5pNpgDmzQFWbZbfQge";
      default:
        return "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy";
    }
  }
}
