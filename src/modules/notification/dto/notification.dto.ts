import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  IsObject,
  IsUrl,
  ValidateNested,
  IsArray,
  ArrayMinSize,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { NotificationType } from "../../../entities/notification.entity";
import { NotificationChannel } from "../../../entities/notification-preference.entity";

// Notification DTOs
export class CreateNotificationDto {
  @ApiProperty({
    description: "User ID to receive the notification",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: "Type of notification",
    enum: NotificationType,
    example: NotificationType.SYSTEM,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: "Notification title",
    example: "New payment received",
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: "Notification message",
    example: "You have received a payment of $50.00",
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: "URL to redirect when notification is clicked",
    example: "/payments/123",
  })
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @ApiPropertyOptional({
    description: "Additional metadata for the notification",
    example: { transactionId: "tr_123456", amount: 50.0 },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class CreateBulkNotificationsDto {
  @ApiProperty({
    description: "Array of user IDs to receive the notification",
    type: [String],
    example: [
      "123e4567-e89b-12d3-a456-426614174000",
      "223e4567-e89b-12d3-a456-426614174001",
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  userIds: string[];

  @ApiProperty({
    description: "Type of notification",
    enum: NotificationType,
    example: NotificationType.SYSTEM,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: "Notification title",
    example: "System maintenance",
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: "Notification message",
    example: "The system will be down for maintenance from 2am to 4am EST",
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    description: "URL to redirect when notification is clicked",
    example: "/announcements/maintenance",
  })
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @ApiPropertyOptional({
    description: "Additional metadata for the notification",
    example: { maintenanceId: "m_123456", durationHours: 2 },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class GetNotificationsQueryDto {
  @ApiPropertyOptional({
    description: "Filter by read status",
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isRead?: boolean;

  @ApiPropertyOptional({
    description: "Filter by notification type",
    enum: NotificationType,
    example: NotificationType.PAYMENT_RECEIVED,
  })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({
    description: "Maximum number of notifications to return",
    example: 10,
    default: 10,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: "Number of notifications to skip",
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  offset?: number = 0;
}

export class NotificationResponseDto {
  @ApiProperty({
    description: "Notification ID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @ApiProperty({
    description: "Type of notification",
    enum: NotificationType,
    example: NotificationType.PAYMENT_RECEIVED,
  })
  type: NotificationType;

  @ApiProperty({
    description: "Notification title",
    example: "New payment received",
  })
  title: string;

  @ApiProperty({
    description: "Notification message",
    example: "You have received a payment of $50.00",
  })
  message: string;

  @ApiPropertyOptional({
    description: "URL to redirect when notification is clicked",
    example: "/payments/123",
  })
  actionUrl?: string;

  @ApiProperty({
    description: "Whether the notification has been read",
    example: false,
  })
  isRead: boolean;

  @ApiPropertyOptional({
    description: "Additional metadata for the notification",
    example: { transactionId: "tr_123456", amount: 50.0 },
  })
  metadata?: Record<string, any>;

  @ApiProperty({
    description: "When the notification was created",
    example: "2023-05-20T15:30:00.000Z",
  })
  createdAt: Date;
}

export class NotificationsResponseDto {
  @ApiProperty({
    description: "List of notifications",
    type: [NotificationResponseDto],
  })
  notifications: NotificationResponseDto[];

  @ApiProperty({
    description: "Total count of notifications matching the filter",
    example: 15,
  })
  total: number;
}

export class UnreadCountResponseDto {
  @ApiProperty({
    description: "Count of unread notifications",
    example: 5,
  })
  count: number;
}

export class MarkReadResponseDto {
  @ApiProperty({
    description: "Confirmation message",
    example: "Notification marked as read",
  })
  message: string;
}

export class MarkAllReadResponseDto {
  @ApiProperty({
    description: "Number of notifications marked as read",
    example: 5,
  })
  count: number;

  @ApiProperty({
    description: "Confirmation message",
    example: "All notifications marked as read",
  })
  message: string;
}

export class DeleteNotificationResponseDto {
  @ApiProperty({
    description: "Confirmation message",
    example: "Notification deleted successfully",
  })
  message: string;
}

// Notification Preferences DTOs
export class NotificationPreferenceItemDto {
  @ApiProperty({
    description: "Type of notification",
    enum: NotificationType,
    example: NotificationType.PAYMENT_RECEIVED,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: "Notification channel",
    enum: NotificationChannel,
    example: NotificationChannel.EMAIL,
  })
  @IsEnum(NotificationChannel)
  channel: NotificationChannel;

  @ApiProperty({
    description:
      "Whether notifications of this type are enabled for this channel",
    example: true,
  })
  @IsBoolean()
  enabled: boolean;
}

export class UpdateNotificationPreferencesDto {
  @ApiProperty({
    description: "Array of notification preferences",
    type: [NotificationPreferenceItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationPreferenceItemDto)
  preferences: NotificationPreferenceItemDto[];
}

export class NotificationPreferencesResponseDto {
  @ApiProperty({
    description: "Array of notification preferences",
    type: [NotificationPreferenceItemDto],
  })
  preferences: NotificationPreferenceItemDto[];
}

export class UpdatePreferencesResponseDto {
  @ApiProperty({
    description: "Array of updated notification preferences",
    type: [NotificationPreferenceItemDto],
  })
  preferences: NotificationPreferenceItemDto[];

  @ApiProperty({
    description: "Confirmation message",
    example: "Notification preferences updated successfully",
  })
  message: string;
}
