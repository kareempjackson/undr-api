import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FansController } from "./fans.controller";
import { FansService } from "./fans.service";
import { PaymentsModule } from "../payments/payments.module";
import { User, Wallet, Payment, Deposit } from "../../entities";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Wallet, Payment, Deposit]),
    PaymentsModule,
  ],
  controllers: [FansController],
  providers: [FansService],
  exports: [FansService],
})
export class FansModule {}
