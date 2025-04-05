import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import {
  User,
  Payment,
  Dispute,
  Escrow,
  Wallet,
  DisputeEvidence,
  DisputeMessage,
  Withdrawal,
  Deposit,
  TransactionLog,
} from "../../entities";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Payment,
      Dispute,
      Escrow,
      Wallet,
      DisputeEvidence,
      DisputeMessage,
      Withdrawal,
      Deposit,
      TransactionLog,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
