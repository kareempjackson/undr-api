import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  Dispute,
  DisputeStatus,
  DisputeReason,
} from "../../entities/dispute.entity";
import { Payment, PaymentStatus } from "../../entities/payment.entity";
import { User } from "../../entities/user.entity";

interface CreateDisputeParams {
  paymentId: string;
  filedByUserId: string;
  reason: DisputeReason;
  description: string;
  evidenceFiles?: string[];
}

interface ResolveDisputeParams {
  disputeId: string;
  resolvedByUserId: string;
  resolveForCustomer: boolean;
  resolutionNotes?: string;
}

interface DisputeEvidence {
  description: string;
  files: string[];
}

@Injectable()
export class DisputeService {
  constructor(
    @InjectRepository(Dispute)
    private disputeRepository: Repository<Dispute>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  /**
   * Create a new dispute for a payment
   */
  async createDispute(params: CreateDisputeParams): Promise<Dispute> {
    const { paymentId, filedByUserId, reason, description, evidenceFiles } =
      params;

    // Check if payment exists
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ["fromUser", "toUser"],
    });

    if (!payment) {
      throw new Error("Payment not found");
    }

    // Check if user is involved in the payment
    if (
      payment.fromUserId !== filedByUserId &&
      payment.toUserId !== filedByUserId
    ) {
      throw new Error("User is not involved in this payment");
    }

    // Check if dispute already exists
    const existingDispute = await this.disputeRepository.findOne({
      where: { paymentId },
    });

    if (existingDispute) {
      throw new Error("Dispute already exists for this payment");
    }

    // Create dispute
    const dispute = new Dispute();
    dispute.paymentId = paymentId;
    dispute.filedByUserId = filedByUserId;
    dispute.reason = reason;
    dispute.description = description;
    dispute.status = DisputeStatus.OPEN;

    if (evidenceFiles) {
      dispute.evidenceFiles = evidenceFiles;
    }

    // Update payment status
    await this.paymentRepository.update(paymentId, {
      status: PaymentStatus.DISPUTED,
      hasDispute: true,
    });

    // Generate a response packet with payment evidence
    dispute.responsePacket = this.generateResponsePacket(payment);

