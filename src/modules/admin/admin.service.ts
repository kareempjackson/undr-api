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
} from "typeorm";
import { User, UserRole, UserStatus } from "../../entities/user.entity";
import { Payment, PaymentStatus } from "../../entities/payment.entity";
import { format, subDays, subMonths } from "date-fns";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>
  ) {}

  async getAllUsers() {
    return this.userRepository.find({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        status: true,
      },
    });
  }

  async getAllTransactions() {
    return this.paymentRepository.find({
      relations: ["fromUser", "toUser"],
    });
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

    return { success: true, message: `User status updated to ${status}` };
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
}
