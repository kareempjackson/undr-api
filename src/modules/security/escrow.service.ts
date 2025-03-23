import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import {
  Escrow,
  EscrowStatus,
  EscrowMilestone,
  MilestoneStatus,
} from "../../entities/escrow.entity";
import {
  Payment,
  PaymentStatus,
  PaymentMethod,
} from "../../entities/payment.entity";
import { User } from "../../entities/user.entity";
import { Wallet } from "../../entities/wallet.entity";
import {
  DeliveryProof,
  ProofStatus,
  ProofType,
} from "../../entities/delivery-proof.entity";
import {
  TransactionLog,
  TransactionType,
} from "../../entities/transaction-log.entity";
import { DeliveryProofSubmitDTO } from "../../dtos/escrow.dto";

interface CreateEscrowParams {
  title: string;
  description?: string;
  totalAmount: number;
  buyerId: string;
  sellerId: string;
  expirationDays: number;
  milestones: Array<{
    amount: number;
    description: string;
    sequence: number;
  }>;
  terms?: any;
  documents?: string[];
}

interface MilestoneUpdateParams {
  escrowId: string;
  milestoneId: string;
  status: MilestoneStatus;
  userId: string;
}

@Injectable()
export class EscrowService {
  private readonly logger = new Logger(EscrowService.name);

  constructor(
    @InjectRepository(Escrow)
    private escrowRepository: Repository<Escrow>,
    @InjectRepository(EscrowMilestone)
    private milestoneRepository: Repository<EscrowMilestone>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(DeliveryProof)
    private deliveryProofRepository: Repository<DeliveryProof>,
    @InjectRepository(TransactionLog)
    private transactionLogRepository: Repository<TransactionLog>,
    private dataSource: DataSource
  ) {}

  /**
   * Create an escrow agreement
   */
  async createEscrow(
    params: CreateEscrowParams,
    requestMetadata?: any
  ): Promise<Escrow> {
    const {
      title,
      description,
      totalAmount,
      buyerId,
      sellerId,
      expirationDays,
      milestones,
      terms,
      documents,
    } = params;

    // Validate users
    const buyer = await this.userRepository.findOne({
      where: { id: buyerId },
      relations: ["wallet"],
    });

    const seller = await this.userRepository.findOne({
      where: { id: sellerId },
    });

    if (!buyer) {
      throw new BadRequestException("Buyer not found");
    }

    if (!seller) {
      throw new BadRequestException("Seller not found");
    }

    // Validate buyer has sufficient funds
    if (!buyer.wallet || Number(buyer.wallet.balance) < totalAmount) {
      throw new BadRequestException("Insufficient funds in buyer wallet");
    }

    // Validate milestones total matches escrow amount
    const milestonesTotal = milestones.reduce(
      (sum, m) => sum + Number(m.amount),
      0
    );
    if (Math.abs(milestonesTotal - totalAmount) > 0.01) {
      throw new BadRequestException(
        "Sum of milestone amounts must equal the total escrow amount"
      );
    }

    // Create escrow
    const escrow = new Escrow();
    escrow.title = title;
    escrow.description = description;
    escrow.totalAmount = totalAmount;
    escrow.buyerId = buyerId;
    escrow.sellerId = sellerId;
    escrow.status = EscrowStatus.PENDING;
    escrow.expiresAt = new Date(
      Date.now() + expirationDays * 24 * 60 * 60 * 1000
    );

    // Set automatic release date (3 days from now)
    const scheduleReleaseAt = new Date();
    scheduleReleaseAt.setDate(scheduleReleaseAt.getDate() + 3);
    escrow.scheduleReleaseAt = scheduleReleaseAt;

    if (terms) {
      escrow.terms = terms;
    }

    // Handle additional agreement documents
    if (documents && documents.length > 0) {
      escrow.evidenceFiles = documents;
    }

    // Use a transaction to ensure all operations succeed or fail together
    return this.dataSource.transaction(async (manager) => {
      // Save escrow first to get ID
      const savedEscrow = await manager.save(Escrow, escrow);

      // Create milestones
      const escrowMilestones = milestones.map((milestone) => {
        const escrowMilestone = new EscrowMilestone();
        escrowMilestone.escrowId = savedEscrow.id;
        escrowMilestone.amount = milestone.amount;
        escrowMilestone.description = milestone.description;
        escrowMilestone.sequence = milestone.sequence;
        escrowMilestone.status = MilestoneStatus.PENDING;
        return escrowMilestone;
      });

      await manager.save(EscrowMilestone, escrowMilestones);

      // Log the transaction
      await this.logTransaction(
        manager,
        TransactionType.ESCROW_CREATED,
        buyerId,
        savedEscrow.id,
        "Escrow",
        {
          escrowId: savedEscrow.id,
          title,
          totalAmount,
          sellerId,
        },
        requestMetadata
      );

      // Return the complete escrow with relationships
      return manager.findOne(Escrow, {
        where: { id: savedEscrow.id },
        relations: ["milestones"],
      });
    });
  }

