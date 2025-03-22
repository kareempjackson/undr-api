import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
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
}

interface MilestoneUpdateParams {
  escrowId: string;
  milestoneId: string;
  status: MilestoneStatus;
  userId: string;
}

@Injectable()
export class EscrowService {
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
    private walletRepository: Repository<Wallet>
  ) {}

  /**
   * Create an escrow agreement
   */
  async createEscrow(params: CreateEscrowParams): Promise<Escrow> {
    const {
      title,
      description,
      totalAmount,
      buyerId,
      sellerId,
      expirationDays,
      milestones,
      terms,
    } = params;

    // Validate users
    const buyer = await this.userRepository.findOne({
      where: { id: buyerId },
      relations: ["wallet"],
    });

    const seller = await this.userRepository.findOne({
      where: { id: sellerId },
    });

    if (!buyer || !seller) {
      throw new Error("Buyer or seller not found");
    }

    // Validate buyer has sufficient funds
    if (!buyer.wallet || Number(buyer.wallet.balance) < totalAmount) {
      throw new Error("Insufficient funds in buyer wallet");
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

    if (terms) {
      escrow.terms = terms;
    }

    // Save escrow first to get ID
    const savedEscrow = await this.escrowRepository.save(escrow);

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

    await this.milestoneRepository.save(escrowMilestones);

    return this.escrowRepository.findOne({
      where: { id: savedEscrow.id },
      relations: ["milestones"],
    });
  }

  /**
   * Fund an escrow from buyer's wallet
   */
  async fundEscrow(escrowId: string, buyerId: string): Promise<Escrow> {
    const escrow = await this.escrowRepository.findOne({
      where: { id: escrowId },
      relations: ["milestones"],
    });

    if (!escrow) {
      throw new Error("Escrow not found");
    }

    if (escrow.buyerId !== buyerId) {
      throw new Error("Only the buyer can fund the escrow");
    }

    if (escrow.status !== EscrowStatus.PENDING) {
      throw new Error("Escrow is not in pending status");
    }

    // Get buyer wallet
    const buyer = await this.userRepository.findOne({
      where: { id: buyerId },
      relations: ["wallet"],
    });

    if (
      !buyer ||
      !buyer.wallet ||
      Number(buyer.wallet.balance) < Number(escrow.totalAmount)
    ) {
      throw new Error("Insufficient funds in buyer wallet");
    }

    // Deduct from buyer's wallet
    buyer.wallet.balance =
      Number(buyer.wallet.balance) - Number(escrow.totalAmount);
    await this.walletRepository.save(buyer.wallet);

    // Create payment record
    const payment = new Payment();
    payment.amount = escrow.totalAmount;
    payment.fromUserId = escrow.buyerId;
    payment.toUserId = escrow.sellerId;
    payment.status = PaymentStatus.ESCROW;
    payment.method = PaymentMethod.WALLET;
    payment.description = `Escrow payment for: ${escrow.title}`;

    const savedPayment = await this.paymentRepository.save(payment);

    // Update escrow status and link to payment
    escrow.status = EscrowStatus.FUNDED;
    escrow.paymentId = savedPayment.id;

    return this.escrowRepository.save(escrow);
  }

  /**
   * Update a milestone status
   */
  async updateMilestone(
    params: MilestoneUpdateParams
  ): Promise<EscrowMilestone> {
    const { escrowId, milestoneId, status, userId } = params;

    const escrow = await this.escrowRepository.findOne({
      where: { id: escrowId },
      relations: ["milestones"],
    });

    if (!escrow) {
      throw new Error("Escrow not found");
    }

    // Check permissions
    if (status === MilestoneStatus.COMPLETED && userId !== escrow.buyerId) {
      throw new Error("Only the buyer can mark a milestone as completed");
    }

    if (
      status === MilestoneStatus.DISPUTED &&
      userId !== escrow.buyerId &&
      userId !== escrow.sellerId
    ) {
      throw new Error("Only the buyer or seller can dispute a milestone");
    }

    // Find the milestone
    const milestone = escrow.milestones.find((m) => m.id === milestoneId);
    if (!milestone) {
      throw new Error("Milestone not found");
    }

    // Update milestone status
    milestone.status = status;

    if (status === MilestoneStatus.COMPLETED) {
      milestone.completedAt = new Date();
    }

    // If all milestones are completed, update escrow status
    const updatedMilestone = await this.milestoneRepository.save(milestone);

    const allMilestones = await this.milestoneRepository.find({
      where: { escrowId },
    });

    const allCompleted = allMilestones.every(
      (m) => m.status === MilestoneStatus.COMPLETED
    );

    if (allCompleted) {
      await this.completeEscrow(escrowId);
    }

    return updatedMilestone;
  }

  /**
   * Complete an escrow and release funds to seller
   */
  async completeEscrow(escrowId: string): Promise<Escrow> {
    const escrow = await this.escrowRepository.findOne({
      where: { id: escrowId },
      relations: ["milestones"],
    });

    if (!escrow) {
      throw new Error("Escrow not found");
    }

    if (escrow.status !== EscrowStatus.FUNDED) {
      throw new Error("Escrow is not in funded status");
    }

    // Get seller wallet
    const seller = await this.userRepository.findOne({
      where: { id: escrow.sellerId },
      relations: ["wallet"],
    });

    if (!seller || !seller.wallet) {
      throw new Error("Seller wallet not found");
    }

    // Add funds to seller's wallet
    seller.wallet.balance =
      Number(seller.wallet.balance) + Number(escrow.totalAmount);
    await this.walletRepository.save(seller.wallet);

    // Update payment status
    if (escrow.paymentId) {
      await this.paymentRepository.update(escrow.paymentId, {
        status: PaymentStatus.COMPLETED,
      });
    }

    // Update escrow status
    escrow.status = EscrowStatus.COMPLETED;
    escrow.completedAt = new Date();

    return this.escrowRepository.save(escrow);
  }

  /**
   * Cancel an escrow and refund buyer
   */
  async cancelEscrow(escrowId: string, userId: string): Promise<Escrow> {
    const escrow = await this.escrowRepository.findOne({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new Error("Escrow not found");
    }

    // Check permissions
    if (userId !== escrow.buyerId && userId !== escrow.sellerId) {
      throw new Error("Only the buyer or seller can cancel the escrow");
    }

    if (
      escrow.status !== EscrowStatus.PENDING &&
      escrow.status !== EscrowStatus.FUNDED
    ) {
      throw new Error("Escrow cannot be cancelled in its current state");
    }

    // If funded, refund the buyer
    if (escrow.status === EscrowStatus.FUNDED) {
      const buyer = await this.userRepository.findOne({
        where: { id: escrow.buyerId },
        relations: ["wallet"],
      });

      if (!buyer || !buyer.wallet) {
        throw new Error("Buyer wallet not found");
      }

      // Add funds back to buyer's wallet
      buyer.wallet.balance =
        Number(buyer.wallet.balance) + Number(escrow.totalAmount);
      await this.walletRepository.save(buyer.wallet);

      // Update payment status if exists
      if (escrow.paymentId) {
        await this.paymentRepository.update(escrow.paymentId, {
          status: PaymentStatus.REFUNDED,
        });
      }
    }

    // Update escrow status
    escrow.status = EscrowStatus.CANCELLED;

    return this.escrowRepository.save(escrow);
  }

  /**
   * Get escrows by user
   */
  async getEscrowsByUser(
    userId: string,
    status?: EscrowStatus,
    limit: number = 10,
    offset: number = 0
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

    const escrows = await queryBuilder
      .orderBy("escrow.createdAt", "DESC")
      .take(limit)
      .skip(offset)
      .getMany();

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
      throw new Error("Escrow not found");
    }

    return escrow;
  }
}
