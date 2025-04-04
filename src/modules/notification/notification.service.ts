import {
  Injectable,
  Logger,
  NotFoundException,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import {
  Notification,
  NotificationType,
} from "../../entities/notification.entity";
import { NotificationPreference } from "../../entities/notification-preference.entity";
import { NotificationChannel } from "../../entities/notification-preference.entity";
import { User } from "../../entities/user.entity";
import { EmailService } from "./email.service";
import {
  CreateNotificationDto,
  CreateBulkNotificationsDto,
  NotificationPreferenceItemDto,
} from "./dto/notification.dto";
import { NotificationGateway } from "./notification.gateway";
import {
  CreateNotificationParams as CreateNotificationParamsInterface,
  CreateBulkNotificationsParams as CreateBulkNotificationsParamsInterface,
  GetNotificationsParams as GetNotificationsParamsInterface,
  UpdatePreferencesParams,
  NotificationPreferenceItem,
  NotificationEvent,
} from "./interfaces/notification.interfaces";

// Using internal interface type for local parameters
interface GetNotificationsParams {
  userId: string;
  isRead?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(NotificationPreference)
    private preferenceRepository: Repository<NotificationPreference>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
    private configService: ConfigService,
    @Inject(forwardRef(() => NotificationGateway))
    private notificationGateway?: NotificationGateway
  ) {}

  /**
   * Create a notification for a user
   * @param notificationDto - Data for the notification to create
   * @returns The created notification
   */
  async createNotification(
    notificationDto: CreateNotificationDto
  ): Promise<Notification> {
    try {
      // Create the notification entity
      const notification = this.notificationRepository.create(notificationDto);

      // Save to database
      const savedNotification = await this.notificationRepository.save(
        notification
      );

      // Check user preferences and send emails if enabled
      await this.processNotificationChannels(notificationDto);

      // Send real-time notification via WebSockets if gateway is available
      if (this.notificationGateway) {
        this.notificationGateway.sendNotificationToUser(
          notificationDto.userId,
          {
            ...savedNotification,
            isNew: true,
          }
        );

        // Update unread count
        const unreadCount = await this.getUnreadCount(notificationDto.userId);
        this.notificationGateway.sendUnreadCount(
          notificationDto.userId,
          unreadCount
        );
      }

      return savedNotification;
    } catch (error) {
      this.logger.error(
        `Error creating notification: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Create multiple notifications for multiple users
   * @param bulkDto - Data for bulk notification creation
   * @returns The created notifications
   */
  async createBulkNotifications(
    bulkDto: CreateBulkNotificationsDto
  ): Promise<Notification[]> {
    try {
      const { userIds, type, title, message, actionUrl, metadata } = bulkDto;

      // Find users
      const users = await this.userRepository.find({
        where: { id: In(userIds) },
      });

      if (users.length === 0) {
        this.logger.warn("No users found for bulk notification");
        return [];
      }

      // Create notification entities
      const notifications = users.map((user) =>
        this.notificationRepository.create({
          userId: user.id,
          type,
          title,
          message,
          actionUrl,
          metadata,
        })
      );

      // Save to database
      const savedNotifications = await this.notificationRepository.save(
        notifications
      );

      // Process each notification for email/SMS/push channels
      for (const user of users) {
        await this.processNotificationChannels({
          userId: user.id,
          type,
          title,
          message,
          actionUrl,
          metadata,
        });
      }

      // Send real-time notifications via WebSockets if gateway is available
      if (this.notificationGateway) {
        // Send each notification to its recipient
        for (const notification of savedNotifications) {
          this.notificationGateway.sendNotificationToUser(notification.userId, {
            ...notification,
            isNew: true,
          });

          // Update unread count
          const unreadCount = await this.getUnreadCount(notification.userId);
          this.notificationGateway.sendUnreadCount(
            notification.userId,
            unreadCount
          );
        }
      }

      return savedNotifications;
    } catch (error) {
      this.logger.error(
        `Error creating bulk notifications: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Process notification delivery to different channels based on user preferences
   * @param notification - Notification data to process
   */
  private async processNotificationChannels(
    notification: CreateNotificationDto
  ): Promise<void> {
    try {
      const { userId, type, title, message, actionUrl } = notification;

      // Get user
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        this.logger.warn(`User not found for notification: ${userId}`);
        return;
      }

      // Get user preferences for this notification type
      const preferences = await this.preferenceRepository.find({
        where: {
          userId,
          type,
        },
      });

      // If no preferences found, use default (in-app only)
      if (preferences.length === 0) {
        this.logger.debug(
          `No preferences found for user ${userId}, using defaults`
        );
        return;
      }

      // Check if email notifications are enabled
      const emailPreference = preferences.find(
        (p) => p.channel === NotificationChannel.EMAIL && p.enabled
      );

      if (emailPreference && user.email) {
        this.logger.debug(`Sending email notification to user ${userId}`);
        const appUrl = this.configService.get<string>("APP_URL") || "";
        const fullActionUrl = actionUrl ? `${appUrl}${actionUrl}` : "";

        await this.emailService.sendNotificationEmail(
          user.email,
          title,
          message,
          fullActionUrl
        );
      }

      // Additional channels (SMS, Push) can be added here
    } catch (error) {
      this.logger.error(
        `Error processing notification channels: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Get notifications for a user with optional filtering
   * @param params - Parameters for filtering notifications
   * @returns Array of notifications
   */
  async getNotifications(
    params: GetNotificationsParams
  ): Promise<Notification[]> {
    const { userId, isRead, type, limit = 20, offset = 0 } = params;

    try {
      // Build query with where conditions
      const whereConditions: any = { userId };

      if (isRead !== undefined) {
        whereConditions.isRead = isRead;
      }

      if (type) {
        whereConditions.type = type;
      }

      const notifications = await this.notificationRepository.find({
        where: whereConditions,
        order: { createdAt: "DESC" },
        take: limit,
        skip: offset,
      });

      return notifications;
    } catch (error) {
      this.logger.error(
        `Error getting notifications: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Mark a notification as read
   * @param id - Notification ID
   * @param userId - User ID (for verification)
   */
  async markAsRead(id: string, userId: string): Promise<Notification> {
    try {
      const notification = await this.notificationRepository.findOne({
        where: { id, userId },
      });

      if (!notification) {
        throw new NotFoundException("Notification not found");
      }

      // Skip if already read
      if (notification.isRead) {
        return notification;
      }

      // Update notification
      notification.isRead = true;
      notification.readAt = new Date();

      const updatedNotification = await this.notificationRepository.save(
        notification
      );

      // Update unread count via WebSockets if gateway is available
      if (this.notificationGateway) {
        const unreadCount = await this.getUnreadCount(userId);
        this.notificationGateway.sendUnreadCount(userId, unreadCount);
      }

      return updatedNotification;
    } catch (error) {
      this.logger.error(
        `Error marking notification as read: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param userId - User ID
   * @returns Number of notifications marked as read
   */
  async markAllAsRead(userId: string): Promise<number> {
    try {
      const result = await this.notificationRepository.update(
        { userId, isRead: false },
        { isRead: true, readAt: new Date() }
      );

      // Update unread count via WebSockets if gateway is available
      if (this.notificationGateway) {
        this.notificationGateway.sendUnreadCount(userId, 0);
      }

      return result.affected || 0;
    } catch (error) {
      this.logger.error(
        `Error marking all notifications as read: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get the count of unread notifications for a user
   * @param userId - ID of the user
   * @returns Count of unread notifications
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await this.notificationRepository.count({
        where: { userId, isRead: false },
      });
    } catch (error) {
      this.logger.error(
        `Error getting unread count: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Delete a notification
   * @param id - Notification ID
   * @param userId - User ID (for verification)
   * @returns Whether the notification was deleted
   */
  async deleteNotification(id: string, userId: string): Promise<boolean> {
    try {
      const notification = await this.notificationRepository.findOne({
        where: { id, userId },
      });

      if (!notification) {
        throw new NotFoundException("Notification not found");
      }

      await this.notificationRepository.remove(notification);

      // Update unread count via WebSockets if gateway is available and the notification was unread
      if (this.notificationGateway && !notification.isRead) {
        const unreadCount = await this.getUnreadCount(userId);
        this.notificationGateway.sendUnreadCount(userId, unreadCount);
      }

      return true;
    } catch (error) {
      this.logger.error(
        `Error deleting notification: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Get notification preferences for a user
   * @param userId - ID of the user
   * @returns List of notification preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreference[]> {
    try {
      return await this.preferenceRepository.find({
        where: { userId },
      });
    } catch (error) {
      this.logger.error(
        `Error getting preferences: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Update notification preferences for a user
   * @param userId - ID of the user
   * @param preferences - Notification preferences to update
   * @returns Updated notification preferences
   */
  async updatePreferences(
    userId: string,
    preferences: NotificationPreferenceItemDto[]
  ): Promise<NotificationPreference[]> {
    try {
      // Map preferences to entities with user ID
      const preferenceEntities = preferences.map((pref) => ({
        userId,
        type: pref.type,
        channel: pref.channel,
        enabled: pref.enabled,
      }));

      // Upsert preferences
      await this.preferenceRepository.upsert(preferenceEntities, {
        conflictPaths: ["userId", "type", "channel"],
      });

      // Return updated preferences
      return await this.preferenceRepository.find({
        where: { userId },
      });
    } catch (error) {
      this.logger.error(
        `Error updating preferences: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Setup default notification preferences for a new user
   * @param userId - ID of the user
   */
  async setupDefaultPreferences(userId: string): Promise<void> {
    try {
      const defaultPreferences: Array<{
        type: NotificationType;
        channel: NotificationChannel;
        enabled: boolean;
      }> = [
        // In-app notifications (most enabled by default)
        {
          type: NotificationType.ESCROW_CREATED,
          channel: NotificationChannel.IN_APP,
          enabled: true,
        },
        {
          type: NotificationType.ESCROW_FUNDED,
          channel: NotificationChannel.IN_APP,
          enabled: true,
        },
        {
          type: NotificationType.ESCROW_COMPLETED,
          channel: NotificationChannel.IN_APP,
          enabled: true,
        },
        {
          type: NotificationType.ESCROW_RELEASED,
          channel: NotificationChannel.IN_APP,
          enabled: true,
        },
        {
          type: NotificationType.PAYMENT_RECEIVED,
          channel: NotificationChannel.IN_APP,
          enabled: true,
        },
        {
          type: NotificationType.PAYMENT_SENT,
          channel: NotificationChannel.IN_APP,
          enabled: true,
        },
        {
          type: NotificationType.PROOF_SUBMITTED,
          channel: NotificationChannel.IN_APP,
          enabled: true,
        },
        {
          type: NotificationType.PROOF_APPROVED,
          channel: NotificationChannel.IN_APP,
          enabled: true,
        },
        {
          type: NotificationType.PROOF_REJECTED,
          channel: NotificationChannel.IN_APP,
          enabled: true,
        },
        {
          type: NotificationType.DISPUTE_CREATED,
          channel: NotificationChannel.IN_APP,
          enabled: true,
        },
        {
          type: NotificationType.DISPUTE_RESOLVED,
          channel: NotificationChannel.IN_APP,
          enabled: true,
        },
        {
          type: NotificationType.DISPUTE_EVIDENCE,
          channel: NotificationChannel.IN_APP,
          enabled: true,
        },
        {
          type: NotificationType.DISPUTE_MESSAGE,
          channel: NotificationChannel.IN_APP,
          enabled: true,
        },
        {
          type: NotificationType.SYSTEM,
          channel: NotificationChannel.IN_APP,
          enabled: true,
        },
        {
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          channel: NotificationChannel.IN_APP,
          enabled: true,
        },
        {
          type: NotificationType.SECURITY_ALERT,
          channel: NotificationChannel.IN_APP,
          enabled: true,
        },

        // Email notifications (critical ones enabled by default)
        {
          type: NotificationType.ESCROW_CREATED,
          channel: NotificationChannel.EMAIL,
          enabled: true,
        },
        {
          type: NotificationType.ESCROW_FUNDED,
          channel: NotificationChannel.EMAIL,
          enabled: true,
        },
        {
          type: NotificationType.ESCROW_COMPLETED,
          channel: NotificationChannel.EMAIL,
          enabled: true,
        },
        {
          type: NotificationType.ESCROW_RELEASED,
          channel: NotificationChannel.EMAIL,
          enabled: true,
        },
        {
          type: NotificationType.PAYMENT_RECEIVED,
          channel: NotificationChannel.EMAIL,
          enabled: true,
        },
        {
          type: NotificationType.PAYMENT_SENT,
          channel: NotificationChannel.EMAIL,
          enabled: false,
        },
        {
          type: NotificationType.PROOF_SUBMITTED,
          channel: NotificationChannel.EMAIL,
          enabled: true,
        },
        {
          type: NotificationType.PROOF_APPROVED,
          channel: NotificationChannel.EMAIL,
          enabled: true,
        },
        {
          type: NotificationType.PROOF_REJECTED,
          channel: NotificationChannel.EMAIL,
          enabled: true,
        },
        {
          type: NotificationType.DISPUTE_CREATED,
          channel: NotificationChannel.EMAIL,
          enabled: true,
        },
        {
          type: NotificationType.DISPUTE_RESOLVED,
          channel: NotificationChannel.EMAIL,
          enabled: true,
        },
        {
          type: NotificationType.DISPUTE_EVIDENCE,
          channel: NotificationChannel.EMAIL,
          enabled: false,
        },
        {
          type: NotificationType.DISPUTE_MESSAGE,
          channel: NotificationChannel.EMAIL,
          enabled: false,
        },
        {
          type: NotificationType.SYSTEM,
          channel: NotificationChannel.EMAIL,
          enabled: false,
        },
        {
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          channel: NotificationChannel.EMAIL,
          enabled: true,
        },
        {
          type: NotificationType.SECURITY_ALERT,
          channel: NotificationChannel.EMAIL,
          enabled: true,
        },
      ];

      // Create preference entities
      const preferences = defaultPreferences.map((pref) =>
        this.preferenceRepository.create({
          userId,
          type: pref.type,
          channel: pref.channel,
          enabled: pref.enabled,
        })
      );

      // Save preferences
      await this.preferenceRepository.save(preferences);

      this.logger.log(
        `Default notification preferences created for user ${userId}`
      );
    } catch (error) {
      this.logger.error(
        `Error setting up default preferences: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Count notifications for a user with optional filtering
   * @param params - Parameters for filtering notifications
   * @returns Total count of matching notifications
   */
  async countNotifications(
    params: Omit<GetNotificationsParams, "limit" | "offset">
  ): Promise<number> {
    try {
      const { userId, isRead, type } = params;

      // Build query with where conditions
      const whereConditions: any = { userId };

      if (isRead !== undefined) {
        whereConditions.isRead = isRead;
      }

      if (type) {
        whereConditions.type = type;
      }

      const count = await this.notificationRepository.count({
        where: whereConditions,
      });

      return count;
    } catch (error) {
      this.logger.error(
        `Error counting notifications: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }
}
