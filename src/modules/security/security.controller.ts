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
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { RiskAssessmentService } from "./risk-assessment.service";
import { ThreeDsService } from "./three-ds.service";
import { DisputeService } from "../dispute/dispute.service";
import { EscrowService } from "./escrow.service";
import {
  DisputeStatus,
  DisputeResolution,
} from "../../entities/dispute.entity";
import { EscrowStatus, MilestoneStatus } from "../../entities/escrow.entity";
import { DeliveryProofSubmitDTO, ReviewProofDTO } from "../../dtos/escrow.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";

@ApiTags("Security")
@ApiBearerAuth()
@Controller("security")
@UseGuards(JwtAuthGuard)
export class SecurityController {
  private readonly logger = new Logger(SecurityController.name);

  constructor(
    private readonly riskAssessmentService: RiskAssessmentService,
    private readonly threeDsService: ThreeDsService,
    private readonly disputeService: DisputeService,
    private readonly escrowService: EscrowService
  ) {}

  // Helper method to extract request metadata
  private extractRequestMetadata(req: any): any {
    return {
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      timestamp: new Date().toISOString(),
      userId: req.user?.id,
    };
  }

  // 3D Secure Endpoints
  @ApiOperation({ summary: "Create a 3DS payment intent" })
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

  @ApiOperation({ summary: "Check 3DS payment status" })
  @Get("3ds/check/:paymentIntentId")
  async check3dsStatus(@Param("paymentIntentId") paymentIntentId: string) {
    return this.threeDsService.check3dsConfirmationStatus(paymentIntentId);
  }

  // Risk Assessment Endpoints
  @ApiOperation({ summary: "Assess transaction risk" })
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

  @ApiOperation({ summary: "Get pending risk reviews" })
  @Get("risk/reviews")
  async getPendingRiskReviews() {
    return this.riskAssessmentService.getPendingReviews();
  }

