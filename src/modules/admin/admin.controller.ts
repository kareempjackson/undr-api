import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
  Delete,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import {
  DisputeResolution,
  DisputeStatus,
} from "../../entities/dispute.entity";
import { EscrowStatus } from "../../entities/escrow.entity";
import { UserRole, UserStatus } from "../../entities/user.entity";

@ApiTags("Admin")
@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles("ADMIN")
export class AdminController {
  constructor(private adminService: AdminService) {}

  // USER MANAGEMENT ENDPOINTS
  @Get("users")
  @ApiOperation({ summary: "Get all users" })
  @ApiResponse({ status: 200, description: "List of all users" })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "role", required: false, enum: UserRole })
  @ApiQuery({ name: "status", required: false, enum: UserStatus })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getAllUsers(
    @Query("search") search?: string,
    @Query("role") role?: UserRole,
    @Query("status") status?: UserStatus,
    @Query("page") page = 1,
    @Query("limit") limit = 10
  ) {
    return this.adminService.getAllUsers(search, role, status, page, limit);
  }

  @Get("users/:id")
  @ApiOperation({ summary: "Get user details" })
  @ApiResponse({ status: 200, description: "User details retrieved" })
  @ApiParam({ name: "id", description: "User ID" })
  async getUserDetails(@Param("id") userId: string) {
    return this.adminService.getUserDetails(userId);
  }

  @Patch("users/:id/status")
  @ApiOperation({ summary: "Update user status" })
  @ApiResponse({ status: 200, description: "User status updated" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        status: { type: "string", enum: Object.values(UserStatus) },
      },
    },
  })
  async updateUserStatus(
    @Param("id") userId: string,
    @Body() data: { status: string }
  ) {
    return this.adminService.updateUserStatus(userId, data.status);
  }

  @Patch("users/:id/role")
  @ApiOperation({ summary: "Update user role" })
  @ApiResponse({ status: 200, description: "User role updated" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: { role: { type: "string", enum: Object.values(UserRole) } },
    },
  })
  async updateUserRole(
    @Param("id") userId: string,
    @Body() data: { role: string }
  ) {
    return this.adminService.updateUserRole(userId, data.role);
  }

  @Patch("users/:id/flag")
  @ApiOperation({ summary: "Flag user account" })
  @ApiResponse({ status: 200, description: "User account flagged" })
  @ApiParam({ name: "id", description: "User ID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: { reason: { type: "string" }, details: { type: "string" } },
    },
  })
  async flagUser(
    @Param("id") userId: string,
    @Body() data: { reason: string; details?: string }
  ) {
    return this.adminService.flagUser(userId, data.reason, data.details);
  }

  // ESCROW MANAGEMENT ENDPOINTS
  @Get("escrows")
  @ApiOperation({ summary: "Get all escrows" })
  @ApiResponse({ status: 200, description: "List of all escrows" })
  @ApiQuery({ name: "status", required: false, enum: EscrowStatus })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getAllEscrows(
    @Query("status") status?: EscrowStatus,
    @Query("search") search?: string,
    @Query("page") page = 1,
    @Query("limit") limit = 10
  ) {
    return this.adminService.getAllEscrows(status, search, page, limit);
  }

  @Get("escrows/:id")
  @ApiOperation({ summary: "Get escrow details" })
  @ApiResponse({ status: 200, description: "Escrow details retrieved" })
  @ApiParam({ name: "id", description: "Escrow ID" })
  async getEscrowDetails(@Param("id") escrowId: string) {
    return this.adminService.getEscrowDetails(escrowId);
  }

  @Patch("escrows/:id/release")
  @ApiOperation({ summary: "Release escrow funds to seller" })
  @ApiResponse({ status: 200, description: "Escrow funds released to seller" })
  @ApiParam({ name: "id", description: "Escrow ID" })
  async releaseEscrow(@Param("id") escrowId: string) {
    return this.adminService.releaseEscrow(escrowId);
  }

  @Patch("escrows/:id/refund")
  @ApiOperation({ summary: "Refund escrow funds to buyer" })
  @ApiResponse({ status: 200, description: "Escrow funds refunded to buyer" })
  @ApiParam({ name: "id", description: "Escrow ID" })
  async refundEscrow(@Param("id") escrowId: string) {
    return this.adminService.refundEscrow(escrowId);
  }

  // DISPUTE MANAGEMENT ENDPOINTS
  @Get("disputes")
  @ApiOperation({ summary: "Get all disputes" })
  @ApiResponse({ status: 200, description: "List of all disputes" })
  @ApiQuery({ name: "status", required: false, enum: DisputeStatus })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getAllDisputes(
    @Query("status") status?: DisputeStatus,
    @Query("search") search?: string,
    @Query("page") page = 1,
    @Query("limit") limit = 10
  ) {
    return this.adminService.getAllDisputes(status, search, page, limit);
  }

  @Get("disputes/:id")
  @ApiOperation({ summary: "Get dispute details" })
  @ApiResponse({ status: 200, description: "Dispute details retrieved" })
  @ApiParam({ name: "id", description: "Dispute ID" })
  async getDisputeDetails(@Param("id") disputeId: string) {
    return this.adminService.getDisputeDetails(disputeId);
  }

  @Patch("disputes/:id/resolve")
  @ApiOperation({ summary: "Resolve a dispute" })
  @ApiResponse({ status: 200, description: "Dispute resolved" })
  @ApiParam({ name: "id", description: "Dispute ID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        resolution: { type: "string", enum: Object.values(DisputeResolution) },
        notes: { type: "string" },
        buyerAmount: { type: "number" },
        sellerAmount: { type: "number" },
      },
    },
  })
  async resolveDispute(
    @Param("id") disputeId: string,
    @Body()
    data: {
      resolution: DisputeResolution;
      notes?: string;
      buyerAmount?: number;
      sellerAmount?: number;
    }
  ) {
    return this.adminService.resolveDispute(
      disputeId,
      data.resolution,
      data.notes,
      data.buyerAmount,
      data.sellerAmount
    );
  }

  // CHARGEBACK BUFFER ENDPOINTS
  @Get("chargeback-buffer")
  @ApiOperation({ summary: "Get chargeback buffer details" })
  @ApiResponse({
    status: 200,
    description: "Chargeback buffer details retrieved",
  })
  async getChargebackBufferDetails() {
    return this.adminService.getChargebackBufferDetails();
  }

  @Get("chargeback-buffer/events")
  @ApiOperation({ summary: "Get chargeback buffer events" })
  @ApiResponse({
    status: 200,
    description: "Chargeback buffer events retrieved",
  })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getChargebackBufferEvents(
    @Query("page") page = 1,
    @Query("limit") limit = 10
  ) {
    return this.adminService.getChargebackBufferEvents(page, limit);
  }

  @Post("chargeback-buffer/allocate")
  @ApiOperation({ summary: "Allocate funds to chargeback buffer" })
  @ApiResponse({
    status: 200,
    description: "Funds allocated to chargeback buffer",
  })
  @ApiBody({
    schema: { type: "object", properties: { amount: { type: "number" } } },
  })
  async allocateToChargebackBuffer(@Body() data: { amount: number }) {
    return this.adminService.allocateToChargebackBuffer(data.amount);
  }

  // SYSTEM LOGS ENDPOINTS
  @Get("logs")
  @ApiOperation({ summary: "Get system logs" })
  @ApiResponse({ status: 200, description: "System logs retrieved" })
  @ApiQuery({ name: "type", required: false, type: String })
  @ApiQuery({ name: "level", required: false, type: String })
  @ApiQuery({ name: "search", required: false, type: String })
  @ApiQuery({ name: "startDate", required: false, type: Date })
  @ApiQuery({ name: "endDate", required: false, type: Date })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getSystemLogs(
    @Query("type") type?: string,
    @Query("level") level?: string,
    @Query("search") search?: string,
    @Query("startDate") startDate?: Date,
    @Query("endDate") endDate?: Date,
    @Query("page") page = 1,
    @Query("limit") limit = 10
  ) {
    return this.adminService.getSystemLogs(
      type,
      level,
      search,
      startDate,
      endDate,
      page,
      limit
    );
  }

  // Analytics endpoints
  @Get("analytics")
  @ApiOperation({ summary: "Get all analytics data" })
  @ApiResponse({ status: 200, description: "Analytics data retrieved" })
  @ApiQuery({ name: "timeframe", required: false, type: String })
  async getAnalytics(@Query("timeframe") timeframe: string) {
    return this.adminService.getAnalytics(timeframe);
  }

  @Get("analytics/revenue")
  @ApiOperation({ summary: "Get revenue analytics" })
  @ApiResponse({ status: 200, description: "Revenue analytics retrieved" })
  @ApiQuery({ name: "timeframe", required: false, type: String })
  async getRevenueAnalytics(@Query("timeframe") timeframe: string) {
    return this.adminService.getRevenueAnalytics(timeframe);
  }

  @Get("analytics/users")
  @ApiOperation({ summary: "Get user analytics" })
  @ApiResponse({ status: 200, description: "User analytics retrieved" })
  @ApiQuery({ name: "timeframe", required: false, type: String })
  async getUserAnalytics(@Query("timeframe") timeframe: string) {
    return this.adminService.getUserAnalytics(timeframe);
  }

  @Get("analytics/transactions")
  @ApiOperation({ summary: "Get transaction analytics" })
  @ApiResponse({ status: 200, description: "Transaction analytics retrieved" })
  @ApiQuery({ name: "timeframe", required: false, type: String })
  async getTransactionAnalytics(@Query("timeframe") timeframe: string) {
    return this.adminService.getTransactionAnalytics(timeframe);
  }

  @Get("analytics/top-creators")
  @ApiOperation({ summary: "Get top performing creators" })
  @ApiResponse({ status: 200, description: "Top creators retrieved" })
  @ApiQuery({ name: "limit", required: false, type: Number })
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
