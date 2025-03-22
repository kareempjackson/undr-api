import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole } from "../../entities/user.entity";
import { Payment, PaymentStatus } from "../../entities/payment.entity";
import { Wallet } from "../../entities/wallet.entity";
import { ConfigService } from "@nestjs/config";
import { AliasService } from "../common/services/alias.service";

@Injectable()
export class CreatorsService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private configService: ConfigService,
    private aliasService: AliasService
  ) {}

  async getDashboard(creatorId: string) {
    const creator = await this.userRepository.findOne({
      where: { id: creatorId },
      relations: ["wallet"],
    });

    if (!creator || creator.role !== UserRole.CREATOR) {
      throw new NotFoundException("Creator not found");
    }

    // Count total number of payments received
    const paymentCount = await this.paymentRepository.count({
      where: { toUserId: creatorId },
    });

    // Get total earnings
    const payments = await this.paymentRepository.find({
      where: {
        toUserId: creatorId,
        status: PaymentStatus.COMPLETED,
      },
    });

    const totalEarnings = payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    // Get recent transactions
    const recentTransactions = await this.paymentRepository.find({
      where: { toUserId: creatorId },
      order: { createdAt: "DESC" },
      take: 5,
      relations: ["fromUser"],
    });

    return {
      balance: creator.wallet?.balance || 0,
      totalEarnings,
      paymentCount,
      recentTransactions,
    };
  }

  async getEarnings(creatorId: string) {
    const creator = await this.userRepository.findOne({
      where: { id: creatorId },
    });

    if (!creator || creator.role !== UserRole.CREATOR) {
      throw new NotFoundException("Creator not found");
    }

    // Get all completed payments
    const payments = await this.paymentRepository.find({
      where: {
        toUserId: creatorId,
        status: PaymentStatus.COMPLETED,
      },
      order: { createdAt: "DESC" },
    });

    // Calculate earnings by month
    const earningsByMonth = payments.reduce((acc, payment) => {
      const date = new Date(payment.createdAt);
      const month = `${date.getFullYear()}-${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}`;

      if (!acc[month]) {
        acc[month] = 0;
      }

      acc[month] += payment.amount;
      return acc;
    }, {});

    return {
      earningsByMonth,
      totalEarnings: payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
      ),
      transactionCount: payments.length,
    };
  }

  /**
   * Get a creator's payment link using their ID
   */
  async getPaymentLink(creatorId: string) {
    const creator = await this.userRepository.findOne({
      where: { id: creatorId },
    });

    if (!creator || creator.role !== UserRole.CREATOR) {
      throw new NotFoundException("Creator not found");
    }

    // Generate alias if needed
    const alias = await this.aliasService.generateUniqueAlias(creatorId);

    // Get base URL from config
    const frontendUrl =
      this.configService.get<string>("FRONTEND_URL") || "http://localhost:3000";

    // Return payment link info
    return {
      alias,
      paymentUrl: `${frontendUrl}/pay/${alias}`,
      apiEndpoint: `/api/fans/pay/${alias}`,
    };
  }

  /**
   * Get a creator's payment link using their alias
   */
  async getPaymentLinkByAlias(alias: string) {
    // Find creator by alias
    const creator = await this.aliasService.findUserByAlias(alias);

    // Verify user is a creator
    if (creator.role !== UserRole.CREATOR) {
      throw new NotFoundException("Creator not found");
    }

    // Get base URL from config
    const frontendUrl =
      this.configService.get<string>("FRONTEND_URL") || "http://localhost:3000";

    // Return payment link info (excluding user ID)
    return {
      alias,
      paymentUrl: `${frontendUrl}/pay/${alias}`,
      apiEndpoint: `/api/fans/pay/${alias}`,
    };
  }
}
