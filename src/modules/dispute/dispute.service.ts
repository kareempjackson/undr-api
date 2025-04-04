import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
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
import { Escrow, EscrowStatus } from "../../entities/escrow.entity";
import { User } from "../../entities/user.entity";

interface CreateDisputeParams {
  escrowId: string;
  createdById: string;
  reason: string;
  details?: any;
}

interface SubmitEvidenceParams {
  disputeId: string;
  submittedById: string;
  type: EvidenceType;
  description: string;
  files?: any[];
}

interface SendMessageParams {
  disputeId: string;
  senderId: string;
  message: string;
  isSystemMessage?: boolean;
  metadata?: any;
}

interface ProposeResolutionParams {
  disputeId: string;
  proposedById: string;
  resolution: DisputeResolution;
  buyerAmount?: number;
  sellerAmount?: number;
  details?: any;
}

interface ResolveDisputeParams {
  disputeId: string;
  reviewedById: string;
  resolution: DisputeResolution;
  buyerAmount?: number;
  sellerAmount?: number;
  notes?: string;
}

@Injectable()
export class DisputeService {
  private readonly logger = new Logger(DisputeService.name);

  constructor(
    @InjectRepository(Dispute)
    private disputeRepository: Repository<Dispute>,
    @InjectRepository(DisputeEvidence)
    private evidenceRepository: Repository<DisputeEvidence>,
    @InjectRepository(DisputeMessage)
    private messageRepository: Repository<DisputeMessage>,
    @InjectRepository(Escrow)
    private escrowRepository: Repository<Escrow>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private dataSource: DataSource
  ) {}

  /**
   * Create a new dispute for an escrow
   */
  async createDispute(
    params: CreateDisputeParams,
    requestMetadata?: any
  ): Promise<Dispute> {
    const { escrowId, createdById, reason, details } = params;

    return this.dataSource.transaction(async (manager) => {
      // Get the escrow and ensure it exists
      const escrow = await manager.findOne(Escrow, {
        where: { id: escrowId },
        relations: ["buyer", "seller"],
      });

      if (!escrow) {
        throw new NotFoundException(`Escrow with ID ${escrowId} not found`);
      }

      // Ensure escrow is in a valid state for dispute
      if (
        escrow.status === EscrowStatus.COMPLETED ||
        escrow.status === EscrowStatus.CANCELLED ||
        escrow.status === EscrowStatus.DISPUTED
      ) {
        throw new BadRequestException(
          `Cannot create dispute for escrow with status ${escrow.status}`
        );
      }

      // Verify user is either buyer or seller
      if (escrow.buyerId !== createdById && escrow.sellerId !== createdById) {
        throw new ForbiddenException(
          `User ${createdById} is not a participant in this escrow`
        );
      }

      // Set escrow status to DISPUTED
      await manager.update(Escrow, escrowId, { status: EscrowStatus.DISPUTED });

      // Create the dispute
      const dispute = new Dispute();
      dispute.escrowId = escrowId;
      dispute.createdById = createdById;
      dispute.reason = reason;
      dispute.details = details || {};

      // Set evidence submission deadline (5 days from now)
      const evidenceDeadline = new Date();
      evidenceDeadline.setDate(evidenceDeadline.getDate() + 5);
      dispute.evidenceDeadline = evidenceDeadline;

      // Set initial status
      dispute.status = DisputeStatus.EVIDENCE_SUBMISSION;

      // Add metadata if provided
      if (requestMetadata) {
        dispute.metadata = {
          ...dispute.metadata,
          requestMetadata,
        };
      }

      // Save the dispute
      const savedDispute = await manager.save(Dispute, dispute);

      // Create system message about dispute creation
      const systemMessage = new DisputeMessage();
      systemMessage.disputeId = savedDispute.id;
      systemMessage.senderId = createdById;
      systemMessage.message = `Dispute created. Evidence submission deadline: ${evidenceDeadline.toISOString()}`;
      systemMessage.isSystemMessage = true;

      await manager.save(DisputeMessage, systemMessage);

      // Return the created dispute
      return savedDispute;
    });
  }

