import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  Param,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { FansService } from "./fans.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import {
  DepositDto,
  PayCreatorDto,
  CompleteDepositDto,
  PayByAliasDto,
} from "./dto";
import { PrivacyCritical } from "../common/decorators/privacy-critical.decorator";

@ApiTags("Fans")
@Controller("fans")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class FansController {
  constructor(private fansService: FansService) {}

  @Post("deposit")
  @Roles("FAN", "CREATOR")
  @ApiOperation({ summary: "Deposit funds into wallet" })
  @ApiResponse({ status: 201, description: "Deposit initiated successfully" })
  async deposit(@Request() req, @Body() depositDto: DepositDto) {
    return this.fansService.deposit(req.user.sub, depositDto);
  }

  @Get("deposit-status/:depositId")
  @Roles("FAN", "CREATOR")
  @ApiOperation({ summary: "Check status of a deposit" })
  @ApiResponse({ status: 200, description: "Deposit status retrieved" })
  async getDepositStatus(
    @Request() req,
    @Param("depositId") depositId: string
  ) {
    return this.fansService.getDepositStatus(req.user.sub, depositId);
  }

  @Post("complete-deposit")
  @Roles("FAN", "CREATOR")
  @ApiOperation({ summary: "Manually complete a deposit (fallback method)" })
  @ApiResponse({ status: 200, description: "Deposit completed successfully" })
  async completeDeposit(
    @Request() req,
    @Body() completeDepositDto: CompleteDepositDto
  ) {
    return this.fansService.completeDeposit(req.user.sub, completeDepositDto);
  }

  @Post("pay")
  @Roles("FAN", "CREATOR")
  @ApiOperation({ summary: "Pay a creator" })
  @ApiResponse({ status: 201, description: "Payment processed successfully" })
  @PrivacyCritical({
    regionOnly: true,
    detectProxy: true,
  })
  async payCreator(@Request() req, @Body() payDto: PayCreatorDto) {
    return this.fansService.payCreator(req.user.sub, payDto);
  }

  @Post("pay/:alias")
  @Roles("FAN", "CREATOR")
  @ApiOperation({ summary: "Pay a creator using their alias" })
  @ApiResponse({ status: 201, description: "Payment processed successfully" })
  @PrivacyCritical({
    storeNoIpData: true,
    detectProxy: true,
  })
  async payByAlias(
    @Request() req,
    @Param("alias") alias: string,
    @Body() payDto: PayByAliasDto
  ) {
    // Override the alias from the URL parameter
    payDto.toAlias = alias;
    return this.fansService.payByAlias(req.user.sub, payDto);
  }

  @Get("history")
  @Roles("FAN", "CREATOR")
  @ApiOperation({ summary: "Get transaction history" })
  @ApiResponse({ status: 200, description: "Transaction history retrieved" })
  @PrivacyCritical({
    regionOnly: true,
  })
  async getTransactionHistory(@Request() req) {
    return this.fansService.getTransactionHistory(req.user.sub);
  }
}
