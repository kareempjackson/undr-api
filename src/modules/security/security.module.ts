import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import {
  User,
  Payment,
  Wallet,
  Dispute,
  RiskAssessment,
  Escrow,
  EscrowMilestone,
} from "../../entities";
import { RiskAssessmentService } from "./risk-assessment.service";
import { ThreeDsService } from "./three-ds.service";
import { DisputeService } from "./dispute.service";
import { EscrowService } from "./escrow.service";
import { SecurityController } from "./security.controller";
import { ProxyDetectionService } from "./proxy-detection.service";
import { EncryptionService } from "./encryption.service";

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      User,
      Payment,
      Wallet,
      Dispute,
      RiskAssessment,
      Escrow,
      EscrowMilestone,
    ]),
  ],
  providers: [
    RiskAssessmentService,
    ThreeDsService,
    DisputeService,
    EscrowService,
    ProxyDetectionService,
    EncryptionService,
  ],
  controllers: [SecurityController],
  exports: [
    RiskAssessmentService,
    ThreeDsService,
    DisputeService,
    EscrowService,
    ProxyDetectionService,
    EncryptionService,
  ],
})
export class SecurityModule {}