  /**
   * Submit evidence for a dispute
   */
  async submitEvidence(
    params: SubmitEvidenceParams,
    requestMetadata?: any
  ): Promise<DisputeEvidence> {
    const { disputeId, submittedById, type, description, files } = params;

    return this.dataSource.transaction(async (manager) => {
      // Get the dispute and ensure it exists
      const dispute = await manager.findOne(Dispute, {
        where: { id: disputeId },
        relations: ["escrow"],
      });

      if (!dispute) {
        throw new NotFoundException(`Dispute with ID ${disputeId} not found`);
      }

      // Verify dispute is in evidence submission phase
      if (dispute.status !== DisputeStatus.EVIDENCE_SUBMISSION) {
        throw new BadRequestException(
          `Cannot submit evidence for dispute with status ${dispute.status}`
        );
      }

      // Check if evidence deadline has passed
      if (dispute.evidenceDeadline && new Date() > dispute.evidenceDeadline) {
        throw new BadRequestException(
          "Evidence submission deadline has passed"
        );
      }

      // Verify user is a participant in the escrow
      const escrow = dispute.escrow;
      if (
        escrow.buyerId !== submittedById &&
        escrow.sellerId !== submittedById
      ) {
        throw new ForbiddenException(
          `User ${submittedById} is not a participant in this dispute`
        );
      }

      // Create the evidence
      const evidence = new DisputeEvidence();
      evidence.disputeId = disputeId;
      evidence.submittedById = submittedById;
      evidence.type = type;
      evidence.description = description;
      evidence.files = files || [];

      // Add metadata if provided
      if (requestMetadata) {
        evidence.metadata = {
          ...evidence.metadata,
          requestMetadata,
        };
      }

      // Save the evidence
      const savedEvidence = await manager.save(DisputeEvidence, evidence);

      // Create system message about evidence submission
      const systemMessage = new DisputeMessage();
      systemMessage.disputeId = disputeId;
      systemMessage.senderId = submittedById;
      systemMessage.message = `Evidence of type ${type} submitted.`;
      systemMessage.isSystemMessage = true;

      await manager.save(DisputeMessage, systemMessage);

      return savedEvidence;
    });
  }

