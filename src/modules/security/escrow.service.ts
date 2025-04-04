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
import { Payment } from "../../entities/payment.entity";
import { PaymentStatus, PaymentMethod } from "../../entities/common.enums";
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
import { NotificationService } from "../notification/notification.service";
import { NotificationType } from "../../entities/notification.entity";
import { BigNumber } from "bignumber.js";

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
    private dataSource: DataSource,
    private notificationService: NotificationService
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

    // Create escrow entity
    const escrow = this.escrowRepository.create({
      title,
      description,
      totalAmount,
      buyerId,
      sellerId,
      expiresAt: new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000),
      status: EscrowStatus.PENDING,
      terms,
      evidenceFiles: documents,
    });

    // Execute transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Save escrow first to get ID
      const savedEscrow = await queryRunner.manager.save(escrow);

      // Create milestone entities
      const milestoneEntities = milestones.map((m) => {
        return this.milestoneRepository.create({
          escrowId: savedEscrow.id,
          amount: m.amount,
          description: m.description,
          sequence: m.sequence,
          status: MilestoneStatus.PENDING,
        });
      });

      // Save milestones
      await queryRunner.manager.save(milestoneEntities);

      // Create transaction log
      await this.logTransaction(
        queryRunner.manager,
        TransactionType.ESCROW_CREATED,
        buyerId,
        savedEscrow.id,
        "escrow",
        {
          title: savedEscrow.title,
          totalAmount: savedEscrow.totalAmount,
          sellerId,
        },
        requestMetadata
      );

      await queryRunner.commitTransaction();

      // Load the complete escrow with relationships
      const completeEscrow = await this.escrowRepository.findOne({
        where: { id: savedEscrow.id },
        relations: ["milestones", "buyer", "seller"],
      });

      // Send notifications to buyer and seller
      this.sendEscrowCreatedNotifications(completeEscrow, buyer, seller);

      return completeEscrow;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error creating escrow: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Send notifications to buyer and seller when an escrow is created
   */
  private async sendEscrowCreatedNotifications(
    escrow: Escrow,
    buyer: User,
    seller: User
  ): Promise<void> {
    try {
      // Notification for buyer
      await this.notificationService.createNotification({
        userId: buyer.id,
        type: NotificationType.ESCROW_CREATED,
        title: "New Escrow Created",
        message: `You've created a new escrow agreement: "${
          escrow.title
        }" with ${seller.name || seller.email}`,
        actionUrl: `/escrows/${escrow.id}`,
        metadata: {
          escrowId: escrow.id,
          amount: escrow.totalAmount,
          otherParty: {
            id: seller.id,
            name: seller.name,
          },
        },
      });

      // Notification for seller
      await this.notificationService.createNotification({
        userId: seller.id,
        type: NotificationType.ESCROW_CREATED,
        title: "New Escrow Agreement",
        message: `${
          buyer.name || buyer.email
        } has created a new escrow agreement with you: "${escrow.title}"`,
        actionUrl: `/escrows/${escrow.id}`,
        metadata: {
          escrowId: escrow.id,
          amount: escrow.totalAmount,
          otherParty: {
            id: buyer.id,
            name: buyer.name,
          },
        },
      });
    } catch (error) {
      // Log error but don't block the escrow creation
      this.logger.error(
        `Error sending escrow creation notifications: ${error.message}`,
        error.stack
      );
    }
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

      // Send notifications to buyer and seller about funding
      await this.sendEscrowFundedNotifications(updatedEscrow);

      return updatedEscrow;
    });
  }

  /**
   * Send notifications to buyer and seller when an escrow is funded
   */
  private async sendEscrowFundedNotifications(escrow: Escrow): Promise<void> {
    try {
      // Notification for buyer
      await this.notificationService.createNotification({
        userId: escrow.buyerId,
        type: NotificationType.ESCROW_FUNDED,
        title: "Escrow Successfully Funded",
        message: `You've successfully funded the escrow "${escrow.title}" with $${escrow.totalAmount}`,
        actionUrl: `/escrows/${escrow.id}`,
        metadata: {
          escrowId: escrow.id,
          amount: escrow.totalAmount,
        },
      });

      // Notification for seller
      await this.notificationService.createNotification({
        userId: escrow.sellerId,
        type: NotificationType.ESCROW_FUNDED,
        title: "Escrow Funded",
        message: `The escrow "${escrow.title}" has been funded with $${escrow.totalAmount}. You can now begin work.`,
        actionUrl: `/escrows/${escrow.id}`,
        metadata: {
          escrowId: escrow.id,
          amount: escrow.totalAmount,
        },
      });
    } catch (error) {
      // Log error but don't block the escrow funding process
      this.logger.error(
        `Error sending escrow funded notifications: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Submit delivery proof for an escrow
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
        savedProof.id,
        "deliveryProof",
        {
          escrowId,
          proof: savedProof.id,
          proofType: data.type,
        },
        requestMetadata
      );

      // Send notification to buyer about the new proof
      await this.sendProofSubmittedNotification(escrow, savedProof);

      return savedProof;
    });
  }

  /**
   * Review a delivery proof
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

      // Log transaction
      await this.logTransaction(
        manager,
        decision === "accept"
          ? TransactionType.ESCROW_PROOF_REVIEWED
          : TransactionType.ESCROW_PROOF_REVIEWED,
        userId,
        proof.id,
        "deliveryProof",
        {
          escrowId: proof.escrowId,
          proof: proof.id,
          decision,
          ...(rejectionReason && { rejectionReason }),
        },
        requestMetadata
      );

      // Send notification about the proof review
      if (decision === "accept") {
        await this.sendProofApprovedNotification(escrow, proof);
      } else {
        await this.sendProofRejectedNotification(
          escrow,
          proof,
          rejectionReason
        );
      }

      return updatedProof;
    });
  }

  /**
   * Send notification when a proof is submitted
   */
  private async sendProofSubmittedNotification(
    escrow: Escrow,
    proof: DeliveryProof
  ): Promise<void> {
    try {
      // Notify the buyer that a proof has been submitted
      await this.notificationService.createNotification({
        userId: escrow.buyerId,
        type: NotificationType.PROOF_SUBMITTED,
        title: "Delivery Proof Submitted",
        message: `The seller has submitted a delivery proof for "${escrow.title}". Please review it.`,
        actionUrl: `/escrows/${escrow.id}/proofs/${proof.id}`,
        metadata: {
          escrowId: escrow.id,
          proofId: proof.id,
          proofType: proof.type,
        },
      });
    } catch (error) {
      // Log error but don't block the proof submission
      this.logger.error(
        `Error sending proof submitted notification: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Send notification when a proof is approved
   */
  private async sendProofApprovedNotification(
    escrow: Escrow,
    proof: DeliveryProof
  ): Promise<void> {
    try {
      // Notify the seller that their proof was approved
      await this.notificationService.createNotification({
        userId: escrow.sellerId,
        type: NotificationType.PROOF_APPROVED,
        title: "Delivery Proof Approved",
        message: `Your delivery proof for "${escrow.title}" has been approved.`,
        actionUrl: `/escrows/${escrow.id}/proofs/${proof.id}`,
        metadata: {
          escrowId: escrow.id,
          proofId: proof.id,
        },
      });
    } catch (error) {
      // Log error but don't block the proof approval process
      this.logger.error(
        `Error sending proof approved notification: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Send notification when a proof is rejected
   */
  private async sendProofRejectedNotification(
    escrow: Escrow,
    proof: DeliveryProof,
    rejectionReason?: string
  ): Promise<void> {
    try {
      // Notify the seller that their proof was rejected
      await this.notificationService.createNotification({
        userId: escrow.sellerId,
        type: NotificationType.PROOF_REJECTED,
        title: "Delivery Proof Rejected",
        message: `Your delivery proof for "${escrow.title}" was rejected${
          rejectionReason ? `: ${rejectionReason}` : ""
        }.`,
        actionUrl: `/escrows/${escrow.id}/proofs/${proof.id}`,
        metadata: {
          escrowId: escrow.id,
          proofId: proof.id,
          rejectionReason,
        },
      });
    } catch (error) {
      // Log error but don't block the proof rejection process
      this.logger.error(
        `Error sending proof rejected notification: ${error.message}`,
        error.stack
      );
    }
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

      // Send notifications about milestone update
      await this.sendMilestoneUpdateNotifications(
        escrow,
        milestone,
        status,
        userId
      );

      return updatedMilestone;
    });
  }

  /**
   * Send notifications when a milestone is updated
   */
  private async sendMilestoneUpdateNotifications(
    escrow: Escrow,
    milestone: EscrowMilestone,
    status: MilestoneStatus,
    updatedByUserId: string
  ): Promise<void> {
    try {
      const isBuyer = updatedByUserId === escrow.buyerId;
      const otherPartyId = isBuyer ? escrow.sellerId : escrow.buyerId;

      // Determine message based on status
      let title = "Milestone Updated";
      let buyerMessage = "";
      let sellerMessage = "";

      if (status === MilestoneStatus.COMPLETED) {
        title = "Milestone Completed";
        buyerMessage = `You've marked milestone "${milestone.description}" as completed for escrow "${escrow.title}".`;
        sellerMessage = `The buyer has marked milestone "${milestone.description}" as completed for escrow "${escrow.title}".`;
      } else if (status === MilestoneStatus.DISPUTED) {
        title = "Milestone Disputed";
        const action = isBuyer ? "buyer" : "seller";
        buyerMessage = isBuyer
          ? `You've marked milestone "${milestone.description}" as disputed for escrow "${escrow.title}".`
          : `The seller has marked milestone "${milestone.description}" as disputed for escrow "${escrow.title}".`;
        sellerMessage = isBuyer
          ? `The buyer has marked milestone "${milestone.description}" as disputed for escrow "${escrow.title}".`
          : `You've marked milestone "${milestone.description}" as disputed for escrow "${escrow.title}".`;
      }

      // Notification for the user who updated the milestone
      if (updatedByUserId === escrow.buyerId) {
        await this.notificationService.createNotification({
          userId: escrow.buyerId,
          type: NotificationType.MILESTONE_UPDATED,
          title,
          message: buyerMessage,
          actionUrl: `/escrows/${escrow.id}`,
          metadata: {
            escrowId: escrow.id,
            milestoneId: milestone.id,
            status,
            milestoneAmount: milestone.amount,
          },
        });
      } else {
        await this.notificationService.createNotification({
          userId: escrow.sellerId,
          type: NotificationType.MILESTONE_UPDATED,
          title,
          message: sellerMessage,
          actionUrl: `/escrows/${escrow.id}`,
          metadata: {
            escrowId: escrow.id,
            milestoneId: milestone.id,
            status,
            milestoneAmount: milestone.amount,
          },
        });
      }

      // Notification for the other party
      await this.notificationService.createNotification({
        userId: otherPartyId,
        type: NotificationType.MILESTONE_UPDATED,
        title,
        message: otherPartyId === escrow.buyerId ? buyerMessage : sellerMessage,
        actionUrl: `/escrows/${escrow.id}`,
        metadata: {
          escrowId: escrow.id,
          milestoneId: milestone.id,
          status,
          milestoneAmount: milestone.amount,
        },
      });
    } catch (error) {
      // Log error but don't block the milestone update process
      this.logger.error(
        `Error sending milestone update notifications: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Complete an escrow, releasing funds to the seller
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

    // Log the transaction
    await this.logTransaction(
      manager || this.dataSource.manager,
      TransactionType.ESCROW_COMPLETED,
      escrow.buyerId,
      escrow.id,
      "escrow",
      {
        escrowId: escrow.id,
        totalAmount: escrow.totalAmount,
      },
      null
    );

    // Send notifications for escrow completion
    if (!transactionManager) {
      await this.sendEscrowCompletedNotifications(escrow);
    }

    return updatedEscrow;
  }

  /**
   * Send notifications when an escrow is completed and funds are released
   */
  private async sendEscrowCompletedNotifications(
    escrow: Escrow
  ): Promise<void> {
    try {
      // Notification for seller (funds received)
      await this.notificationService.createNotification({
        userId: escrow.sellerId,
        type: NotificationType.ESCROW_COMPLETED,
        title: "Escrow Completed - Funds Released",
        message: `The escrow for "${escrow.title}" has been completed and $${escrow.totalAmount} has been released to your wallet.`,
        actionUrl: `/escrows/${escrow.id}`,
        metadata: {
          escrowId: escrow.id,
          amount: escrow.totalAmount,
        },
      });

      // Notification for buyer (escrow completed)
      await this.notificationService.createNotification({
        userId: escrow.buyerId,
        type: NotificationType.ESCROW_COMPLETED,
        title: "Escrow Completed",
        message: `The escrow for "${escrow.title}" has been completed and funds have been released to the seller.`,
        actionUrl: `/escrows/${escrow.id}`,
        metadata: {
          escrowId: escrow.id,
          amount: escrow.totalAmount,
        },
      });
    } catch (error) {
      // Log error but don't block the escrow completion process
      this.logger.error(
        `Error sending escrow completed notifications: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Cancel an escrow agreement and refund the buyer
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

      // Create transaction log
      await this.logTransaction(
        manager,
        TransactionType.ESCROW_CANCELLED,
        userId,
        escrow.id,
        "escrow",
        {
          escrowId,
          cancelledBy: userId,
          reason: "User requested cancellation",
        },
        requestMetadata
      );

      // Send notifications about the cancellation (after transaction completes)
      const savedEscrow = await manager.save(Escrow, escrow);

      // The transaction will be committed automatically when the callback returns

      // Send notifications about the cancellation
      await this.sendEscrowCancelledNotifications(escrow, userId);

      return savedEscrow;
    });
  }

  /**
   * Send notifications when an escrow is cancelled
   */
  private async sendEscrowCancelledNotifications(
    escrow: Escrow,
    cancelledByUserId: string
  ): Promise<void> {
    try {
      const isCancelledByBuyer = cancelledByUserId === escrow.buyerId;
      const otherPartyId = isCancelledByBuyer
        ? escrow.sellerId
        : escrow.buyerId;

      // Notification for the user who cancelled
      await this.notificationService.createNotification({
        userId: cancelledByUserId,
        type: NotificationType.ESCROW_RELEASED,
        title: "Escrow Cancelled",
        message: `You have cancelled the escrow for "${escrow.title}".${
          isCancelledByBuyer
            ? " Your funds have been returned to your wallet."
            : ""
        }`,
        actionUrl: `/escrows/${escrow.id}`,
        metadata: {
          escrowId: escrow.id,
          amount: escrow.totalAmount,
        },
      });

      // Notification for the other party
      await this.notificationService.createNotification({
        userId: otherPartyId,
        type: NotificationType.ESCROW_RELEASED,
        title: "Escrow Cancelled",
        message: `The escrow for "${escrow.title}" has been cancelled by the ${
          isCancelledByBuyer ? "buyer" : "seller"
        }.`,
        actionUrl: `/escrows/${escrow.id}`,
        metadata: {
          escrowId: escrow.id,
          amount: escrow.totalAmount,
          cancelledBy: cancelledByUserId,
        },
      });
    } catch (error) {
      // Log error but don't block the escrow cancellation process
      this.logger.error(
        `Error sending escrow cancelled notifications: ${error.message}`,
        error.stack
      );
    }
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

        // Send notifications about the automatic release
        await this.sendAutomaticReleaseNotifications(escrow);

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
   * Send notifications when an escrow is automatically released based on schedule
   */
  private async sendAutomaticReleaseNotifications(
    escrow: Escrow
  ): Promise<void> {
    try {
      // Notification for seller (funds received)
      await this.notificationService.createNotification({
        userId: escrow.sellerId,
        type: NotificationType.ESCROW_RELEASED,
        title: "Escrow Funds Automatically Released",
        message: `Funds for escrow "${escrow.title}" have been automatically released to your wallet based on the scheduled release date.`,
        actionUrl: `/escrows/${escrow.id}`,
        metadata: {
          escrowId: escrow.id,
          amount: escrow.totalAmount,
          automatic: true,
          releaseDate: escrow.scheduleReleaseAt,
        },
      });

      // Notification for buyer
      await this.notificationService.createNotification({
        userId: escrow.buyerId,
        type: NotificationType.ESCROW_RELEASED,
        title: "Escrow Funds Automatically Released",
        message: `Funds for escrow "${escrow.title}" have been automatically released to the seller based on the scheduled release date.`,
        actionUrl: `/escrows/${escrow.id}`,
        metadata: {
          escrowId: escrow.id,
          amount: escrow.totalAmount,
          automatic: true,
          releaseDate: escrow.scheduleReleaseAt,
        },
      });
    } catch (error) {
      // Log error but don't block the escrow processing
      this.logger.error(
        `Error sending automatic release notifications: ${error.message}`,
        error.stack
      );
    }
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