  @ApiOperation({ summary: "Review a risk assessment" })
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
  @ApiOperation({ summary: "Create a dispute for an escrow" })
  async createDispute(@Body() body, @Request() req) {
    try {
      const { escrowId, reason, details } = body;
      const { userId } = req.user;

      return await this.disputeService.createDispute({
        escrowId,
        createdById: userId,
        reason,
        details: details || {},
      });
    } catch (error) {
      this.logger.error(
        `Error creating dispute: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Post("disputes/:id/evidence")
  @ApiOperation({ summary: "Add evidence to a dispute" })
  async addDisputeEvidence(
    @Param("id") id: string,
    @Body() body,
    @Request() req
  ) {
    try {
      const { type, description, files } = body;
      const { userId } = req.user;

      return await this.disputeService.submitEvidence({
        disputeId: id,
        submittedById: userId,
        type,
        description,
        files: files || [],
      });
    } catch (error) {
      this.logger.error(
        `Error adding dispute evidence: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Post("disputes/:id/resolve")
  @ApiOperation({ summary: "Resolve a dispute" })
  async resolveDispute(@Param("id") id: string, @Body() body, @Request() req) {
    try {
      const { resolution, buyerAmount, sellerAmount, details } = body;
      const { userId } = req.user;

      return await this.disputeService.resolveDisputeByAdmin({
        disputeId: id,
        reviewedById: userId,
        resolution,
        buyerAmount,
        sellerAmount,
        notes: details?.notes || "",
      });
    } catch (error) {
      this.logger.error(
        `Error resolving dispute: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Get("disputes")
  @ApiOperation({ summary: "Get disputes" })
  async getDisputes(@Query() query, @Request() req) {
    try {
      const { status } = query;
      const { userId } = req.user;

      return await this.disputeService.getDisputesForUser(userId, status);
    } catch (error) {
      this.logger.error(
        `Error getting disputes: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Get("disputes/:id")
  @ApiOperation({ summary: "Get dispute by ID" })
  async getDisputeById(@Param("id") id: string, @Request() req) {
    try {
      return await this.disputeService.getDisputeDetails(id, req.user.userId);
    } catch (error) {
      this.logger.error(`Error getting dispute: ${error.message}`, error.stack);
      throw error;
    }
  }

  // Escrow Endpoints
  @ApiOperation({ summary: "Create an escrow agreement" })
  @ApiResponse({ status: 201, description: "Escrow created successfully" })
  @Post("escrows")
  async createEscrow(@Body() body, @Request() req) {
    try {
      const {
        title,
        description,
        totalAmount,
        sellerId,
        expirationDays,
        milestones,
        terms,
        documents,
      } = body;

      const requestMetadata = this.extractRequestMetadata(req);

      return this.escrowService.createEscrow(
        {
          title,
          description,
          totalAmount,
          buyerId: req.user.id,
          sellerId,
          expirationDays,
          milestones,
          terms,
          documents,
        },
        requestMetadata
      );
    } catch (error) {
      this.logger.error(`Error creating escrow: ${error.message}`, error.stack);
      throw error;
    }
  }

  @ApiOperation({ summary: "Fund an escrow" })
  @ApiResponse({ status: 200, description: "Escrow funded successfully" })
  @Post("escrows/:id/fund")
  async fundEscrow(@Param("id") id: string, @Request() req) {
    const requestMetadata = this.extractRequestMetadata(req);
    return this.escrowService.fundEscrow(id, req.user.id, requestMetadata);
  }

  @ApiOperation({ summary: "Submit delivery proof for an escrow" })
  @ApiResponse({ status: 201, description: "Proof submitted successfully" })
  @Post("escrows/:id/proof")
  async submitDeliveryProof(
    @Param("id") id: string,
    @Body() data: DeliveryProofSubmitDTO,
    @Request() req
  ) {
    const requestMetadata = this.extractRequestMetadata(req);
    return this.escrowService.submitDeliveryProof(
      id,
      data,
      req.user.id,
      requestMetadata
    );
  }

  @ApiOperation({ summary: "Get proofs for an escrow" })
  @ApiResponse({ status: 200, description: "Proofs retrieved successfully" })
  @Get("escrows/:id/proofs")
  async getEscrowProofs(@Param("id") id: string, @Request() req) {
    // First check if user has access to this escrow
    const escrow = await this.escrowService.getEscrowById(id);
    if (escrow.buyerId !== req.user.id && escrow.sellerId !== req.user.id) {
      throw new ForbiddenException("You do not have access to this escrow");
    }

    return this.escrowService.getEscrowProofs(id);
  }

  @ApiOperation({ summary: "Review a submitted proof" })
  @ApiResponse({ status: 200, description: "Proof reviewed successfully" })
  @Patch("escrows/proofs/:proofId")
  async reviewDeliveryProof(
    @Param("proofId") proofId: string,
    @Body() data: ReviewProofDTO,
    @Request() req
  ) {
    const requestMetadata = this.extractRequestMetadata(req);
    return this.escrowService.reviewDeliveryProof(
      proofId,
      data.decision,
      req.user.id,
      data.rejectionReason,
      requestMetadata
    );
  }

  @ApiOperation({ summary: "Update a milestone" })
  @ApiResponse({ status: 200, description: "Milestone updated successfully" })
  @Patch("escrows/:escrowId/milestones/:milestoneId")
  async updateMilestone(
    @Param("escrowId") escrowId: string,
    @Param("milestoneId") milestoneId: string,
    @Body() body,
    @Request() req
  ) {
    const { status } = body;
    const requestMetadata = this.extractRequestMetadata(req);

    return this.escrowService.updateMilestone(
      {
        escrowId,
        milestoneId,
        status,
        userId: req.user.id,
      },
      requestMetadata
    );
  }

  @ApiOperation({ summary: "Complete an escrow" })
  @ApiResponse({ status: 200, description: "Escrow completed successfully" })
  @Post("escrows/:id/complete")
  async completeEscrow(@Param("id") id: string, @Request() req) {
    // First check if user has access to complete this escrow
    const escrow = await this.escrowService.getEscrowById(id);
    if (escrow.buyerId !== req.user.id) {
      throw new ForbiddenException(
        "Only the buyer can manually complete an escrow"
      );
    }

    return this.escrowService.completeEscrow(id);
  }

  @ApiOperation({ summary: "Cancel an escrow" })
  @ApiResponse({ status: 200, description: "Escrow cancelled successfully" })
  @Post("escrows/:id/cancel")
  async cancelEscrow(@Param("id") id: string, @Request() req) {
    const requestMetadata = this.extractRequestMetadata(req);
    return this.escrowService.cancelEscrow(id, req.user.id, requestMetadata);
  }

  @ApiOperation({ summary: "Get user's escrows" })
  @ApiResponse({ status: 200, description: "Escrows retrieved successfully" })
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

  @ApiOperation({ summary: "Get an escrow by ID" })
  @ApiResponse({ status: 200, description: "Escrow retrieved successfully" })
  @Get("escrows/:id")
  async getEscrowById(@Param("id") id: string, @Request() req) {
    const escrow = await this.escrowService.getEscrowById(id);

    // Check if user has access to this escrow
    if (escrow.buyerId !== req.user.id && escrow.sellerId !== req.user.id) {
      throw new ForbiddenException("You do not have access to this escrow");
    }

    return escrow;
  }
}
