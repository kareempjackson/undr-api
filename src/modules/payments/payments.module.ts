import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";
import { StripeService } from "./stripe.service";
import { CryptoService } from "./crypto.service";
import { Deposit } from "../../entities/deposit.entity";
import { User } from "../../entities/user.entity";
import { Wallet } from "../../entities/wallet.entity";

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Deposit, User, Wallet])],
  controllers: [PaymentsController],
  providers: [PaymentsService, StripeService, CryptoService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
