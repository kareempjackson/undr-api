import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../../../entities/user.entity";
import * as crypto from "crypto";

@Injectable()
export class AliasService {
  private readonly logger = new Logger(AliasService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  /**
   * Find a user by their alias
   */
  async findUserByAlias(alias: string): Promise<User> {
    if (!alias) {
      throw new NotFoundException("Alias is required");
    }

    const user = await this.userRepository.findOne({
      where: { alias },
      relations: ["wallet"],
    });

    if (!user) {
      throw new NotFoundException(`User with alias ${alias} not found`);
    }

    return user;
  }

  /**
   * Generate a unique alias for a user based on their role
   */
  async generateUniqueAlias(
    userId: string,
    preferredAlias?: string
  ): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // If user already has an alias, return it
    if (user.alias) {
      return user.alias;
    }

    let alias: string;
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;

    // Try to use preferred alias if provided
    if (preferredAlias) {
      const exists = await this.userRepository.findOne({
        where: { alias: preferredAlias },
      });

      if (!exists) {
        alias = preferredAlias;
        isUnique = true;
      } else {
        this.logger.log(`Preferred alias "${preferredAlias}" is already taken`);
      }
    }

    // Generate random alias if preferred is not available or not provided
    while (!isUnique && attempts < maxAttempts) {
      const randomPart = crypto.randomBytes(4).toString("hex");
      const rolePrefix = user.role.toLowerCase();

      alias = `${rolePrefix}_${randomPart}`;

      const exists = await this.userRepository.findOne({
        where: { alias },
      });

      if (!exists) {
        isUnique = true;
      }

      attempts += 1;
    }

    if (!isUnique) {
      throw new ConflictException(
        "Failed to generate a unique alias after multiple attempts"
      );
    }

    // Save the new alias
    user.alias = alias;
    await this.userRepository.save(user);

    return alias;
  }

  /**
   * Update a user's alias
   */
  async updateAlias(userId: string, newAlias: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if alias is already taken
    const exists = await this.userRepository.findOne({
      where: { alias: newAlias },
    });

    if (exists && exists.id !== userId) {
      throw new ConflictException(`Alias "${newAlias}" is already taken`);
    }

    // Update alias
    user.alias = newAlias;
    return this.userRepository.save(user);
  }
}
