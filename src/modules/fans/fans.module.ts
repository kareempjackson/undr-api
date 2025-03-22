import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FansController } from "./fans.controller";
import { FansService } from "./fans.service";
import { PaymentsModule } from "../payments/payments.module";
import { User, Wallet, Payment, Deposit } from "../../entities";
import { CommonModule } from "../common/common.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Wallet, Payment, Deposit]),
    PaymentsModule,
    CommonModule,
  ],
  controllers: [FansController],
  providers: [FansService],
  exports: [FansService],
})
export class FansModule {}
