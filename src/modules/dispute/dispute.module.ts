import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DisputeService } from "./dispute.service";
import { DisputeController } from "./dispute.controller";
import { DisputeSchedulerService } from "./dispute-scheduler.service";
import { Dispute } from "../../entities/dispute.entity";
import { DisputeEvidence } from "../../entities/dispute-evidence.entity";
import { DisputeMessage } from "../../entities/dispute-message.entity";
import { Escrow } from "../../entities/escrow.entity";
import { User } from "../../entities/user.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Dispute,
      DisputeEvidence,
      DisputeMessage,
      Escrow,
      User,
    ]),
  ],
  controllers: [DisputeController],
  providers: [DisputeService, DisputeSchedulerService],
  exports: [DisputeService],
})
export class DisputeModule {}
