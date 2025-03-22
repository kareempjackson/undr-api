import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@ApiTags("Admin")
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles("ADMIN")
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get("users")
  @ApiOperation({ summary: "Get all users" })
  @ApiResponse({ status: 200, description: "List of all users" })
  async getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get("transactions")
  @ApiOperation({ summary: "Get all transactions" })
  @ApiResponse({ status: 200, description: "List of all transactions" })
  async getAllTransactions() {
    return this.adminService.getAllTransactions();
  }

  @Patch("users/:id/status")
  @ApiOperation({ summary: "Update user status" })
  @ApiResponse({ status: 200, description: "User status updated" })
  async updateUserStatus(
    @Param("id") userId: string,
    @Body() data: { status: string }
  ) {
    return this.adminService.updateUserStatus(userId, data.status);
  }

  // Analytics endpoints
  @Get("analytics")
  @ApiOperation({ summary: "Get all analytics data" })
  @ApiResponse({ status: 200, description: "Analytics data retrieved" })
  async getAnalytics(@Query("timeframe") timeframe: string) {
    return this.adminService.getAnalytics(timeframe);
  }

  @Get("analytics/revenue")
  @ApiOperation({ summary: "Get revenue analytics" })
  @ApiResponse({ status: 200, description: "Revenue analytics retrieved" })
  async getRevenueAnalytics(@Query("timeframe") timeframe: string) {
    return this.adminService.getRevenueAnalytics(timeframe);
  }

  @Get("analytics/users")
  @ApiOperation({ summary: "Get user analytics" })
  @ApiResponse({ status: 200, description: "User analytics retrieved" })
  async getUserAnalytics(@Query("timeframe") timeframe: string) {
    return this.adminService.getUserAnalytics(timeframe);
  }

  @Get("analytics/transactions")
  @ApiOperation({ summary: "Get transaction analytics" })
  @ApiResponse({ status: 200, description: "Transaction analytics retrieved" })
  async getTransactionAnalytics(@Query("timeframe") timeframe: string) {
    return this.adminService.getTransactionAnalytics(timeframe);
  }

  @Get("analytics/top-creators")
  @ApiOperation({ summary: "Get top performing creators" })
  @ApiResponse({ status: 200, description: "Top creators retrieved" })
  async getTopCreators(@Query("limit") limit: number = 5) {
    return this.adminService.getTopCreators(limit);
  }

  @Get("analytics/payment-methods")
  @ApiOperation({ summary: "Get payment methods distribution" })
  @ApiResponse({
    status: 200,
    description: "Payment methods distribution retrieved",
  })
  async getPaymentMethodsDistribution() {
    return this.adminService.getPaymentMethodsDistribution();
  }
}
