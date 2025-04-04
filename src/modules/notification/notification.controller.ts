import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  BadRequestException,
  NotFoundException,
  Logger,
  Request,
  Res,
} from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { NotificationService } from "./notification.service";
import {
  NotificationType,
  NotificationChannel,
} from "../../entities/notification.entity";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { User } from "../../decorators/user.decorator";
import {
  GetNotificationsQueryDto,
  NotificationsResponseDto,
  UnreadCountResponseDto,
  MarkReadResponseDto,
  MarkAllReadResponseDto,
  DeleteNotificationResponseDto,
  NotificationPreferencesResponseDto,
  UpdateNotificationPreferencesDto,
  UpdatePreferencesResponseDto,
  NotificationPreferenceItemDto,
} from "./dto/notification.dto";
import { Response } from "express";

@ApiTags("Notifications")
@ApiBearerAuth()
@Controller("notifications")
@UseGuards(JwtAuthGuard)
export class NotificationController {
  private readonly logger = new Logger(NotificationController.name);

  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: "Get user notifications" })
  @ApiQuery({ name: "isRead", required: false, type: Boolean })
  @ApiQuery({ name: "type", required: false, enum: NotificationType })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Returns notifications and count" })
  async getNotifications(
    @Request() req,
    @Query("isRead") isRead?: string,
    @Query("type") type?: NotificationType,
    @Query("limit") limit?: number,
    @Query("offset") offset?: number
  ) {
    try {
      // Parse isRead if provided
      let isReadValue;
      if (isRead !== undefined) {
        isReadValue = isRead === "true";
      }

      const notifications = await this.notificationService.getNotifications({
        userId: req.user.userId,
        isRead: isReadValue,
        type,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      });

      // Get total count for pagination
      const total = await this.notificationService.countNotifications({
        userId: req.user.userId,
        isRead: isReadValue,
        type,
      });

      return {
        notifications,
        total,
      };
    } catch (error) {
      this.logger.error(
        `Error getting notifications: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Get("events")
  @ApiOperation({ summary: "Get real-time notifications using SSE" })
  @ApiResponse({
    status: 200,
    description: "Returns notification events stream",
  })
  async getNotificationEvents(@Request() req, @Res() res: Response) {
    const userId = req.user.userId;

    // Set headers for SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Send initial data - unread count
    const unreadCount = await this.notificationService.getUnreadCount(userId);
    const data = JSON.stringify({
      type: "unread_count",
      data: { count: unreadCount },
    });
    res.write(`data: ${data}\n\n`);

    // Keep connection alive with periodic pings
    const pingInterval = setInterval(() => {
      res.write(`data: ${JSON.stringify({ type: "ping" })}\n\n`);
    }, 30000); // 30 seconds

    // Clean up on client disconnect
    req.on("close", () => {
      clearInterval(pingInterval);
      res.end();
    });
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Get unread notification count" })
  @ApiResponse({
    status: 200,
    description: "Returns unread notification count",
  })
  async getUnreadCount(@Request() req) {
    try {
      const count = await this.notificationService.getUnreadCount(
        req.user.userId
      );
      return { count };
    } catch (error) {
      this.logger.error(
        `Error getting unread count: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark a notification as read" })
  @ApiResponse({
    status: 200,
    description: "Notification marked as read",
    type: MarkReadResponseDto,
  })
  @ApiResponse({ status: 404, description: "Notification not found" })
  async markAsRead(
    @User("id") userId: string,
    @Param("id") notificationId: string
  ): Promise<MarkReadResponseDto> {
    try {
      const success = await this.notificationService.markAsRead(
        notificationId,
        userId
      );
      if (!success) {
        throw new NotFoundException(
          `Notification with ID ${notificationId} not found`
        );
      }
      return { message: "Notification marked as read" };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error marking notification as read: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Post("mark-all-read")
  @ApiOperation({ summary: "Mark all notifications as read" })
  @ApiResponse({
    status: 200,
    description: "All notifications marked as read",
    type: MarkAllReadResponseDto,
  })
  async markAllAsRead(
    @User("id") userId: string
  ): Promise<MarkAllReadResponseDto> {
    try {
      const count = await this.notificationService.markAllAsRead(userId);
      return {
        count,
        message: `${count} notifications marked as read`,
      };
    } catch (error) {
      this.logger.error(
        `Error marking all notifications as read: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a notification" })
  @ApiResponse({
    status: 200,
    description: "Notification deleted",
    type: DeleteNotificationResponseDto,
  })
  @ApiResponse({ status: 404, description: "Notification not found" })
  async deleteNotification(
    @User("id") userId: string,
    @Param("id") notificationId: string
  ): Promise<DeleteNotificationResponseDto> {
    try {
      const success = await this.notificationService.deleteNotification(
        notificationId,
        userId
      );
      if (!success) {
        throw new NotFoundException(
          `Notification with ID ${notificationId} not found`
        );
      }
      return { message: "Notification deleted successfully" };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error deleting notification: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Get("preferences")
  @ApiOperation({ summary: "Get user notification preferences" })
  @ApiResponse({
    status: 200,
    description: "Returns user notification preferences",
    type: NotificationPreferencesResponseDto,
  })
  async getPreferences(
    @User("id") userId: string
  ): Promise<NotificationPreferencesResponseDto> {
    try {
      const preferences = await this.notificationService.getPreferences(userId);
      return { preferences };
    } catch (error) {
      this.logger.error(
        `Error fetching preferences: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  @Patch("preferences")
  @ApiOperation({ summary: "Update user notification preferences" })
  @ApiResponse({
    status: 200,
    description: "Notification preferences updated",
    type: UpdatePreferencesResponseDto,
  })
  @ApiResponse({ status: 400, description: "Invalid preferences data" })
  async updatePreferences(
    @User("id") userId: string,
    @Body() dto: UpdateNotificationPreferencesDto
  ): Promise<UpdatePreferencesResponseDto> {
    try {
      // Validate preferences structure
      if (
        !dto.preferences ||
        !Array.isArray(dto.preferences) ||
        dto.preferences.length === 0
      ) {
        throw new BadRequestException(
          "Invalid preferences data. Expected non-empty array."
        );
      }

      // Validate each preference item
      for (const pref of dto.preferences) {
        if (!pref.type || !pref.channel || pref.enabled === undefined) {
          throw new BadRequestException(
            "Each preference item must include type, channel, and enabled status"
          );
        }
      }

      const preferences = await this.notificationService.updatePreferences(
        userId,
        dto.preferences
      );

      return {
        preferences,
        message: "Notification preferences updated successfully",
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `Error updating preferences: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
