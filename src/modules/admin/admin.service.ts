import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Repository,
  Between,
  LessThanOrEqual,
  LessThan,
  MoreThanOrEqual,
  Like,
  In,
} from "typeorm";
import { User, UserRole, UserStatus } from "../../entities/user.entity";
import { Payment } from "../../entities/payment.entity";
import { PaymentStatus } from "../../entities/common.enums";
import { format, subDays, subMonths } from "date-fns";
import {
  Dispute,
  DisputeResolution,
  DisputeStatus,
} from "../../entities/dispute.entity";
import { Escrow, EscrowStatus } from "../../entities/escrow.entity";
import { Wallet } from "../../entities/wallet.entity";
import { DisputeEvidence } from "../../entities/dispute-evidence.entity";
import { DisputeMessage } from "../../entities/dispute-message.entity";
import { Withdrawal } from "../../entities/withdrawal.entity";
import { Deposit } from "../../entities/deposit.entity";
import { TransactionLog } from "../../entities/transaction-log.entity";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Dispute)
    private disputeRepository: Repository<Dispute>,
    @InjectRepository(Escrow)
    private escrowRepository: Repository<Escrow>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(DisputeEvidence)
    private disputeEvidenceRepository: Repository<DisputeEvidence>,
    @InjectRepository(DisputeMessage)
    private disputeMessageRepository: Repository<DisputeMessage>,
    @InjectRepository(Withdrawal)
    private withdrawalRepository: Repository<Withdrawal>,
    @InjectRepository(Deposit)
    private depositRepository: Repository<Deposit>,
    @InjectRepository(TransactionLog)
    private transactionLogRepository: Repository<TransactionLog>
  ) {}

  // USER MANAGEMENT METHODS
  async getAllUsers(
    search?: string,
    role?: UserRole,
    status?: UserStatus,
    page = 1,
    limit = 10
  ) {
    const skip = (page - 1) * limit;
    const queryBuilder = this.userRepository.createQueryBuilder("user");

    if (search) {
      queryBuilder.where(
        "(user.email ILIKE :search OR user.alias ILIKE :search OR user.name ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (role) {
      queryBuilder.andWhere("user.role = :role", { role });
    }

    if (status) {
      queryBuilder.andWhere("user.status = :status", { status });
    }

    const [users, total] = await Promise.all([
      queryBuilder
        .select([
          "user.id",
          "user.email",
          "user.name",
          "user.alias",
          "user.role",
          "user.status",
          "user.createdAt",
          "user.updatedAt",
          "user.profileImage",
        ])
        .skip(skip)
        .take(limit)
        .getMany(),
      queryBuilder.getCount(),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserDetails(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["wallet"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Get user transaction counts
    const [paymentsSent, paymentsReceived, disputes, withdrawals, deposits] =
      await Promise.all([
        this.paymentRepository.count({ where: { fromUser: { id: userId } } }),
        this.paymentRepository.count({ where: { toUser: { id: userId } } }),
        this.disputeRepository.count({ where: { createdById: userId } }),
        this.withdrawalRepository.count({ where: { user: { id: userId } } }),
        this.depositRepository.count({ where: { user: { id: userId } } }),
      ]);

    return {
      user,
      stats: {
        paymentsSent,
        paymentsReceived,
        disputes,
        withdrawals,
        deposits,
      },
    };
  }

  async updateUserStatus(userId: string, status: string) {
    // Validate status
    if (!Object.values(UserStatus).includes(status as UserStatus)) {
      throw new BadRequestException("Invalid status");
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.userRepository.update(userId, { status: status as UserStatus });

    // Log the status change
    await this.transactionLogRepository.save({
      userId,
      action: "USER_STATUS_CHANGE",
      details: {
        oldStatus: user.status,
        newStatus: status,
      },
    });

    return { success: true, message: `User status updated to ${status}` };
  }

  async updateUserRole(userId: string, role: string) {
    // Validate role
    if (!Object.values(UserRole).includes(role as UserRole)) {
      throw new BadRequestException("Invalid role");
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.userRepository.update(userId, { role: role as UserRole });

    // Log the role change
    await this.transactionLogRepository.save({
      userId,
      action: "USER_ROLE_CHANGE",
      details: {
        oldRole: user.role,
        newRole: role,
      },
    });

    return { success: true, message: `User role updated to ${role}` };
  }

  async flagUser(userId: string, reason: string, details?: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // If the user is already flagged, remove the flag
    if (user.status === UserStatus.SUSPENDED) {
      await this.userRepository.update(userId, { status: UserStatus.ACTIVE });

      // Log the flag removal
      await this.transactionLogRepository.save({
        userId,
        action: "USER_FLAG_REMOVED",
        details: {
          previousReason: reason,
        },
      });

      return { success: true, message: "User flag removed" };
    }

    // Otherwise, flag the user
    await this.userRepository.update(userId, { status: UserStatus.SUSPENDED });

    // Log the flag
    await this.transactionLogRepository.save({
      userId,
      action: "USER_FLAGGED",
      details: {
        reason,
        details,
      },
    });

    return { success: true, message: "User flagged" };
  }

  async getAllTransactions() {
    return this.paymentRepository.find({
      relations: ["fromUser", "toUser"],
    });
  }

  // Helper function to get date range based on timeframe
  private getDateRange(timeframe: string) {
    const now = new Date();

    switch (timeframe) {
      case "7days":
        return { start: subDays(now, 7), end: now };
      case "30days":
        return { start: subDays(now, 30), end: now };
      case "90days":
        return { start: subDays(now, 90), end: now };
      case "12months":
        return { start: subMonths(now, 12), end: now };
      default:
        return { start: subDays(now, 30), end: now }; // Default to 30 days
    }
  }

  // Get all analytics data
  async getAnalytics(timeframe: string) {
    const { start, end } = this.getDateRange(timeframe);

    const [
      summaryData,
      revenueData,
      userData,
      transactionData,
      topCreators,
      paymentMethods,
    ] = await Promise.all([
      this.getSummaryData(start, end),
      this.getRevenueData(timeframe),
      this.getUserData(timeframe),
      this.getTransactionData(timeframe),
      this.getTopCreators(5),
      this.getPaymentMethodsDistribution(),
    ]);

    return {
      summary: summaryData,
      revenueData,
      userData,
      transactionData,
      topCreators,
      paymentMethods,
    };
  }

  // Get summary data (total revenue, users, creators, transactions)
  private async getSummaryData(start: Date, end: Date) {
    // Total revenue
    const completedPayments = await this.paymentRepository.find({
      where: {
        status: PaymentStatus.COMPLETED,
        createdAt: Between(start, end),
      },
    });

    const totalRevenue = completedPayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    // Total users
    const totalUsers = await this.userRepository.count({
      where: {
        createdAt: LessThanOrEqual(end),
        role: UserRole.FAN,
      },
    });

    // Total creators
    const totalCreators = await this.userRepository.count({
      where: {
        createdAt: LessThanOrEqual(end),
        role: UserRole.CREATOR,
      },
    });

    // Total transactions
    const totalTransactions = await this.paymentRepository.count({
      where: {
        createdAt: Between(start, end),
      },
    });

    // Get previous period data for growth calculation
    const prevStart = new Date(start);
    prevStart.setDate(
      prevStart.getDate() -
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Previous period revenue
    const prevCompletedPayments = await this.paymentRepository.find({
      where: {
        status: PaymentStatus.COMPLETED,
        createdAt: Between(prevStart, start),
      },
    });

    const prevRevenue = prevCompletedPayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    // Previous period users
    const prevUsers = await this.userRepository.count({
      where: {
        createdAt: LessThan(start),
        role: UserRole.FAN,
      },
    });

    // Previous period creators
    const prevCreators = await this.userRepository.count({
      where: {
        createdAt: LessThan(start),
        role: UserRole.CREATOR,
      },
    });

    // Previous period transactions
    const prevTransactions = await this.paymentRepository.count({
      where: {
        createdAt: Between(prevStart, start),
      },
    });

    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return 100;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      totalRevenue,
      totalUsers,
      totalCreators,
      totalTransactions,
      revenueGrowth: calculateGrowth(totalRevenue, prevRevenue),
      userGrowth: calculateGrowth(totalUsers, prevUsers),
      creatorGrowth: calculateGrowth(totalCreators, prevCreators),
      transactionGrowth: calculateGrowth(totalTransactions, prevTransactions),
    };
  }

  async getRevenueAnalytics(timeframe: string) {
    return this.getRevenueData(timeframe);
  }

  private async getRevenueData(timeframe: string) {
    const { start, end } = this.getDateRange(timeframe);
    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    let interval = "day";
    let dateFormat = "yyyy-MM-dd";

    if (days > 90) {
      interval = "month";
      dateFormat = "yyyy-MM";
    } else if (days > 31) {
      interval = "week";
      dateFormat = "yyyy-ww"; // ISO week format
    }

    const payments = await this.paymentRepository.find({
      where: {
        createdAt: Between(start, end),
        status: PaymentStatus.COMPLETED,
      },
    });

    // Group by interval
    const revenueByPeriod = {};

    payments.forEach((payment) => {
      let key;
      if (interval === "day") {
        key = format(payment.createdAt, dateFormat);
      } else if (interval === "week") {
        // This is a simplified approach for weeks
        const weekNumber = Math.ceil(
          (payment.createdAt.getDate() +
            new Date(
              payment.createdAt.getFullYear(),
              payment.createdAt.getMonth(),
              1
            ).getDay()) /
            7
        );
        key = `${format(payment.createdAt, "yyyy-MM")}-W${weekNumber}`;
      } else {
        key = format(payment.createdAt, dateFormat);
      }

      revenueByPeriod[key] =
        (revenueByPeriod[key] || 0) + Number(payment.amount);
    });

    // Convert to array format expected by frontend
    const labels = Object.keys(revenueByPeriod).sort();
    const data = labels.map((label) => revenueByPeriod[label]);

    return { labels, data, interval };
  }

  async getUserAnalytics(timeframe: string) {
    return this.getUserData(timeframe);
  }

  private async getUserData(timeframe: string) {
    const { start, end } = this.getDateRange(timeframe);
    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Use same interval logic as revenue
    let interval = "day";
    let dateFormat = "yyyy-MM-dd";

    if (days > 90) {
      interval = "month";
      dateFormat = "yyyy-MM";
    } else if (days > 31) {
      interval = "week";
      dateFormat = "yyyy-ww";
    }

    // Get all users created in the period
    const users = await this.userRepository.find({
      where: {
        createdAt: Between(start, end),
      },
      select: {
        role: true,
        createdAt: true,
      },
    });

    // Group by interval and role
    const usersByPeriod = {};
    const creatorsByPeriod = {};

    users.forEach((user) => {
      let key;
      if (interval === "day") {
        key = format(user.createdAt, dateFormat);
      } else if (interval === "week") {
        const weekNumber = Math.ceil(
          (user.createdAt.getDate() +
            new Date(
              user.createdAt.getFullYear(),
              user.createdAt.getMonth(),
              1
            ).getDay()) /
            7
        );
        key = `${format(user.createdAt, "yyyy-MM")}-W${weekNumber}`;
      } else {
        key = format(user.createdAt, dateFormat);
      }

      if (user.role === UserRole.FAN) {
        usersByPeriod[key] = (usersByPeriod[key] || 0) + 1;
      } else if (user.role === UserRole.CREATOR) {
        creatorsByPeriod[key] = (creatorsByPeriod[key] || 0) + 1;
      }
    });

    // Convert to array format expected by frontend
    const labels = Array.from(
      new Set([...Object.keys(usersByPeriod), ...Object.keys(creatorsByPeriod)])
    ).sort();

    const userData = labels.map((label) => usersByPeriod[label] || 0);
    const creatorData = labels.map((label) => creatorsByPeriod[label] || 0);

    return {
      labels,
      datasets: [
        {
          label: "Users",
          data: userData,
        },
        {
          label: "Creators",
          data: creatorData,
        },
      ],
      interval,
    };
  }

  async getTransactionAnalytics(timeframe: string) {
    return this.getTransactionData(timeframe);
  }

  private async getTransactionData(timeframe: string) {
    const { start, end } = this.getDateRange(timeframe);
    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Use same interval logic as revenue
    let interval = "day";
    let dateFormat = "yyyy-MM-dd";

    if (days > 90) {
      interval = "month";
      dateFormat = "yyyy-MM";
    } else if (days > 31) {
      interval = "week";
      dateFormat = "yyyy-ww";
    }

    // Get all transactions in the period
    const transactions = await this.paymentRepository.find({
      where: {
        createdAt: Between(start, end),
      },
      select: {
        status: true,
        createdAt: true,
      },
    });

    // Group by interval
    const transactionsByPeriod = {};

    transactions.forEach((transaction) => {
      let key;
      if (interval === "day") {
        key = format(transaction.createdAt, dateFormat);
      } else if (interval === "week") {
        const weekNumber = Math.ceil(
          (transaction.createdAt.getDate() +
            new Date(
              transaction.createdAt.getFullYear(),
              transaction.createdAt.getMonth(),
              1
            ).getDay()) /
            7
        );
        key = `${format(transaction.createdAt, "yyyy-MM")}-W${weekNumber}`;
      } else {
        key = format(transaction.createdAt, dateFormat);
      }

      transactionsByPeriod[key] = (transactionsByPeriod[key] || 0) + 1;
    });

    // Convert to array format expected by frontend
    const labels = Object.keys(transactionsByPeriod).sort();
    const data = labels.map((label) => transactionsByPeriod[label]);

    return { labels, data, interval };
  }

  async getTopCreators(limit: number = 5) {
    // Get creators with their received payments
    const creators = await this.userRepository.find({
      where: {
        role: UserRole.CREATOR,
      },
      relations: ["paymentsReceived"],
    });

    // Calculate total revenue for each creator
    const topCreators = creators.map((creator) => {
      const totalRevenue = creator.paymentsReceived
        .filter((payment) => payment.status === PaymentStatus.COMPLETED)
        .reduce((sum, payment) => sum + Number(payment.amount), 0);

      return {
        id: creator.id,
        name: creator.name,
        email: creator.email,
        totalRevenue,
        // Calculate growth - in a real implementation you would compare to previous period
        growth: Math.floor(Math.random() * 40) - 10, // Dummy data
        fanCount: Math.floor(Math.random() * 1000) + 10, // Dummy data
      };
    });

    // Sort by revenue and limit results
    return topCreators
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);
  }

  async getPaymentMethodsDistribution() {
    // Get payment method distribution
    const payments = await this.paymentRepository.find({
      where: {
        status: PaymentStatus.COMPLETED,
      },
      select: {
        method: true,
        amount: true,
      },
    });

    // Group by payment method
    const methodTotals = {};

    payments.forEach((payment) => {
      const method = payment.method || "UNKNOWN";
      methodTotals[method] =
        (methodTotals[method] || 0) + Number(payment.amount);
    });

    // Convert to array format expected by frontend
    const labels = Object.keys(methodTotals);
    const data = labels.map((label) => methodTotals[label]);

    return { labels, data };
  }

  // ESCROW MANAGEMENT METHODS
  async getAllEscrows(
    status?: EscrowStatus,
    search?: string,
    page = 1,
    limit = 10
  ) {
    const skip = (page - 1) * limit;
    const queryBuilder = this.escrowRepository
      .createQueryBuilder("escrow")
      .leftJoinAndSelect("escrow.buyer", "buyer")
      .leftJoinAndSelect("escrow.seller", "seller");

    if (search) {
      queryBuilder.where(
        "(escrow.title ILIKE :search OR escrow.id::text ILIKE :search OR buyer.alias ILIKE :search OR seller.alias ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (status) {
      queryBuilder.andWhere("escrow.status = :status", { status });
    }

    const [escrows, total] = await Promise.all([
      queryBuilder
        .select([
          "escrow.id",
          "escrow.totalAmount",
          "escrow.title",
          "escrow.status",
          "escrow.createdAt",
          "escrow.expiresAt",
          "escrow.completedAt",
          "buyer.id",
          "buyer.alias",
          "seller.id",
          "seller.alias",
        ])
        .orderBy("escrow.createdAt", "DESC")
        .skip(skip)
        .take(limit)
        .getMany(),
      queryBuilder.getCount(),
    ]);

    return {
      escrows,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getEscrowDetails(escrowId: string) {
    const escrow = await this.escrowRepository.findOne({
      where: { id: escrowId },
      relations: ["buyer", "seller", "milestones", "disputes", "payment"],
    });

    if (!escrow) {
      throw new NotFoundException("Escrow not found");
    }

    return { escrow };
  }

  async releaseEscrow(escrowId: string) {
    const escrow = await this.escrowRepository.findOne({
      where: { id: escrowId },
      relations: ["buyer", "seller", "payment"],
    });

    if (!escrow) {
      throw new NotFoundException("Escrow not found");
    }

    if (
      escrow.status !== EscrowStatus.FUNDED &&
      escrow.status !== EscrowStatus.DISPUTED
    ) {
      throw new BadRequestException(
        `Cannot release escrow in ${escrow.status} status`
      );
    }

    // Update escrow status
    await this.escrowRepository.update(escrowId, {
      status: EscrowStatus.RELEASED,
      completedAt: new Date(),
    });

    // Transfer funds to seller's wallet
    const sellerWallet = await this.walletRepository.findOne({
      where: { user: { id: escrow.sellerId } },
    });

    if (!sellerWallet) {
      throw new NotFoundException("Seller wallet not found");
    }

    // Increase seller's wallet balance
    await this.walletRepository.update(sellerWallet.id, {
      balance: Number(sellerWallet.balance) + Number(escrow.totalAmount),
    });

    // Log the transaction
    await this.transactionLogRepository.save({
      userId: escrow.sellerId,
      action: "ESCROW_RELEASE",
      amount: escrow.totalAmount,
      details: {
        escrowId,
        releasedBy: "ADMIN",
      },
    });

    return { success: true, message: "Escrow funds released to seller" };
  }

  async refundEscrow(escrowId: string) {
    const escrow = await this.escrowRepository.findOne({
      where: { id: escrowId },
      relations: ["buyer", "seller", "payment"],
    });

    if (!escrow) {
      throw new NotFoundException("Escrow not found");
    }

    if (
      escrow.status !== EscrowStatus.FUNDED &&
      escrow.status !== EscrowStatus.DISPUTED
    ) {
      throw new BadRequestException(
        `Cannot refund escrow in ${escrow.status} status`
      );
    }

    // Update escrow status
    await this.escrowRepository.update(escrowId, {
      status: EscrowStatus.REFUNDED,
      completedAt: new Date(),
    });

    // Transfer funds back to buyer's wallet
    const buyerWallet = await this.walletRepository.findOne({
      where: { user: { id: escrow.buyerId } },
    });

    if (!buyerWallet) {
      throw new NotFoundException("Buyer wallet not found");
    }

    // Increase buyer's wallet balance
    await this.walletRepository.update(buyerWallet.id, {
      balance: Number(buyerWallet.balance) + Number(escrow.totalAmount),
    });

    // Log the transaction
    await this.transactionLogRepository.save({
      userId: escrow.buyerId,
      action: "ESCROW_REFUND",
      amount: escrow.totalAmount,
      details: {
        escrowId,
        refundedBy: "ADMIN",
      },
    });

    return { success: true, message: "Escrow funds refunded to buyer" };
  }

  // DISPUTE MANAGEMENT METHODS
  async getAllDisputes(
    status?: DisputeStatus,
    search?: string,
    page = 1,
    limit = 10
  ) {
    const skip = (page - 1) * limit;

    const queryBuilder = this.disputeRepository
      .createQueryBuilder("dispute")
      .leftJoinAndSelect("dispute.escrow", "escrow")
      .leftJoinAndSelect("dispute.createdBy", "createdBy")
      .leftJoinAndSelect("escrow.buyer", "buyer")
      .leftJoinAndSelect("escrow.seller", "seller");

    if (search) {
      queryBuilder.where(
        "(dispute.id::text ILIKE :search OR escrow.id::text ILIKE :search OR buyer.alias ILIKE :search OR seller.alias ILIKE :search OR dispute.reason ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (status) {
      queryBuilder.andWhere("dispute.status = :status", { status });
    }

    const [disputes, total] = await Promise.all([
      queryBuilder
        .select([
          "dispute.id",
          "dispute.status",
          "dispute.reason",
          "dispute.createdAt",
          "dispute.resolvedAt",
          "dispute.resolution",
          "escrow.id",
          "escrow.totalAmount",
          "escrow.title",
          "createdBy.id",
          "createdBy.alias",
          "buyer.id",
          "buyer.alias",
          "seller.id",
          "seller.alias",
        ])
        .orderBy("dispute.createdAt", "DESC")
        .skip(skip)
        .take(limit)
        .getMany(),
      queryBuilder.getCount(),
    ]);

    return {
      disputes,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getDisputeDetails(disputeId: string) {
    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId },
      relations: [
        "escrow",
        "createdBy",
        "reviewedBy",
        "escrow.buyer",
        "escrow.seller",
        "evidence",
        "messages",
        "messages.sender",
      ],
    });

    if (!dispute) {
      throw new NotFoundException("Dispute not found");
    }

    return { dispute };
  }

  async resolveDispute(
    disputeId: string,
    resolution: DisputeResolution,
    notes?: string,
    buyerAmount?: number,
    sellerAmount?: number
  ) {
    const dispute = await this.disputeRepository.findOne({
      where: { id: disputeId },
      relations: ["escrow", "escrow.buyer", "escrow.seller"],
    });

    if (!dispute) {
      throw new NotFoundException("Dispute not found");
    }

    if (
      dispute.status === DisputeStatus.RESOLVED_BY_ADMIN ||
      dispute.status === DisputeStatus.MUTUALLY_RESOLVED ||
      dispute.status === DisputeStatus.CLOSED
    ) {
      throw new BadRequestException(`Dispute is already resolved`);
    }

    const escrow = dispute.escrow;
    const totalAmount = Number(escrow.totalAmount);

    // Handle different resolution types
    switch (resolution) {
      case DisputeResolution.BUYER_REFUND:
        // Refund 100% to buyer
        buyerAmount = totalAmount;
        sellerAmount = 0;
        break;

      case DisputeResolution.SELLER_RECEIVE:
        // Give 100% to seller
        buyerAmount = 0;
        sellerAmount = totalAmount;
        break;

      case DisputeResolution.SPLIT:
        // Split 50/50
        buyerAmount = totalAmount / 2;
        sellerAmount = totalAmount / 2;
        break;

      case DisputeResolution.CUSTOM:
        // Use the provided amounts
        if (buyerAmount === undefined || sellerAmount === undefined) {
          throw new BadRequestException(
            "Custom resolution requires buyerAmount and sellerAmount"
          );
        }

        // Ensure amounts match the total
        if (Number(buyerAmount) + Number(sellerAmount) !== totalAmount) {
          throw new BadRequestException(
            "Sum of buyer and seller amounts must equal the escrow total"
          );
        }
        break;

      default:
        throw new BadRequestException("Invalid resolution type");
    }

    // Update dispute
    await this.disputeRepository.update(disputeId, {
      status: DisputeStatus.RESOLVED_BY_ADMIN,
      resolution,
      buyerAmount,
      sellerAmount,
      resolvedAt: new Date(),
      resolutionNotes: notes,
    });

    // Update escrow status
    await this.escrowRepository.update(escrow.id, {
      status: EscrowStatus.COMPLETED,
      completedAt: new Date(),
    });

    // Transfer funds
    if (buyerAmount > 0) {
      const buyerWallet = await this.walletRepository.findOne({
        where: { user: { id: escrow.buyerId } },
      });

      if (buyerWallet) {
        await this.walletRepository.update(buyerWallet.id, {
          balance: Number(buyerWallet.balance) + buyerAmount,
        });

        // Log the transaction
        await this.transactionLogRepository.save({
          userId: escrow.buyerId,
          action: "DISPUTE_RESOLUTION_REFUND",
          amount: buyerAmount,
          details: {
            disputeId,
            escrowId: escrow.id,
            resolution,
          },
        });
      }
    }

    if (sellerAmount > 0) {
      const sellerWallet = await this.walletRepository.findOne({
        where: { user: { id: escrow.sellerId } },
      });

      if (sellerWallet) {
        await this.walletRepository.update(sellerWallet.id, {
          balance: Number(sellerWallet.balance) + sellerAmount,
        });

        // Log the transaction
        await this.transactionLogRepository.save({
          userId: escrow.sellerId,
          action: "DISPUTE_RESOLUTION_RELEASE",
          amount: sellerAmount,
          details: {
            disputeId,
            escrowId: escrow.id,
            resolution,
          },
        });
      }
    }

    return {
      success: true,
      message: "Dispute resolved successfully",
      resolution: {
        type: resolution,
        buyerAmount,
        sellerAmount,
        notes,
      },
    };
  }

  // CHARGEBACK BUFFER METHODS
  async getChargebackBufferDetails() {
    // Get the chargeback buffer settings
    // In a real implementation, this would be a configured value or a database entity
    const chargebackBufferWallet = await this.walletRepository.findOne({
      where: { chargebackBuffer: true },
    });

    if (!chargebackBufferWallet) {
      throw new NotFoundException("Chargeback buffer wallet not found");
    }

    // Calculate stats
    const now = new Date();
    const oneMonthAgo = subMonths(now, 1);

    // Get buffer events (deposits/withdrawals) from transaction log
    const bufferEvents = await this.transactionLogRepository.find({
      where: [
        { action: "CHARGEBACK_BUFFER_ALLOCATION" },
        { action: "CHARGEBACK_BUFFER_DEDUCTION" },
      ],
      order: { createdAt: "DESC" },
    });

    // Calculate monthly metrics
    const lastMonthEvents = bufferEvents.filter(
      (event) => new Date(event.createdAt) >= oneMonthAgo
    );

    const totalAllocated = bufferEvents
      .filter((event) => event.action === "CHARGEBACK_BUFFER_ALLOCATION")
      .reduce((sum, event) => sum + Number(event.amount || 0), 0);

    const totalDeducted = bufferEvents
      .filter((event) => event.action === "CHARGEBACK_BUFFER_DEDUCTION")
      .reduce((sum, event) => sum + Number(event.amount || 0), 0);

    const lastMonthAllocated = lastMonthEvents
      .filter((event) => event.action === "CHARGEBACK_BUFFER_ALLOCATION")
      .reduce((sum, event) => sum + Number(event.amount || 0), 0);

    const lastMonthDeducted = lastMonthEvents
      .filter((event) => event.action === "CHARGEBACK_BUFFER_DEDUCTION")
      .reduce((sum, event) => sum + Number(event.amount || 0), 0);

    return {
      currentBalance: chargebackBufferWallet.balance,
      stats: {
        totalAllocated,
        totalDeducted,
        lastMonthAllocated,
        lastMonthDeducted,
        bufferUtilization:
          (totalDeducted /
            (Number(chargebackBufferWallet.balance) + totalDeducted)) *
          100,
        chargebackCount: bufferEvents.filter(
          (e) => e.action === "CHARGEBACK_BUFFER_DEDUCTION"
        ).length,
      },
    };
  }

  async getChargebackBufferEvents(page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    // Get buffer events from transaction log
    const [events, total] = await Promise.all([
      this.transactionLogRepository.find({
        where: [
          { action: "CHARGEBACK_BUFFER_ALLOCATION" },
          { action: "CHARGEBACK_BUFFER_DEDUCTION" },
        ],
        order: { createdAt: "DESC" },
        skip,
        take: limit,
      }),
      this.transactionLogRepository.count({
        where: [
          { action: "CHARGEBACK_BUFFER_ALLOCATION" },
          { action: "CHARGEBACK_BUFFER_DEDUCTION" },
        ],
      }),
    ]);

    // Format the events
    const formattedEvents = events.map((event) => ({
      id: event.id,
      type:
        event.action === "CHARGEBACK_BUFFER_ALLOCATION" ? "credit" : "debit",
      amount: event.amount,
      reason: event.details?.reason || event.action,
      escrowId: event.details?.escrowId,
      relatedUser: event.details?.relatedUser,
      createdAt: event.createdAt,
      balance: event.details?.balanceAfter,
    }));

    return {
      events: formattedEvents,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async allocateToChargebackBuffer(amount: number) {
    if (amount <= 0) {
      throw new BadRequestException("Allocation amount must be positive");
    }

    // Get the chargeback buffer wallet
    const chargebackBufferWallet = await this.walletRepository.findOne({
      where: { chargebackBuffer: true },
    });

    if (!chargebackBufferWallet) {
      throw new NotFoundException("Chargeback buffer wallet not found");
    }

    // Update the balance
    const newBalance = Number(chargebackBufferWallet.balance) + amount;
    await this.walletRepository.update(chargebackBufferWallet.id, {
      balance: newBalance,
    });

    // Log the transaction
    await this.transactionLogRepository.save({
      action: "CHARGEBACK_BUFFER_ALLOCATION",
      amount,
      details: {
        reason: "Admin allocation",
        balanceBefore: chargebackBufferWallet.balance,
        balanceAfter: newBalance,
      },
    });

    return {
      success: true,
      message: `Successfully allocated ${amount} to chargeback buffer`,
      newBalance,
    };
  }

  // SYSTEM LOGS METHODS
  async getSystemLogs(
    type?: string,
    level?: string,
    search?: string,
    startDate?: Date,
    endDate?: Date,
    page = 1,
    limit = 10
  ) {
    const skip = (page - 1) * limit;

    const queryBuilder = this.transactionLogRepository
      .createQueryBuilder("log")
      .leftJoinAndSelect("log.user", "user");

    // Apply filters
    if (type) {
      queryBuilder.andWhere("log.action ILIKE :type", { type: `%${type}%` });
    }

    if (level) {
      queryBuilder.andWhere("log.level = :level", { level });
    }

    if (search) {
      queryBuilder.andWhere(
        "(log.action ILIKE :search OR log.details::text ILIKE :search OR user.alias ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (startDate) {
      queryBuilder.andWhere("log.createdAt >= :startDate", { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere("log.createdAt <= :endDate", { endDate });
    }

    const [logs, total] = await Promise.all([
      queryBuilder
        .select([
          "log.id",
          "log.action",
          "log.details",
          "log.amount",
          "log.createdAt",
          "log.level",
          "user.id",
          "user.alias",
        ])
        .orderBy("log.createdAt", "DESC")
        .skip(skip)
        .take(limit)
        .getMany(),
      queryBuilder.getCount(),
    ]);

    // Format the logs for the frontend
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      type: this.getLogTypeFromAction(log.action),
      action: log.action,
      timestamp: log.createdAt,
      userAlias: log.user?.alias,
      userId: log.user?.id,
      adminId: log.details?.adminId,
      metadata: log.details,
      level: log.level || "info",
      ipAddress: log.details?.ipAddress,
      userAgent: log.details?.userAgent,
    }));

    return {
      logs: formattedLogs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  // Helper function to map action to log type
  private getLogTypeFromAction(action: string): string {
    if (action.includes("ESCROW")) {
      return "ESCROW_EVENT";
    } else if (action.includes("DISPUTE")) {
      return "DISPUTE";
    } else if (action.includes("PAYMENT") || action.includes("STRIPE")) {
      return "STRIPE_WEBHOOK";
    } else if (action.includes("ADMIN")) {
      return "ADMIN_ACTION";
    } else if (action.includes("USER")) {
      return "USER_EVENT";
    } else if (
      action.includes("LOGIN") ||
      action.includes("PASSWORD") ||
      action.includes("SECURITY")
    ) {
      return "SECURITY_EVENT";
    } else {
      return "SYSTEM_EVENT";
    }
  }
}
