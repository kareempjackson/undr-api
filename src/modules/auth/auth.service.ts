import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LoginDto, VerifyMagicLinkDto } from "./dto";
import { MagicLinkService } from "./magic-link.service";
import { User, UserStatus } from "../../entities/user.entity";
import { Wallet } from "../../entities/wallet.entity";
import { MagicLink } from "../../entities/magic-link.entity";

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    @InjectRepository(MagicLink)
    private magicLinkRepository: Repository<MagicLink>,
    private jwtService: JwtService,
    private magicLinkService: MagicLinkService
  ) {}

  async login(loginDto: LoginDto) {
    const { email } = loginDto;

    // Find the user or create a new one
    let user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Create new user
      user = this.userRepository.create({
        email,
        status: UserStatus.PENDING,
      });

      await this.userRepository.save(user);

      // Create a wallet for the user
      const wallet = this.walletRepository.create({ user });
      await this.walletRepository.save(wallet);
    }

    await this.sendMagicLink(email);
    return { message: "Magic link sent to your email" };
  }

  async verifyMagicLink(token: string) {
    // Verify token and get user ID
    const userId = await this.magicLinkService.verifyToken(token);

    // Get user data
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["wallet"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Update user status if pending
    if (user.status === UserStatus.PENDING) {
      user.status = UserStatus.ACTIVE;
      await this.userRepository.save(user);
    }

    // Generate JWT
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        wallet: {
          id: user.wallet?.id || "default-wallet",
          balance: user.wallet?.balance || 0,
        },
      },
      token: this.jwtService.sign(payload),
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["wallet"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      wallet: {
        id: user.wallet?.id || "default-wallet",
        balance: user.wallet?.balance || 0,
      },
    };
  }

  async sendMagicLink(email: string): Promise<void> {
    // Find the user or create a new one if it doesn't exist
    let user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      // Create new user
      user = this.userRepository.create({
        email,
        status: UserStatus.PENDING,
      });

      await this.userRepository.save(user);

      // Create a wallet for the user
      const wallet = this.walletRepository.create({ user });
      await this.walletRepository.save(wallet);
    }

    await this.magicLinkService.sendMagicLink(email);
  }

  async getUserProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["wallet"],
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      wallet: {
        id: user.wallet?.id || "default-wallet",
        balance: user.wallet?.balance || 0,
      },
      profileImage: user.profileImage,
      bio: user.bio,
      location: user.location,
      createdAt: user.createdAt,
    };
  }
}
