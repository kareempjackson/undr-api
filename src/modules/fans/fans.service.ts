import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PaymentsService } from "../payments/payments.service";
import { DepositDto, PayCreatorDto, CompleteDepositDto } from "./dto";
import { User, UserRole } from "../../entities/user.entity";
import { Wallet } from "../../entities/wallet.entity";
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from "../../entities/payment.entity";
import { Deposit, DepositStatus } from "../../entities/deposit.entity";

@Injectable()
export class FansService {
  private readonly logger = new Logger(FansService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Deposit)
    private depositRepository: Repository<Deposit>,
    private paymentsService: PaymentsService
  ) {}

  async deposit(userId: string, depositDto: DepositDto) {
    const { amount, paymentMethod } = depositDto;

    // Find user
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["wallet"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Create deposit record
    const deposit = this.depositRepository.create({
      amount,
      method: paymentMethod,
      status: DepositStatus.PENDING,
      userId: user.id,
    });

    await this.depositRepository.save(deposit);

    // Process payment based on method
    let paymentDetails;
    if (paymentMethod === PaymentMethod.CREDIT_CARD) {
      paymentDetails = await this.paymentsService.createStripePaymentIntent(
        amount
      );

      await this.depositRepository.update(deposit.id, {
        transactionId: paymentDetails.id,
      });
    } else if (
      paymentMethod === PaymentMethod.CRYPTO_BTC ||
      paymentMethod === PaymentMethod.CRYPTO_ETH ||
      paymentMethod === PaymentMethod.CRYPTO_USDT
    ) {
      paymentDetails = await this.paymentsService.createCryptoPayment(
        amount,
        paymentMethod
      );
    } else {
      throw new BadRequestException("Unsupported payment method");
    }

    return {
      depositId: deposit.id,
      ...paymentDetails,
    };
  }

  async getDepositStatus(userId: string, depositId: string) {
    const deposit = await this.depositRepository.findOne({
      where: { id: depositId, userId },
      relations: ["user"],
    });

    if (!deposit) {
      throw new NotFoundException(
        `Deposit with ID ${depositId} not found or does not belong to user`
      );
    }

    return {
      status: deposit.status,
      amount: deposit.amount,
      method: deposit.method,
      transactionId: deposit.transactionId,
      createdAt: deposit.createdAt,
    };
  }

  async completeDeposit(
    userId: string,
    completeDepositDto: CompleteDepositDto
  ) {
    const { depositId, paymentIntentId } = completeDepositDto;

    // Find the deposit
    const deposit = await this.depositRepository.findOne({
      where: { id: depositId, userId },
      relations: ["user"],
    });

    if (!deposit) {
      throw new NotFoundException(
        `Deposit with ID ${depositId} not found or does not belong to user`
      );
    }

    // Check if already completed to avoid double processing
    if (deposit.status === DepositStatus.COMPLETED) {
      // Get current wallet balance
      const wallet = await this.walletRepository.findOne({
        where: { userId: deposit.userId },
      });

      return {
        message: "Deposit already completed",
        status: deposit.status,
        walletBalance: wallet?.balance || 0,
        success: true,
      };
    }

    // Update deposit status
    deposit.status = DepositStatus.COMPLETED;
    deposit.transactionId = paymentIntentId;

    // Find and update user's wallet
    const wallet = await this.walletRepository.findOne({
      where: { userId: deposit.userId },
    });

    if (!wallet) {
      throw new NotFoundException(
        `Wallet not found for user ${deposit.userId}`
      );
    }

    // Update wallet balance
    wallet.balance += deposit.amount;
    await this.walletRepository.save(wallet);

    // Save updated deposit
    await this.depositRepository.save(deposit);

    this.logger.log(
      `Manual deposit completion: User ${userId} deposit ${depositId} completed with payment ${paymentIntentId}`
    );

    return {
      message: "Deposit completed successfully",
      status: deposit.status,
      walletBalance: wallet.balance,
      success: true,
    };
  }

  async payCreator(userId: string, payDto: PayCreatorDto) {
    const { creatorId, amount, description } = payDto;

    // Find fan
    const fan = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["wallet"],
    });

    if (!fan) {
      throw new NotFoundException("User not found");
    }

    // Find creator
    const creator = await this.userRepository.findOne({
      where: { id: creatorId, role: UserRole.CREATOR },
      relations: ["wallet"],
    });

    if (!creator) {
      throw new NotFoundException("Creator not found");
    }

    // Check if fan has enough balance
    if (fan.wallet.balance < amount) {
      throw new BadRequestException("Insufficient balance");
    }

    // Create payment record
    const payment = this.paymentRepository.create({
      amount,
      method: PaymentMethod.WALLET,
      status: PaymentStatus.COMPLETED,
      description: description || "Payment to creator",
      fromUserId: fan.id,
      toUserId: creator.id,
    });

    await this.paymentRepository.save(payment);

    // Update wallet balances
    fan.wallet.balance -= amount;
    creator.wallet.balance += amount;

    await this.walletRepository.save(fan.wallet);
    await this.walletRepository.save(creator.wallet);

    return {
      paymentId: payment.id,
      amount,
      status: PaymentStatus.COMPLETED,
      createdAt: payment.createdAt,
    };
  }

  async getTransactionHistory(userId: string) {
    // Check if user exists
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Get deposits
    const deposits = await this.depositRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });

    // Get payments sent
    const paymentsSent = await this.paymentRepository.find({
      where: { fromUserId: userId },
      relations: ["toUser"],
      order: { createdAt: "DESC" },
    });

    // Get payments received
    const paymentsReceived = await this.paymentRepository.find({
      where: { toUserId: userId },
      relations: ["fromUser"],
      order: { createdAt: "DESC" },
    });

    return {
      deposits: deposits.map((d) => ({
        id: d.id,
        type: "DEPOSIT",
        amount: d.amount,
        status: d.status,
        method: d.method,
        createdAt: d.createdAt,
      })),
      paymentsSent: paymentsSent.map((p) => ({
        id: p.id,
        type: "PAYMENT_SENT",
        amount: p.amount,
        status: p.status,
        method: p.method,
        createdAt: p.createdAt,
        recipient: {
          id: p.toUser.id,
          name: p.toUser.name || p.toUser.email,
        },
        description: p.description,
      })),
      paymentsReceived: paymentsReceived.map((p) => ({
        id: p.id,
        type: "PAYMENT_RECEIVED",
        amount: p.amount,
        status: p.status,
        method: p.method,
        createdAt: p.createdAt,
        sender: {
          id: p.fromUser?.id,
          name: p.fromUser?.name || "Anonymous",
        },
        description: p.description,
      })),
    };
  }
}
