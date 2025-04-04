import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { DisputeService } from "./dispute.service";
import {
  Dispute,
  DisputeStatus,
  DisputeResolution,
} from "../../entities/dispute.entity";
import {
  DisputeEvidence,
  EvidenceType,
} from "../../entities/dispute-evidence.entity";
import { DisputeMessage } from "../../entities/dispute-message.entity";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from "@nestjs/swagger";

class CreateDisputeDto {
  escrowId: string;
  reason: string;
  details?: any;
}

class SubmitEvidenceDto {
  type: EvidenceType;
  description: string;
  files?: any[];
}

class SendMessageDto {
  message: string;
  metadata?: any;
}

class ProposeResolutionDto {
  resolution: DisputeResolution;
  buyerAmount?: number;
  sellerAmount?: number;
  details?: any;
}

class AdminResolveDisputeDto {
  resolution: DisputeResolution;
  buyerAmount?: number;
  sellerAmount?: number;
  notes?: string;
}

@ApiTags("disputes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("security/disputes")
export class DisputeController {
  constructor(private readonly disputeService: DisputeService) {}

  /**
   * Create a new dispute for an escrow
   */
  @Post()
  @ApiOperation({ summary: "Create a new dispute for an escrow" })
  @ApiResponse({ status: 201, description: "Dispute created successfully" })
  @ApiResponse({ status: 400, description: "Invalid request" })
  @ApiResponse({
    status: 403,
    description: "User is not a participant in the escrow",
  })
  @ApiResponse({ status: 404, description: "Escrow not found" })
  @ApiBody({ type: CreateDisputeDto })
  async createDispute(
    @Request() req,
    @Body() createDisputeDto: CreateDisputeDto
  ): Promise<Dispute> {
    const userId = req.user.userId;

    return this.disputeService.createDispute(
      {
        escrowId: createDisputeDto.escrowId,
        createdById: userId,
        reason: createDisputeDto.reason,
        details: createDisputeDto.details,
      },
      req.headers
    );
  }

  /**
   * Submit evidence for a dispute
   */
  @Post(":disputeId/evidence")
  @ApiOperation({ summary: "Submit evidence for a dispute" })
  @ApiResponse({ status: 201, description: "Evidence submitted successfully" })
  @ApiResponse({
    status: 400,
    description: "Invalid request or deadline passed",
  })
  @ApiResponse({
    status: 403,
    description: "User is not a participant in the dispute",
  })
  @ApiResponse({ status: 404, description: "Dispute not found" })
  @ApiParam({ name: "disputeId", description: "The ID of the dispute" })
  @ApiBody({ type: SubmitEvidenceDto })
  async submitEvidence(
    @Request() req,
    @Param("disputeId") disputeId: string,
    @Body() submitEvidenceDto: SubmitEvidenceDto
  ): Promise<DisputeEvidence> {
    const userId = req.user.userId;

    return this.disputeService.submitEvidence(
      {
        disputeId,
        submittedById: userId,
        type: submitEvidenceDto.type,
        description: submitEvidenceDto.description,
        files: submitEvidenceDto.files,
      },
      req.headers
    );
  }

  /**
   * Send a message in a dispute
   */
  @Post(":disputeId/messages")
  @ApiOperation({ summary: "Send a message in a dispute" })
  @ApiResponse({ status: 201, description: "Message sent successfully" })
  @ApiResponse({
    status: 403,
    description: "User is not a participant in the dispute",
  })
  @ApiResponse({ status: 404, description: "Dispute not found" })
  @ApiParam({ name: "disputeId", description: "The ID of the dispute" })
  @ApiBody({ type: SendMessageDto })
  async sendMessage(
    @Request() req,
    @Param("disputeId") disputeId: string,
    @Body() sendMessageDto: SendMessageDto
  ): Promise<DisputeMessage> {
    const userId = req.user.userId;

    return this.disputeService.sendMessage({
      disputeId,
      senderId: userId,
      message: sendMessageDto.message,
      metadata: sendMessageDto.metadata,
    });
  }

  /**
   * Propose a resolution for a dispute
   */
  @Post(":disputeId/propose-resolution")
  @ApiOperation({ summary: "Propose a resolution for a dispute" })
  @ApiResponse({ status: 200, description: "Resolution proposed successfully" })
  @ApiResponse({ status: 400, description: "Invalid request" })
  @ApiResponse({
    status: 403,
    description: "User is not a participant in the dispute",
  })
  @ApiResponse({ status: 404, description: "Dispute not found" })
  @ApiParam({ name: "disputeId", description: "The ID of the dispute" })
  @ApiBody({ type: ProposeResolutionDto })
  async proposeResolution(
    @Request() req,
    @Param("disputeId") disputeId: string,
    @Body() proposeResolutionDto: ProposeResolutionDto
  ): Promise<Dispute> {
    const userId = req.user.userId;

    return this.disputeService.proposeResolution(
      {
        disputeId,
        proposedById: userId,
        resolution: proposeResolutionDto.resolution,
        buyerAmount: proposeResolutionDto.buyerAmount,
        sellerAmount: proposeResolutionDto.sellerAmount,
        details: proposeResolutionDto.details,
      },
      req.headers
    );
  }

  /**
   * Accept a proposed resolution
   */
  @Post(":disputeId/accept-resolution")
  @ApiOperation({ summary: "Accept a proposed resolution" })
  @ApiResponse({ status: 200, description: "Resolution accepted successfully" })
  @ApiResponse({
    status: 400,
    description: "Invalid request or no active proposal",
  })
  @ApiResponse({
    status: 403,
    description: "User is not a participant in the dispute",
  })
  @ApiResponse({ status: 404, description: "Dispute not found" })
  @ApiParam({ name: "disputeId", description: "The ID of the dispute" })
  async acceptResolution(
    @Request() req,
    @Param("disputeId") disputeId: string
  ): Promise<Dispute> {
    const userId = req.user.userId;

    return this.disputeService.acceptResolution(disputeId, userId);
  }

  /**
   * Admin resolves a dispute
   * TODO: Add admin role check guard
   */
  @Post(":disputeId/admin-resolve")
  @ApiOperation({ summary: "Administratively resolve a dispute (admin only)" })
  @ApiResponse({ status: 200, description: "Dispute resolved successfully" })
  @ApiResponse({ status: 400, description: "Invalid request" })
  @ApiResponse({ status: 403, description: "User is not an admin" })
  @ApiResponse({ status: 404, description: "Dispute not found" })
  @ApiParam({ name: "disputeId", description: "The ID of the dispute" })
  @ApiBody({ type: AdminResolveDisputeDto })
  async resolveDisputeByAdmin(
    @Request() req,
    @Param("disputeId") disputeId: string,
    @Body() resolveDto: AdminResolveDisputeDto
  ): Promise<Dispute> {
    const userId = req.user.userId;

    // TODO: Check if user has admin role
    // This is placeholder for now
    const isAdmin = false;
    if (!isAdmin) {
      throw new ForbiddenException("Only administrators can resolve disputes");
    }

    return this.disputeService.resolveDisputeByAdmin({
      disputeId,
      reviewedById: userId,
      resolution: resolveDto.resolution,
      buyerAmount: resolveDto.buyerAmount,
      sellerAmount: resolveDto.sellerAmount,
      notes: resolveDto.notes,
    });
  }

  /**
   * Get dispute details by ID
   */
  @Get(":disputeId")
  @ApiOperation({ summary: "Get dispute details by ID" })
  @ApiResponse({ status: 200, description: "Returns dispute details" })
  @ApiResponse({
    status: 403,
    description: "User is not authorized to view this dispute",
  })
  @ApiResponse({ status: 404, description: "Dispute not found" })
  @ApiParam({ name: "disputeId", description: "The ID of the dispute" })
  async getDisputeDetails(
    @Request() req,
    @Param("disputeId") disputeId: string
  ): Promise<any> {
    const userId = req.user.userId;

    return this.disputeService.getDisputeDetails(disputeId, userId);
  }

  /**
   * Get all disputes for the authenticated user
   */
  @Get()
  @ApiOperation({ summary: "Get all disputes for the authenticated user" })
  @ApiResponse({ status: 200, description: "Returns list of disputes" })
  @ApiQuery({ name: "status", enum: DisputeStatus, required: false })
  async getDisputesForUser(
    @Request() req,
    @Query("status") status?: DisputeStatus
  ): Promise<Dispute[]> {
    const userId = req.user.userId;

    return this.disputeService.getDisputesForUser(userId, status);
  }

  /**
   * Get all evidence for a dispute
   */
  @Get(":disputeId/evidence")
  @ApiOperation({ summary: "Get all evidence for a dispute" })
  @ApiResponse({ status: 200, description: "Returns list of evidence" })
  @ApiResponse({
    status: 403,
    description: "User is not authorized to view this dispute",
  })
  @ApiResponse({ status: 404, description: "Dispute not found" })
  @ApiParam({ name: "disputeId", description: "The ID of the dispute" })
  async getEvidenceForDispute(
    @Request() req,
    @Param("disputeId") disputeId: string
  ): Promise<DisputeEvidence[]> {
    const userId = req.user.userId;

    return this.disputeService.getEvidenceForDispute(disputeId, userId);
  }

  /**
   * Get all messages for a dispute
   */
  @Get(":disputeId/messages")
  @ApiOperation({ summary: "Get all messages for a dispute" })
  @ApiResponse({ status: 200, description: "Returns list of messages" })
  @ApiResponse({
    status: 403,
    description: "User is not authorized to view this dispute",
  })
  @ApiResponse({ status: 404, description: "Dispute not found" })
  @ApiParam({ name: "disputeId", description: "The ID of the dispute" })
  async getMessagesForDispute(
    @Request() req,
    @Param("disputeId") disputeId: string
  ): Promise<DisputeMessage[]> {
    const userId = req.user.userId;

    return this.disputeService.getMessagesForDispute(disputeId, userId);
  }
}