  /**
   * Fund an escrow from buyer's wallet
   */
  async fundEscrow(
    escrowId: string,
    buyerId: string,
    requestMetadata?: any
  ): Promise<Escrow> {
    return this.dataSource.transaction(async (manager) => {
      const escrow = await manager.findOne(Escrow, {
        where: { id: escrowId },
        relations: ["milestones"],
      });

      if (!escrow) {
        throw new NotFoundException("Escrow not found");
      }

      if (escrow.buyerId !== buyerId) {
        throw new ForbiddenException("Only the buyer can fund the escrow");
      }

      if (escrow.status !== EscrowStatus.PENDING) {
        throw new BadRequestException("Escrow is not in pending status");
      }

      // Get buyer wallet
      const buyer = await manager.findOne(User, {
        where: { id: buyerId },
        relations: ["wallet"],
      });

      if (
        !buyer ||
        !buyer.wallet ||
        Number(buyer.wallet.balance) < Number(escrow.totalAmount)
      ) {
        throw new BadRequestException("Insufficient funds in buyer wallet");
      }

      // Deduct from buyer's wallet
      buyer.wallet.balance =
        Number(buyer.wallet.balance) - Number(escrow.totalAmount);
      await manager.save(Wallet, buyer.wallet);

      // Create payment record
      const payment = new Payment();
      payment.amount = escrow.totalAmount;
      payment.fromUserId = escrow.buyerId;
      payment.toUserId = escrow.sellerId;
      payment.status = PaymentStatus.ESCROW;
      payment.method = PaymentMethod.WALLET;
      payment.description = `Escrow payment for: ${escrow.title}`;

      const savedPayment = await manager.save(Payment, payment);

      // Update escrow status and link to payment
      escrow.status = EscrowStatus.FUNDED;
      escrow.paymentId = savedPayment.id;
      const updatedEscrow = await manager.save(Escrow, escrow);

      // Log the transaction
      await this.logTransaction(
        manager,
        TransactionType.ESCROW_FUNDED,
        buyerId,
        escrowId,
        "Escrow",
        {
          escrowId,
          totalAmount: escrow.totalAmount,
          paymentId: savedPayment.id,
        },
        requestMetadata
      );

      return updatedEscrow;
    });
  }

  /**
   * Submit proof of delivery for an escrow
   */
  async submitDeliveryProof(
    escrowId: string,
    data: DeliveryProofSubmitDTO,
    userId: string,
    requestMetadata?: any
  ): Promise<DeliveryProof> {
    return this.dataSource.transaction(async (manager) => {
      const escrow = await manager.findOne(Escrow, {
        where: { id: escrowId },
      });

      if (!escrow) {
        throw new NotFoundException("Escrow not found");
      }

      if (escrow.sellerId !== userId) {
        throw new ForbiddenException(
          "Only the seller can submit delivery proof"
        );
      }

      if (escrow.status !== EscrowStatus.FUNDED) {
        throw new BadRequestException(
          "Proof can only be submitted for funded escrows"
        );
      }

      // Create the proof
      const proof = new DeliveryProof();
      proof.escrowId = escrowId;
      proof.submittedById = userId;
      proof.type = data.type;
      proof.description = data.description;
      proof.files = data.files;
      proof.status = ProofStatus.PENDING;
      proof.metadata = data.metadata || {};

      const savedProof = await manager.save(DeliveryProof, proof);

      // Log the transaction
      await this.logTransaction(
        manager,
        TransactionType.ESCROW_PROOF_SUBMITTED,
        userId,
        escrowId,
        "Escrow",
        {
          escrowId,
          proofId: savedProof.id,
          type: data.type,
          files: data.files,
        },
        requestMetadata
      );

      return savedProof;
    });
  }