    return this.disputeRepository.save(dispute);
  }

  /**
   * Generate a response packet with payment evidence
   */
  private generateResponsePacket(payment: Payment): any {
    // Extract relevant payment information for dispute resolution
    return {
      paymentDetails: {
        id: payment.id,
        amount: payment.amount,
        date: payment.createdAt,
        description: payment.description,
        method: payment.method,
        status: payment.status,
      },
      customerInfo: {
        userId: payment.fromUserId,
        email: payment.fromUser?.email,
        name: payment.fromUser?.name,
      },
      merchantInfo: {
        userId: payment.toUserId,
        email: payment.toUser?.email,
        name: payment.toUser?.name,
      },
      transactionEvidence: {
        receiptData: payment.receiptData || {},
        invoiceDetails: payment.invoiceDetails || {},
        ipAddress: payment.ipAddress,
        deviceInfo: payment.deviceInfo,
        browserInfo: payment.browserInfo,
        isHighRisk: payment.isHighRisk,
        riskScore: payment.riskScore,
      },
      authenticationData: {
        threeDsStatus: payment.threeDsStatus,
        threeDsResult: payment.threeDsResult,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Add evidence to a dispute
   */
  async addEvidence(
    disputeId: string,
    userId: string,
    evidence: DisputeEvidence
  ): Promise<Dispute> {
    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId },
      relations: ["payment"],
    });

    if (!dispute) {
      throw new Error("Dispute not found");
    }

    // Check if user is involved in the payment
    const payment = dispute.payment;
    if (payment.fromUserId !== userId && payment.toUserId !== userId) {
      throw new Error("User is not involved in this payment");
    }

    // Check if dispute is in a state where evidence can be added
    if (
      [
        DisputeStatus.CLOSED,
        DisputeStatus.RESOLVED_FOR_CUSTOMER,
        DisputeStatus.RESOLVED_FOR_MERCHANT,
      ].includes(dispute.status)
    ) {
      throw new Error("Cannot add evidence to a closed or resolved dispute");
    }

    // Update dispute status to under review
    dispute.status = DisputeStatus.UNDER_REVIEW;

    // Add evidence files
    if (!dispute.evidenceFiles) {
      dispute.evidenceFiles = [];
    }

    dispute.evidenceFiles = [...dispute.evidenceFiles, ...evidence.files];

    // Add evidence to response packet
    if (!dispute.responsePacket) {
      dispute.responsePacket = {};
    }

    const responsePacket = dispute.responsePacket as any;
    if (!responsePacket.evidence) {
      responsePacket.evidence = [];
    }

    responsePacket.evidence.push({
      description: evidence.description,
      files: evidence.files,
      addedBy: userId,
      timestamp: new Date(),
    });

    dispute.responsePacket = responsePacket;

    return this.disputeRepository.save(dispute);
  }

  /**
   * Resolve a dispute
   */
  async resolveDispute(params: ResolveDisputeParams): Promise<Dispute> {
    const { disputeId, resolvedByUserId, resolveForCustomer, resolutionNotes } =
      params;

    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId },
      relations: ["payment"],
    });

    if (!dispute) {
      throw new Error("Dispute not found");
    }

    // Check if dispute is already resolved
    if (
      [
        DisputeStatus.CLOSED,
        DisputeStatus.RESOLVED_FOR_CUSTOMER,
        DisputeStatus.RESOLVED_FOR_MERCHANT,
      ].includes(dispute.status)
    ) {
      throw new Error("Dispute is already resolved or closed");
    }

    // Update dispute status
    dispute.status = resolveForCustomer
      ? DisputeStatus.RESOLVED_FOR_CUSTOMER
      : DisputeStatus.RESOLVED_FOR_MERCHANT;
    dispute.resolvedByUserId = resolvedByUserId;
    dispute.resolutionNotes = resolutionNotes;
    dispute.resolvedAt = new Date();

    // Update payment status based on resolution
    if (dispute.payment) {
      const newStatus = resolveForCustomer
        ? PaymentStatus.REFUNDED
        : PaymentStatus.COMPLETED;
      await this.paymentRepository.update(dispute.payment.id, {
        status: newStatus,
      });
    }

    return this.disputeRepository.save(dispute);
  }

  /**
   * Get all disputes with filters
   */
  async getDisputes(filters: {
    status?: DisputeStatus;
    userId?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ disputes: Dispute[]; total: number }> {
    const { status, userId, limit = 10, offset = 0 } = filters;

    const queryBuilder = this.disputeRepository
      .createQueryBuilder("dispute")
      .leftJoinAndSelect("dispute.payment", "payment")
      .leftJoinAndSelect("dispute.filedByUser", "filedByUser")
      .leftJoinAndSelect("dispute.resolvedByUser", "resolvedByUser");

    if (status) {
      queryBuilder.andWhere("dispute.status = :status", { status });
    }

    if (userId) {
      queryBuilder.andWhere(
        "(payment.fromUserId = :userId OR payment.toUserId = :userId)",
        { userId }
      );
    }

    const total = await queryBuilder.getCount();

    const disputes = await queryBuilder
      .orderBy("dispute.createdAt", "DESC")
      .take(limit)
      .skip(offset)
      .getMany();

    return { disputes, total };
  }

  /**
   * Get dispute by ID
   */
  async getDisputeById(disputeId: string): Promise<Dispute> {
    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId },
      relations: [
        "payment",
        "filedByUser",
        "resolvedByUser",
        "payment.fromUser",
        "payment.toUser",
      ],
    });

    if (!dispute) {
      throw new Error("Dispute not found");
    }

    return dispute;
  }
}
