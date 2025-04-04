import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { Withdrawal } from "../../entities/withdrawal.entity";
import { User } from "../../entities/user.entity";
import { Wallet } from "../../entities/wallet.entity";
import { WithdrawalsService } from "./withdrawals.service";
import { WithdrawalsController } from "./withdrawals.controller";

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([Withdrawal, User, Wallet])],
  controllers: [WithdrawalsController],
  providers: [WithdrawalsService],
  exports: [WithdrawalsService],
})
export class WithdrawalsModule {}