  /**
   * Review submitted proof
   */
  async reviewDeliveryProof(
    proofId: string,
    decision: "accept" | "reject",
    userId: string,
    rejectionReason?: string,
    requestMetadata?: any
  ): Promise<DeliveryProof> {
    return this.dataSource.transaction(async (manager) => {
      const proof = await manager.findOne(DeliveryProof, {
        where: { id: proofId },
        relations: ["escrow"],
      });

      if (!proof) {
        throw new NotFoundException("Delivery proof not found");
      }

      const escrow = proof.escrow;

      if (escrow.buyerId !== userId) {
        throw new ForbiddenException(
          "Only the buyer can review delivery proof"
        );
      }

      if (proof.status !== ProofStatus.PENDING) {
        throw new BadRequestException("Proof has already been reviewed");
      }

      // Update the proof status
      proof.status =
        decision === "accept" ? ProofStatus.ACCEPTED : ProofStatus.REJECTED;
      proof.reviewedById = userId;
      proof.reviewedAt = new Date();

      if (decision === "reject" && rejectionReason) {
        proof.rejectionReason = rejectionReason;
      }

      const updatedProof = await manager.save(DeliveryProof, proof);

      // If proof is accepted, complete the escrow
      if (decision === "accept") {
        await this.completeEscrow(escrow.id, manager);
      }

      // Log the transaction
      await this.logTransaction(
        manager,
        TransactionType.ESCROW_PROOF_REVIEWED,
        userId,
        proof.escrowId,
        "Escrow",
        {
          escrowId: proof.escrowId,
          proofId,
          decision,
          rejectionReason,
        },
        requestMetadata
      );

      return updatedProof;
    });
  }

  /**
   * Update a milestone status
   */
  async updateMilestone(
    params: MilestoneUpdateParams,
    requestMetadata?: any
  ): Promise<EscrowMilestone> {
    return this.dataSource.transaction(async (manager) => {
      const { escrowId, milestoneId, status, userId } = params;

      const escrow = await manager.findOne(Escrow, {
        where: { id: escrowId },
        relations: ["milestones"],
      });

      if (!escrow) {
        throw new NotFoundException("Escrow not found");
      }

      // Check permissions
      if (status === MilestoneStatus.COMPLETED && userId !== escrow.buyerId) {
        throw new ForbiddenException(
          "Only the buyer can mark a milestone as completed"
        );
      }

      if (
        status === MilestoneStatus.DISPUTED &&
        userId !== escrow.buyerId &&
        userId !== escrow.sellerId
      ) {
        throw new ForbiddenException(
          "Only the buyer or seller can dispute a milestone"
        );
      }

      // Find the milestone
      const milestone = escrow.milestones.find((m) => m.id === milestoneId);
      if (!milestone) {
        throw new NotFoundException("Milestone not found");
      }

      // Update milestone status
      milestone.status = status;

      if (status === MilestoneStatus.COMPLETED) {
        milestone.completedAt = new Date();
      }

      // Save the updated milestone
      const updatedMilestone = await manager.save(EscrowMilestone, milestone);

      // If all milestones are completed, update escrow status
      const allMilestones = await manager.find(EscrowMilestone, {
        where: { escrowId },
      });

      const allCompleted = allMilestones.every(
        (m) => m.status === MilestoneStatus.COMPLETED
      );

      if (allCompleted) {
        await this.completeEscrow(escrowId, manager);
      }

      // Log the transaction
      await this.logTransaction(
        manager,
        TransactionType.MILESTONE_UPDATED,
        userId,
        milestoneId,
        "EscrowMilestone",
        {
          escrowId,
          milestoneId,
          status,
        },
        requestMetadata
      );

      return updatedMilestone;
    });
  }

