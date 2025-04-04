import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { WithdrawalsService } from "./withdrawals.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { User } from "../../entities/user.entity";
import { GetUser } from "../common/decorators/get-user.decorator";

// Create DTO for withdrawal requests
class CreateWithdrawalDto {
  amount: number;
  destination: string;
}

@Controller("withdrawals")
export class WithdrawalsController {
  constructor(private withdrawalsService: WithdrawalsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getUserWithdrawals(@GetUser() user: User) {
    return this.withdrawalsService.findAllByUser(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createWithdrawal(
    @GetUser() user: User,
    @Body() createWithdrawalDto: CreateWithdrawalDto
  ) {
    return this.withdrawalsService.createWithdrawal(
      user.id,
      createWithdrawalDto.amount,
      createWithdrawalDto.destination
    );
  }
}