  /**
   * Send a message in a dispute
   */
  async sendMessage(params: SendMessageParams): Promise<DisputeMessage> {
    const { disputeId, senderId, message, isSystemMessage, metadata } = params;

    // Check if dispute exists
    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId },
      relations: ["escrow"],
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute with ID ${disputeId} not found`);
    }

    // For non-system messages, verify sender is a participant
    if (!isSystemMessage) {
      const escrow = dispute.escrow;
      if (escrow.buyerId !== senderId && escrow.sellerId !== senderId) {
        throw new ForbiddenException(
          `User ${senderId} is not a participant in this dispute`
        );
      }
    }

    // Create and save the message
    const disputeMessage = new DisputeMessage();
    disputeMessage.disputeId = disputeId;
    disputeMessage.senderId = senderId;
    disputeMessage.message = message;
    disputeMessage.isSystemMessage = isSystemMessage || false;
    disputeMessage.metadata = metadata;

    return this.messageRepository.save(disputeMessage);
  }

  /**
   * Propose a resolution for a dispute
   */
  async proposeResolution(
    params: ProposeResolutionParams,
    requestMetadata?: any
  ): Promise<Dispute> {
    const {
      disputeId,
      proposedById,
      resolution,
      buyerAmount,
      sellerAmount,
      details,
    } = params;

    return this.dataSource.transaction(async (manager) => {
      // Get the dispute and ensure it exists
      const dispute = await manager.findOne(Dispute, {
        where: { id: disputeId },
        relations: ["escrow"],
      });

      if (!dispute) {
        throw new NotFoundException(`Dispute with ID ${disputeId} not found`);
      }

      // Verify dispute is still active
      if (
        dispute.status === DisputeStatus.CLOSED ||
        dispute.status === DisputeStatus.MUTUALLY_RESOLVED ||
        dispute.status === DisputeStatus.RESOLVED_BY_ADMIN ||
        dispute.status === DisputeStatus.EXPIRED
      ) {
        throw new BadRequestException(
          `Cannot propose resolution for dispute with status ${dispute.status}`
        );
      }

      // Verify user is a participant
      const escrow = dispute.escrow;
      if (escrow.buyerId !== proposedById && escrow.sellerId !== proposedById) {
        throw new ForbiddenException(
          `User ${proposedById} is not a participant in this dispute`
        );
      }

      // Validate amounts
      const totalAmount = escrow.totalAmount;

      if (
        buyerAmount !== undefined &&
        sellerAmount !== undefined &&
        Number(buyerAmount) + Number(sellerAmount) !== Number(totalAmount)
      ) {
        throw new BadRequestException(
          `Sum of buyer amount (${buyerAmount}) and seller amount (${sellerAmount}) must equal total escrow amount (${totalAmount})`
        );
      }

      // Create system message about proposed resolution
      let resolutionMessage = `Resolution proposed: ${resolution}`;

      if (
        resolution === DisputeResolution.SPLIT ||
        resolution === DisputeResolution.CUSTOM
      ) {
        resolutionMessage += `. Proposed distribution: Buyer: ${buyerAmount}, Seller: ${sellerAmount}`;
      }

      const systemMessage = new DisputeMessage();
      systemMessage.disputeId = disputeId;
      systemMessage.senderId = proposedById;
      systemMessage.message = resolutionMessage;
      systemMessage.isSystemMessage = true;

      if (details) {
        systemMessage.metadata = { details };
      }

      await manager.save(DisputeMessage, systemMessage);

      // For now, we just record the proposal as a message
      // In a real implementation, we would need a separate ProposedResolution entity
      // and logic for the other party to accept/reject it

      return dispute;
    });
  }

  /**
   * Accept a proposed resolution (from the other party)
   * This would be expanded in a full implementation to include
   * reference to a specific proposal
   */
  async acceptResolution(
    disputeId: string,
    acceptedById: string
  ): Promise<Dispute> {
    return this.dataSource.transaction(async (manager) => {
      // Get the dispute and ensure it exists
      const dispute = await manager.findOne(Dispute, {
        where: { id: disputeId },
        relations: ["escrow"],
      });

      if (!dispute) {
        throw new NotFoundException(`Dispute with ID ${disputeId} not found`);
      }

      // Verify dispute is still active
      if (
        dispute.status === DisputeStatus.CLOSED ||
        dispute.status === DisputeStatus.MUTUALLY_RESOLVED ||
        dispute.status === DisputeStatus.RESOLVED_BY_ADMIN ||
        dispute.status === DisputeStatus.EXPIRED
      ) {
        throw new BadRequestException(
          `Cannot accept resolution for dispute with status ${dispute.status}`
        );
      }

      // Verify user is a participant
      const escrow = dispute.escrow;
      if (escrow.buyerId !== acceptedById && escrow.sellerId !== acceptedById) {
        throw new ForbiddenException(
          `User ${acceptedById} is not a participant in this dispute`
        );
      }

      // Update dispute status
      dispute.status = DisputeStatus.MUTUALLY_RESOLVED;
      dispute.resolvedAt = new Date();

      // In a full implementation, we would distribute funds here
      // based on the accepted proposal

      // For now, just mark the dispute as resolved
      await manager.save(Dispute, dispute);

      // Create system message about resolution acceptance
      const systemMessage = new DisputeMessage();
      systemMessage.disputeId = disputeId;
      systemMessage.senderId = acceptedById;
      systemMessage.message = "Resolution accepted. Dispute mutually resolved.";
      systemMessage.isSystemMessage = true;

      await manager.save(DisputeMessage, systemMessage);

      return dispute;
    });
  }

  /**
   * Resolve a dispute administratively
   */
  async resolveDisputeByAdmin(params: ResolveDisputeParams): Promise<Dispute> {
    const {
      disputeId,
      reviewedById,
      resolution,
      buyerAmount,
      sellerAmount,
      notes,
    } = params;

    return this.dataSource.transaction(async (manager) => {
      // Get the dispute and ensure it exists
      const dispute = await manager.findOne(Dispute, {
        where: { id: disputeId },
        relations: ["escrow"],
      });

      if (!dispute) {
        throw new NotFoundException(`Dispute with ID ${disputeId} not found`);
      }

      // Verify dispute is still active
      if (
        dispute.status === DisputeStatus.CLOSED ||
        dispute.status === DisputeStatus.MUTUALLY_RESOLVED ||
        dispute.status === DisputeStatus.RESOLVED_BY_ADMIN ||
        dispute.status === DisputeStatus.EXPIRED
      ) {
        throw new BadRequestException(
          `Cannot resolve dispute with status ${dispute.status}`
        );
      }

      // Verify the admin exists
      const admin = await manager.findOne(User, {
        where: { id: reviewedById },
      });

      if (!admin) {
        throw new NotFoundException(`Admin with ID ${reviewedById} not found`);
      }

      // TODO: Verify the user is an admin (would use a role-based check)

      // Validate amounts
      const escrow = dispute.escrow;
      const totalAmount = escrow.totalAmount;

      if (
        buyerAmount !== undefined &&
        sellerAmount !== undefined &&
        Number(buyerAmount) + Number(sellerAmount) !== Number(totalAmount)
      ) {
        throw new BadRequestException(
          `Sum of buyer amount (${buyerAmount}) and seller amount (${sellerAmount}) must equal total escrow amount (${totalAmount})`
        );
      }

      // Update dispute
      dispute.status = DisputeStatus.RESOLVED_BY_ADMIN;
      dispute.resolution = resolution;
      dispute.reviewedById = reviewedById;
      dispute.resolvedAt = new Date();

      if (buyerAmount !== undefined) {
        dispute.buyerAmount = buyerAmount;
      }

      if (sellerAmount !== undefined) {
        dispute.sellerAmount = sellerAmount;
      }

      // Save updates
      const updatedDispute = await manager.save(Dispute, dispute);

      // Create system message about admin resolution
      let resolutionMessage = `Dispute resolved by admin. Resolution: ${resolution}`;

      if (
        resolution === DisputeResolution.SPLIT ||
        resolution === DisputeResolution.CUSTOM
      ) {
        resolutionMessage += `. Distribution: Buyer: ${buyerAmount}, Seller: ${sellerAmount}`;
      }

      if (notes) {
        resolutionMessage += `. Notes: ${notes}`;
      }

      const systemMessage = new DisputeMessage();
      systemMessage.disputeId = disputeId;
      systemMessage.senderId = reviewedById;
      systemMessage.message = resolutionMessage;
      systemMessage.isSystemMessage = true;

      await manager.save(DisputeMessage, systemMessage);

      // In a complete implementation, we would distribute funds here
      // based on the admin's decision

      return updatedDispute;
    });
  }

  /**
   * Get dispute details by ID
   */
  async getDisputeDetails(disputeId: string, userId: string): Promise<any> {
    // Get the dispute with relations
    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId },
      relations: [
        "escrow",
        "escrow.buyer",
        "escrow.seller",
        "createdBy",
        "reviewedBy",
      ],
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute with ID ${disputeId} not found`);
    }

    // Verify user is a participant or an admin
    const escrow = dispute.escrow;
    const isParticipant =
      escrow.buyerId === userId || escrow.sellerId === userId;
    // TODO: Add admin check here
    const isAdmin = false; // Placeholder for admin check

    if (!isParticipant && !isAdmin) {
      throw new ForbiddenException(
        `User ${userId} is not authorized to view this dispute`
      );
    }

    // Get evidence
    const evidence = await this.evidenceRepository.find({
      where: { disputeId },
      relations: ["submittedBy"],
      order: { createdAt: "ASC" },
    });

    // Get messages
    const messages = await this.messageRepository.find({
      where: { disputeId },
      relations: ["sender"],
      order: { createdAt: "ASC" },
    });

    // Return comprehensive dispute details
    return {
      dispute,
      evidence,
      messages,
      escrow: {
        id: escrow.id,
        totalAmount: escrow.totalAmount,
        status: escrow.status,
        buyer: {
          id: escrow.buyer.id,
          name: escrow.buyer.name,
          email: escrow.buyer.email,
        },
        seller: {
          id: escrow.seller.id,
          name: escrow.seller.name,
          email: escrow.seller.email,
        },
      },
    };
  }

  /**
   * Get all disputes for a user
   */
  async getDisputesForUser(
    userId: string,
    status?: DisputeStatus
  ): Promise<Dispute[]> {
    // Build query to find all disputes where user is buyer or seller of the related escrow
    const query = this.disputeRepository
      .createQueryBuilder("dispute")
      .innerJoinAndSelect("dispute.escrow", "escrow")
      .leftJoinAndSelect("dispute.createdBy", "createdBy")
      .where("escrow.buyerId = :userId OR escrow.sellerId = :userId", {
        userId,
      });

    // Add status filter if provided
    if (status) {
      query.andWhere("dispute.status = :status", { status });
    }

    // Order by creation date, newest first
    query.orderBy("dispute.createdAt", "DESC");

    return query.getMany();
  }

  /**
   * Get all evidence for a dispute
   */
  async getEvidenceForDispute(
    disputeId: string,
    userId: string
  ): Promise<DisputeEvidence[]> {
    // Verify dispute exists and user is authorized
    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId },
      relations: ["escrow"],
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute with ID ${disputeId} not found`);
    }

    // Check authorization
    const escrow = dispute.escrow;
    const isParticipant =
      escrow.buyerId === userId || escrow.sellerId === userId;
    // TODO: Add admin check
    const isAdmin = false; // Placeholder

    if (!isParticipant && !isAdmin) {
      throw new ForbiddenException(
        `User ${userId} is not authorized to view evidence for this dispute`
      );
    }

    // Get evidence
    return this.evidenceRepository.find({
      where: { disputeId },
      relations: ["submittedBy"],
      order: { createdAt: "ASC" },
    });
  }

  /**
   * Get all messages for a dispute
   */
  async getMessagesForDispute(
    disputeId: string,
    userId: string
  ): Promise<DisputeMessage[]> {
    // Verify dispute exists and user is authorized
    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId },
      relations: ["escrow"],
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute with ID ${disputeId} not found`);
    }

    // Check authorization
    const escrow = dispute.escrow;
    const isParticipant =
      escrow.buyerId === userId || escrow.sellerId === userId;
    // TODO: Add admin check
    const isAdmin = false; // Placeholder

    if (!isParticipant && !isAdmin) {
      throw new ForbiddenException(
        `User ${userId} is not authorized to view messages for this dispute`
      );
    }

    // Get messages
    return this.messageRepository.find({
      where: { disputeId },
      relations: ["sender"],
      order: { createdAt: "ASC" },
    });
  }

  /**
   * Process disputes with expired evidence deadlines
   * This would be called by a scheduler
   */
  async processExpiredEvidenceDeadlines(): Promise<void> {
    const now = new Date();

    // Find disputes in evidence submission phase with expired deadlines
    const expiredDisputes = await this.disputeRepository
      .createQueryBuilder("dispute")
      .where("dispute.status = :status", {
        status: DisputeStatus.EVIDENCE_SUBMISSION,
      })
      .andWhere("dispute.evidenceDeadline < :now", { now })
      .getMany();

    // Update each dispute to UNDER_REVIEW status
    for (const dispute of expiredDisputes) {
      await this.dataSource.transaction(async (manager) => {
        // Update status
        dispute.status = DisputeStatus.UNDER_REVIEW;
        await manager.save(Dispute, dispute);

        // Create system message
        const systemMessage = new DisputeMessage();
        systemMessage.disputeId = dispute.id;
        systemMessage.senderId = dispute.createdById; // Using creator as sender for system message
        systemMessage.message =
          "Evidence submission deadline has passed. Dispute is now under review.";
        systemMessage.isSystemMessage = true;

        await manager.save(DisputeMessage, systemMessage);
      });

      this.logger.log(
        `Dispute ${dispute.id} moved to UNDER_REVIEW due to expired evidence deadline`
      );
    }
  }
}
