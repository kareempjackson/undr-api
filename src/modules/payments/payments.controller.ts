import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  RawBodyRequest,
  Logger,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { PaymentsService } from "./payments.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Deposit, DepositStatus } from "../../entities/deposit.entity";
import { User } from "../../entities/user.entity";
import { Wallet } from "../../entities/wallet.entity";
import { Request } from "express";

@ApiTags("Payments")
@Controller("payments")
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private paymentsService: PaymentsService,
    @InjectRepository(Deposit)
    private depositRepository: Repository<Deposit>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>
  ) {}

  @Post("stripe/webhook")
  @ApiOperation({ summary: "Handle Stripe webhook events" })
  @ApiResponse({ status: 200, description: "Webhook processed successfully" })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("stripe-signature") signature: string
  ) {
    if (!req.rawBody) {
      this.logger.error(
        "No raw body available for Stripe webhook verification"
      );
      return {
        received: false,
        error: "No raw body available",
      };
    }

    try {
      this.logger.log(
        `Processing Stripe webhook with signature: ${signature?.substring(
          0,
          10
        )}...`
      );

      // Process the webhook with raw body and signature
      const event = await this.paymentsService.handleStripeWebhook(
        req.rawBody,
        signature
      );

      if (event.success && event.paymentIntentId) {
        this.logger.log(
          `Processing successful payment intent: ${event.paymentIntentId}`
        );

        // Find the deposit associated with this payment intent
        const deposit = await this.depositRepository.findOne({
          where: { transactionId: event.paymentIntentId },
        });

        if (deposit) {
          this.logger.log(
            `Found deposit: ${deposit.id}, current status: ${
              deposit.status
            }, updating to ${event.success ? "COMPLETED" : "FAILED"}`
          );

          // Update deposit status
          deposit.status = event.success
            ? DepositStatus.COMPLETED
            : DepositStatus.FAILED;

          await this.depositRepository.save(deposit);
          this.logger.log(`Deposit status updated to: ${deposit.status}`);
          console.log("--->>> event", event);
          // If successful, update user wallet balance
          if (event.success) {
            try {
              console.log("---->> inside");
              const user = await this.userRepository.findOne({
                where: { id: deposit.userId },
                relations: ["wallet"],
              });

              if (user && user.wallet) {
                const previousBalance = user.wallet.balance;
                this.logger.log(
                  `Updating wallet balance for user ${user.id}. Current balance: ${previousBalance}, adding: ${deposit.amount}`
                );

                // Update wallet balance
                user.wallet.balance += deposit.amount;
                await this.walletRepository.save(user.wallet);

                this.logger.log(
                  `New wallet balance: ${user.wallet.balance} (was: ${previousBalance})`
                );
              } else {
                this.logger.warn(
                  `Could not find wallet for user ${deposit.userId}`
                );
              }
            } catch (error) {
              console.log("--->> error");
              this.logger.error(
                `Error updating wallet balance: ${error.message}`,
                error.stack
              );
            }
          }
        } else {
          this.logger.warn(
            `No deposit found for payment intent: ${event.paymentIntentId}`
          );
        }
      } else if (!event.success) {
        this.logger.warn(
          `Payment failed or unhandled event type: ${JSON.stringify(event)}`
        );
      }

      return { received: true };
    } catch (err) {
      this.logger.error(`Webhook error: ${err.message}`, err.stack);
      return {
        received: false,
        error: err.message,
      };
    }
  }

  @Post("crypto/webhook")
  @ApiOperation({ summary: "Handle crypto payment webhook events" })
  @ApiResponse({ status: 200, description: "Webhook processed successfully" })
  async handleCryptoWebhook(@Body() payload: any) {
    try {
      this.logger.log("Processing crypto webhook...");

      const event = await this.paymentsService.handleCryptoWebhook(payload);

      // Process similar to stripe webhook
      if (event.success && event.paymentId) {
        const deposit = await this.depositRepository.findOne({
          where: { transactionId: event.paymentId },
        });

        if (deposit) {
          this.logger.log(
            `Found deposit: ${deposit.id}, updating status based on ${event.status}`
          );

          deposit.status =
            event.status === "completed"
              ? DepositStatus.COMPLETED
              : DepositStatus.FAILED;

          await this.depositRepository.save(deposit);

          if (deposit.status === DepositStatus.COMPLETED) {
            const user = await this.userRepository.findOne({
              where: { id: deposit.userId },
              relations: ["wallet"],
            });

            if (user && user.wallet) {
              this.logger.log(
                `Updating wallet balance for user ${user.id} by +${deposit.amount}`
              );

              user.wallet.balance += deposit.amount;
              await this.walletRepository.save(user.wallet);

              this.logger.log(`New wallet balance: ${user.wallet.balance}`);
            } else {
              this.logger.warn(
                `Could not find wallet for user ${deposit.userId}`
              );
            }
          }
        } else {
          this.logger.warn(
            `No deposit found for payment id: ${event.paymentId}`
          );
        }
      }

      return { received: true };
    } catch (err) {
      this.logger.error(`Crypto webhook error: ${err.message}`, err.stack);
      return {
        received: false,
        error: err.message,
      };
    }
  }
}
