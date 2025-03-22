import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PaymentsService } from "../payments/payments.service";
import {
  DepositDto,
  PayCreatorDto,
  CompleteDepositDto,
  PayByAliasDto,
} from "./dto";
import { User, UserRole } from "../../entities/user.entity";
import { Wallet } from "../../entities/wallet.entity";
import {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from "../../entities/payment.entity";
import { Deposit, DepositStatus } from "../../entities/deposit.entity";
import { AliasService } from "../common/services/alias.service";

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
    private paymentsService: PaymentsService,
    private aliasService: AliasService
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

    // Find sender and recipient
    const [sender, recipient] = await Promise.all([
      this.userRepository.findOne({
        where: { id: userId },
        relations: ["wallet"],
      }),
      this.userRepository.findOne({
        where: { id: creatorId },
        relations: ["wallet"],
      }),
    ]);

    if (!sender) {
      throw new NotFoundException("Sender not found");
    }

    if (!recipient) {
      throw new NotFoundException("Creator not found");
    }

    // Ensure both users have aliases
    const [senderAlias, recipientAlias] = await Promise.all([
      this.aliasService.generateUniqueAlias(userId),
      this.aliasService.generateUniqueAlias(creatorId),
    ]);

    // Validate wallet exists
    if (!sender.wallet) {
      throw new BadRequestException("Sender has no wallet");
    }

    if (!recipient.wallet) {
      throw new BadRequestException("Creator has no wallet");
    }

    // Check if recipient is a creator
    if (recipient.role !== UserRole.CREATOR) {
      throw new BadRequestException("Recipient is not a creator");
    }

    // Check if sender has enough balance
    if (sender.wallet.balance < amount) {
      throw new BadRequestException("Insufficient balance");
    }

    // Create payment transaction
    const payment = this.paymentRepository.create({
      amount,
      status: PaymentStatus.COMPLETED,
      method: PaymentMethod.WALLET,
      description: description || "Payment to creator",
      fromUserId: sender.id,
      toUserId: recipient.id,
      fromAlias: senderAlias,
      toAlias: recipientAlias,
      metadata: {
        description: description,
        method: PaymentMethod.WALLET,
      },
    });

    // Save payment
    await this.paymentRepository.save(payment);

    // Update wallets
    sender.wallet.balance -= amount;
    recipient.wallet.balance += amount;

    await this.walletRepository.save([sender.wallet, recipient.wallet]);

    // Return success response with aliases instead of user IDs
    return {
      success: true,
      paymentId: payment.id,
      fromAlias: senderAlias,
      toAlias: recipientAlias,
      amount,
      status: payment.status,
      timestamp: payment.createdAt,
      metadata: payment.metadata,
    };
  }

  async getTransactionHistory(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Generate alias if needed
    const userAlias = await this.aliasService.generateUniqueAlias(userId);

    // Get transactions where user is sender or recipient
    const payments = await this.paymentRepository.find({
      where: [{ fromUserId: userId }, { toUserId: userId }],
      order: { createdAt: "DESC" },
      relations: ["fromUser", "toUser"],
    });

    // Ensure aliases are used instead of IDs in the response
    const transactions = await Promise.all(
      payments.map(async (payment) => {
        // Make sure we have aliases for both users
        if (!payment.fromAlias) {
          payment.fromAlias = await this.aliasService.generateUniqueAlias(
            payment.fromUserId
          );
        }

        if (!payment.toAlias) {
          payment.toAlias = await this.aliasService.generateUniqueAlias(
            payment.toUserId
          );
        }

        return {
          id: payment.id,
          amount: payment.amount,
          status: payment.status,
          description: payment.description,
          fromAlias: payment.fromAlias,
          toAlias: payment.toAlias,
          direction: payment.fromUserId === userId ? "outgoing" : "incoming",
          timestamp: payment.createdAt,
          method: payment.method,
          metadata: payment.metadata || {},
        };
      })
    );

    return {
      userAlias,
      transactions,
    };
  }

  /**
   * Pay a creator using their alias instead of ID
   */
  async payByAlias(userId: string, payDto: PayByAliasDto) {
    // Find sender
    const sender = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["wallet"],
    });

    if (!sender) {
      throw new NotFoundException("User not found");
    }

    // Ensure sender has an alias
    const senderAlias = await this.aliasService.generateUniqueAlias(userId);

    // Find recipient by alias
    const recipient = await this.aliasService.findUserByAlias(payDto.toAlias);

    // Validate wallet exists
    if (!sender.wallet) {
      throw new BadRequestException("Sender has no wallet");
    }

    if (!recipient.wallet) {
      throw new BadRequestException("Recipient has no wallet");
    }

    // Check if recipient is a creator
    if (recipient.role !== UserRole.CREATOR) {
      throw new BadRequestException("Recipient is not a creator");
    }

    // Check if sender has enough balance
    if (sender.wallet.balance < payDto.amount) {
      throw new BadRequestException("Insufficient balance");
    }

    // Create metadata with provided fields or empty object
    const metadata = payDto.metadata || {};

    // Add description to metadata if provided
    if (payDto.description) {
      metadata.description = payDto.description;
    }

    // Always include method in metadata
    metadata.method = PaymentMethod.WALLET;

    // Create payment transaction
    const payment = this.paymentRepository.create({
      amount: payDto.amount,
      status: PaymentStatus.COMPLETED,
      method: PaymentMethod.WALLET,
      description: payDto.description || "Payment",
      fromUserId: sender.id,
      toUserId: recipient.id,
      fromAlias: senderAlias,
      toAlias: payDto.toAlias,
      metadata: metadata,
    });

    // Save payment
    await this.paymentRepository.save(payment);

    // Update wallets
    sender.wallet.balance -= payDto.amount;
    recipient.wallet.balance += payDto.amount;

    await this.walletRepository.save([sender.wallet, recipient.wallet]);

    // Return success with aliases instead of user IDs
    return {
      success: true,
      paymentId: payment.id,
      fromAlias: senderAlias,
      toAlias: payDto.toAlias,
      amount: payDto.amount,
      status: payment.status,
      timestamp: payment.createdAt,
      metadata: payment.metadata,
    };
  }
}