  /**
   * Complete an escrow and release funds to seller
   */
  async completeEscrow(
    escrowId: string,
    transactionManager?: any
  ): Promise<Escrow> {
    const manager = transactionManager || this.dataSource.manager;

    const escrow = await manager.findOne(Escrow, {
      where: { id: escrowId },
      relations: ["milestones"],
    });

    if (!escrow) {
      throw new NotFoundException("Escrow not found");
    }

    if (escrow.status !== EscrowStatus.FUNDED) {
      throw new BadRequestException("Escrow is not in funded status");
    }

    // Get seller wallet
    const seller = await manager.findOne(User, {
      where: { id: escrow.sellerId },
      relations: ["wallet"],
    });

    if (!seller || !seller.wallet) {
      throw new NotFoundException("Seller wallet not found");
    }

    // Add funds to seller's wallet
    seller.wallet.balance =
      Number(seller.wallet.balance) + Number(escrow.totalAmount);
    await manager.save(Wallet, seller.wallet);

    // Update payment status
    if (escrow.paymentId) {
      await manager.update(Payment, escrow.paymentId, {
        status: PaymentStatus.COMPLETED,
      });
    }

    // Update escrow status
    escrow.status = EscrowStatus.COMPLETED;
    escrow.completedAt = new Date();

    const updatedEscrow = await manager.save(Escrow, escrow);

    // If we're not in a transaction already, log the completion
    if (!transactionManager) {
      await this.logTransaction(
        manager,
        TransactionType.ESCROW_COMPLETED,
        escrow.buyerId,
        escrowId,
        "Escrow",
        {
          escrowId,
          totalAmount: escrow.totalAmount,
          sellerId: escrow.sellerId,
        }
      );
    }

    return updatedEscrow;
  }

  /**
   * Cancel an escrow and refund buyer
   */
  async cancelEscrow(
    escrowId: string,
    userId: string,
    requestMetadata?: any
  ): Promise<Escrow> {
    return this.dataSource.transaction(async (manager) => {
      const escrow = await manager.findOne(Escrow, {
        where: { id: escrowId },
      });

      if (!escrow) {
        throw new NotFoundException("Escrow not found");
      }

      // Check permissions
      if (userId !== escrow.buyerId && userId !== escrow.sellerId) {
        throw new ForbiddenException(
          "Only the buyer or seller can cancel the escrow"
        );
      }

      if (
        escrow.status !== EscrowStatus.PENDING &&
        escrow.status !== EscrowStatus.FUNDED
      ) {
        throw new BadRequestException(
          "Escrow cannot be cancelled in its current state"
        );
      }

      // If funded, refund the buyer
      if (escrow.status === EscrowStatus.FUNDED) {
        const buyer = await manager.findOne(User, {
          where: { id: escrow.buyerId },
          relations: ["wallet"],
        });

        if (!buyer || !buyer.wallet) {
          throw new NotFoundException("Buyer wallet not found");
        }

        // Add funds back to buyer's wallet
        buyer.wallet.balance =
          Number(buyer.wallet.balance) + Number(escrow.totalAmount);
        await manager.save(Wallet, buyer.wallet);

        // Update payment status if exists
        if (escrow.paymentId) {
          await manager.update(Payment, escrow.paymentId, {
            status: PaymentStatus.REFUNDED,
          });
        }
      }

      // Update escrow status
      escrow.status = EscrowStatus.CANCELLED;
      const updatedEscrow = await manager.save(Escrow, escrow);

      // Log the transaction
      await this.logTransaction(
        manager,
        TransactionType.ESCROW_CANCELLED,
        userId,
        escrowId,
        "Escrow",
        {
          escrowId,
          status: escrow.status,
          cancelledBy: userId,
        },
        requestMetadata
      );

      return updatedEscrow;
    });
  }

