import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Withdrawal } from "../../entities/withdrawal.entity";
import { PaymentMethod, WithdrawalStatus } from "../../entities/common.enums";
import { User } from "../../entities/user.entity";
import { Wallet } from "../../entities/wallet.entity";

@Injectable()
export class WithdrawalsService {
  constructor(
    @InjectRepository(Withdrawal)
    private withdrawalRepository: Repository<Withdrawal>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>
  ) {}

  async findAllByUser(userId: string): Promise<Withdrawal[]> {
    return this.withdrawalRepository.find({
      where: { userId },
      relations: ["user"],
    });
  }

  async createWithdrawal(
    userId: string,
    amount: number,
    destinationString: string
  ): Promise<Withdrawal> {
    // Find user with wallet
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["wallet"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Check if user has wallet and enough balance
    if (!user.wallet) {
      throw new BadRequestException("User has no wallet");
    }

    if (user.wallet.balance < amount) {
      throw new BadRequestException("Insufficient wallet balance");
    }

    // Parse the destination string
    let destination;
    try {
      destination = JSON.parse(destinationString);
    } catch (error) {
      throw new BadRequestException("Invalid destination format");
    }

    // Validate destination data
    if (!destination.method || !destination.accountNumber) {
      throw new BadRequestException("Missing required destination information");
    }

    // Map the method string to PaymentMethod enum
    let paymentMethod: PaymentMethod;
    switch (destination.method) {
      case "bank":
        paymentMethod = PaymentMethod.WALLET;
        break;
      case "paypal":
      case "venmo":
        paymentMethod = PaymentMethod.WALLET;
        break;
      case "crypto":
        paymentMethod = PaymentMethod.CRYPTO_BTC; // Default to BTC, could be specified in destination
        break;
      default:
        paymentMethod = PaymentMethod.WALLET;
    }

    // Create the withdrawal entity
    const withdrawal = this.withdrawalRepository.create({
      userId,
      amount,
      method: paymentMethod,
      status: WithdrawalStatus.PENDING,
      payoutDetails: {
        methodType: destination.method,
        accountNumber: destination.accountNumber,
        currency: destination.currency || "USD",
      },
    });

    // Save the withdrawal
    await this.withdrawalRepository.save(withdrawal);

    // Update user's wallet balance
    user.wallet.balance = Number(user.wallet.balance) - amount;
    await this.walletRepository.save(user.wallet);

    return withdrawal;
  }
}
