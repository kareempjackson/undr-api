import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { RiskAssessmentService } from "./risk-assessment.service";
import { ThreeDsService } from "./three-ds.service";
import { DisputeService } from "./dispute.service";
import { EscrowService } from "./escrow.service";
import { DisputeStatus, DisputeReason } from "../../entities/dispute.entity";
import { EscrowStatus, MilestoneStatus } from "../../entities/escrow.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@Controller("security")
@UseGuards(JwtAuthGuard)
export class SecurityController {
  constructor(
    private readonly riskAssessmentService: RiskAssessmentService,
    private readonly threeDsService: ThreeDsService,
    private readonly disputeService: DisputeService,
    private readonly escrowService: EscrowService
  ) {}

  // 3D Secure Endpoints
  @Post("3ds/create-intent")
  async create3dsIntent(@Body() body, @Request() req) {
    const { amount, currency, paymentMethodId, customerId, metadata } = body;
    return this.threeDsService.create3dsPaymentIntent(
      amount,
      currency,
      paymentMethodId,
      customerId,
      metadata
    );
  }

  @Get("3ds/check/:paymentIntentId")
  async check3dsStatus(@Param("paymentIntentId") paymentIntentId: string) {
    return this.threeDsService.check3dsConfirmationStatus(paymentIntentId);
  }

  // Risk Assessment Endpoints
  @Post("risk/assess")
  async assessRisk(@Body() body, @Request() req) {
    const { paymentId, amount, ipAddress, deviceInfo, location } = body;
    return this.riskAssessmentService.assessTransactionRisk(
      req.user.id,
      paymentId,
      amount,
      ipAddress,
      deviceInfo,
      location
    );
  }

  @Get("risk/reviews")
  async getPendingRiskReviews() {
    return this.riskAssessmentService.getPendingReviews();
  }

  @Patch("risk/review/:id")
  async reviewRiskAssessment(
    @Param("id") id: string,
    @Body() body,
    @Request() req
  ) {
    const { approved, notes } = body;
    return this.riskAssessmentService.reviewRiskAssessment(
      id,
      req.user.id,
      approved,
      notes
    );
  }

  // Dispute Endpoints
  @Post("disputes")
  async createDispute(@Body() body, @Request() req) {
    const { paymentId, reason, description, evidenceFiles } = body;
    return this.disputeService.createDispute({
      paymentId,
      filedByUserId: req.user.id,
      reason,
      description,
      evidenceFiles,
    });
  }

  @Post("disputes/:id/evidence")
  async addDisputeEvidence(
    @Param("id") id: string,
    @Body() body,
    @Request() req
  ) {
    const { description, files } = body;
    return this.disputeService.addEvidence(id, req.user.id, {
      description,
      files,
    });
  }

  @Patch("disputes/:id/resolve")
  async resolveDispute(@Param("id") id: string, @Body() body, @Request() req) {
    const { resolveForCustomer, resolutionNotes } = body;
    return this.disputeService.resolveDispute({
      disputeId: id,
      resolvedByUserId: req.user.id,
      resolveForCustomer,
      resolutionNotes,
    });
  }

  @Get("disputes")
  async getDisputes(@Query() query, @Request() req) {
    const { status, limit, offset } = query;
    return this.disputeService.getDisputes({
      status,
      userId: req.user.id,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  @Get("disputes/:id")
  async getDisputeById(@Param("id") id: string) {
    return this.disputeService.getDisputeById(id);
  }

  // Escrow Endpoints
  @Post("escrows")
  async createEscrow(@Body() body, @Request() req) {
    const {
      title,
      description,
      totalAmount,
      sellerId,
      expirationDays,
      milestones,
      terms,
    } = body;
    return this.escrowService.createEscrow({
      title,
      description,
      totalAmount,
      buyerId: req.user.id,
      sellerId,
      expirationDays,
      milestones,
      terms,
    });
  }

  @Post("escrows/:id/fund")
  async fundEscrow(@Param("id") id: string, @Request() req) {
    return this.escrowService.fundEscrow(id, req.user.id);
  }

  @Patch("escrows/:escrowId/milestones/:milestoneId")
  async updateMilestone(
    @Param("escrowId") escrowId: string,
    @Param("milestoneId") milestoneId: string,
    @Body() body,
    @Request() req
  ) {
    const { status } = body;
    return this.escrowService.updateMilestone({
      escrowId,
      milestoneId,
      status,
      userId: req.user.id,
    });
  }

  @Post("escrows/:id/complete")
  async completeEscrow(@Param("id") id: string) {
    return this.escrowService.completeEscrow(id);
  }

  @Post("escrows/:id/cancel")
  async cancelEscrow(@Param("id") id: string, @Request() req) {
    return this.escrowService.cancelEscrow(id, req.user.id);
  }

  @Get("escrows")
  async getEscrows(@Query() query, @Request() req) {
    const { status, limit, offset } = query;
    return this.escrowService.getEscrowsByUser(
      req.user.id,
      status,
      limit ? parseInt(limit) : undefined,
      offset ? parseInt(offset) : undefined
    );
  }

  @Get("escrows/:id")
  async getEscrowById(@Param("id") id: string) {
    return this.escrowService.getEscrowById(id);
  }
}