  /**
   * Get escrows for a user
   */
  async getEscrowsByUser(
    userId: string,
    status?: EscrowStatus,
    limit?: number,
    offset?: number
  ): Promise<{ escrows: Escrow[]; total: number }> {
    const queryBuilder = this.escrowRepository
      .createQueryBuilder("escrow")
      .leftJoinAndSelect("escrow.milestones", "milestones")
      .where("escrow.buyerId = :userId OR escrow.sellerId = :userId", {
        userId,
      });

    if (status) {
      queryBuilder.andWhere("escrow.status = :status", { status });
    }

    const total = await queryBuilder.getCount();

    queryBuilder.orderBy("escrow.createdAt", "DESC");

    if (limit) {
      queryBuilder.take(limit);
    }

    if (offset) {
      queryBuilder.skip(offset);
    }

    const escrows = await queryBuilder.getMany();

    return { escrows, total };
  }

  /**
   * Get escrow by ID
   */
  async getEscrowById(escrowId: string): Promise<Escrow> {
    const escrow = await this.escrowRepository.findOne({
      where: { id: escrowId },
      relations: ["milestones"],
    });

    if (!escrow) {
      throw new NotFoundException("Escrow not found");
    }

    return escrow;
  }

  /**
   * Get delivery proofs for an escrow
   */
  async getEscrowProofs(escrowId: string): Promise<DeliveryProof[]> {
    const proofs = await this.deliveryProofRepository.find({
      where: { escrowId },
      order: { createdAt: "DESC" },
    });

    return proofs;
  }

  /**
   * Process all escrows scheduled for automatic release
   * This method checks for escrows that have reached their scheduleReleaseAt date
   * and automatically releases the funds to the seller
   */
  async processScheduledReleases(): Promise<number> {
    const now = new Date();
    this.logger.log(
      `Processing scheduled escrow releases at ${now.toISOString()}`
    );

    // Find escrows ready for scheduled release
    const escrows = await this.escrowRepository.find({
      where: {
        status: EscrowStatus.FUNDED,
        scheduleReleaseAt: now < new Date() ? now : undefined,
      },
      relations: ["milestones"],
    });

    this.logger.log(
      `Found ${escrows.length} escrows scheduled for automatic release`
    );

    let releasedCount = 0;

    // Process each escrow in a transaction
    for (const escrow of escrows) {
      try {
        await this.dataSource.transaction(async (manager) => {
          // Update escrow status and release funds
          await this.completeEscrow(escrow.id, manager);

          // Log the automatic release
          await this.logTransaction(
            manager,
            TransactionType.ESCROW_COMPLETED,
            escrow.buyerId,
            escrow.id,
            "Escrow",
            {
              escrowId: escrow.id,
              totalAmount: escrow.totalAmount,
              scheduleReleaseAt: escrow.scheduleReleaseAt,
              reason: "Automatic release based on schedule",
            }
          );
        });

        releasedCount++;
        this.logger.log(`Successfully released escrow ${escrow.id}`);
      } catch (error) {
        this.logger.error(
          `Failed to release escrow ${escrow.id}: ${error.message}`,
          error.stack
        );
      }
    }

    this.logger.log(
      `Successfully processed ${releasedCount} of ${escrows.length} scheduled releases`
    );
    return releasedCount;
  }

  /**
   * Log a transaction for auditing purposes
   */
  private async logTransaction(
    manager: any,
    type: TransactionType,
    userId: string,
    entityId: string,
    entityType: string,
    data: Record<string, any>,
    requestMetadata?: any
  ): Promise<TransactionLog> {
    try {
      const log = new TransactionLog();
      log.type = type;
      log.userId = userId;
      log.entityId = entityId;
      log.entityType = entityType;
      log.data = data;

      if (requestMetadata) {
        log.ipAddress = requestMetadata.ip;
        log.userAgent = requestMetadata.userAgent;
        log.metadata = requestMetadata;
      }

      return await manager.save(TransactionLog, log);
    } catch (error) {
      // Log error but don't fail the main transaction
      this.logger.error(
        `Failed to log transaction: ${error.message}`,
        error.stack
      );
      return null;
    }
  }
}
