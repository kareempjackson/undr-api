import { NotificationType } from "../../../entities/notification.entity";
import { NotificationChannel } from "../../../entities/notification-preference.entity";

/**
 * Parameters for creating a notification
 */
export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Parameters for creating multiple notifications
 */
export interface CreateBulkNotificationsParams {
  userIds: string[];
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Parameters for retrieving notifications
 */
export interface GetNotificationsParams {
  userId: string;
  isRead?: boolean;
  type?: NotificationType;
  limit?: number;
  offset?: number;
}

/**
 * Parameters for updating notification preferences
 */
export interface UpdatePreferencesParams {
  userId: string;
  preferences: NotificationPreferenceItem[];
}

/**
 * Individual notification preference item
 */
export interface NotificationPreferenceItem {
  type: NotificationType;
  channel: NotificationChannel;
  enabled: boolean;
}

/**
 * Real-time notification event
 */
export interface NotificationEvent {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  isNew?: boolean; // Flag to indicate a newly created notification
}

/**
 * Unread count event
 */
export interface UnreadCountEvent {
  count: number;
}

/**
 * Connected WebSocket client information
 */
export interface ConnectedClient {
  userId: string;
  socketId: string;
  connectedAt?: Date;
  userAgent?: string;
  ipAddress?: string;
}

/**
 * WebSocket event types for notifications
 */
export enum WebSocketEventType {
  NOTIFICATION = "notification",
  UNREAD_COUNT = "unread_count",
  SUBSCRIBE = "subscribe_notifications",
  PING = "ping",
}

/**
 * WebSocket event structure
 */
export interface WebSocketEvent<T> {
  type: WebSocketEventType;
  data: T;
  timestamp: Date;
}
