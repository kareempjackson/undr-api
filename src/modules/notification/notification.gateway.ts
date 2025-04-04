import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  ConnectedSocket,
  MessageBody,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import {
  Logger,
  UseGuards,
  Injectable,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { AuthService } from "../auth/auth.service";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { NotificationService } from "./notification.service";
import {
  ConnectedClient,
  NotificationEvent,
  UnreadCountEvent,
  WebSocketEventType,
  WebSocketEvent,
} from "./interfaces/notification.interfaces";

@WebSocketGateway({
  cors: {
    origin: "*", // In production, this should be configured to your specific origins
    credentials: true,
  },
  namespace: "notifications",
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly connectedClients: Map<string, ConnectedClient> = new Map();
  private readonly logger = new Logger(NotificationGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService
  ) {}

  afterInit(server: Server) {
    this.logger.log("Notification WebSocket Gateway initialized");
  }

  async handleConnection(client: Socket) {
    try {
      // Extract JWT token from the handshake
      const token = this.extractTokenFromHeader(client);

      if (!token) {
        this.logger.warn(
          `Client attempted to connect without a token: ${client.id}`
        );
        client.disconnect();
        return;
      }

      // Verify the token
      try {
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get<string>("JWT_SECRET"),
        });

        const userId = payload.sub;

        // Register the client
        const connectedClient: ConnectedClient = {
          userId,
          socketId: client.id,
          connectedAt: new Date(),
          userAgent: client.handshake.headers["user-agent"] as string,
          ipAddress: client.handshake.address,
        };

        this.connectedClients.set(client.id, connectedClient);

        // Join the user to their private room
        client.join(`user:${userId}`);

        this.logger.log(`Client connected: ${client.id} (User ID: ${userId})`);

        // Emit the current unread count to the user
        const unreadCount = await this.notificationService.getUnreadCount(
          userId
        );
        this.sendUnreadCount(userId, unreadCount);
      } catch (error) {
        this.logger.warn(
          `Invalid token from client ${client.id}: ${error.message}`
        );
        client.disconnect();
        return;
      }
    } catch (error) {
      this.logger.error(
        `Error during client connection: ${error.message}`,
        error.stack
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    try {
      const connectedClient = this.connectedClients.get(client.id);

      if (connectedClient) {
        this.logger.log(
          `Client disconnected: ${client.id} (User ID: ${connectedClient.userId})`
        );
        this.connectedClients.delete(client.id);
      } else {
        this.logger.log(`Unknown client disconnected: ${client.id}`);
      }
    } catch (error) {
      this.logger.error(
        `Error during client disconnect: ${error.message}`,
        error.stack
      );
    }
  }

  @SubscribeMessage(WebSocketEventType.SUBSCRIBE)
  handleSubscribeNotifications(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any
  ) {
    try {
      const connectedClient = this.connectedClients.get(client.id);

      if (!connectedClient) {
        this.logger.warn(`Unknown client tried to subscribe: ${client.id}`);
        return { success: false, message: "Not authenticated" };
      }

      this.logger.log(
        `Client ${client.id} (User ID: ${connectedClient.userId}) subscribed to notifications`
      );

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error during subscription: ${error.message}`,
        error.stack
      );
      return { success: false, message: "Internal server error" };
    }
  }

  /**
   * Send a real-time notification to a specific user
   * @param userId - The user ID to send the notification to
   * @param notification - The notification object
   */
  sendNotificationToUser(userId: string, notification: NotificationEvent) {
    try {
      const event: WebSocketEvent<NotificationEvent> = {
        type: WebSocketEventType.NOTIFICATION,
        data: notification,
        timestamp: new Date(),
      };

      this.server
        .to(`user:${userId}`)
        .emit(WebSocketEventType.NOTIFICATION, event);
      this.logger.debug(`Sent notification to user ${userId}`);
    } catch (error) {
      this.logger.error(
        `Error sending notification to user ${userId}: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Update the unread notification count for a user
   * @param userId - The user ID
   * @param count - The new unread count
   */
  sendUnreadCount(userId: string, count: number) {
    try {
      const event: WebSocketEvent<UnreadCountEvent> = {
        type: WebSocketEventType.UNREAD_COUNT,
        data: { count },
        timestamp: new Date(),
      };

      this.server
        .to(`user:${userId}`)
        .emit(WebSocketEventType.UNREAD_COUNT, event);
      this.logger.debug(`Updated unread count for user ${userId}: ${count}`);
    } catch (error) {
      this.logger.error(
        `Error updating unread count for user ${userId}: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Send a notification to multiple users at once
   * @param userIds - Array of user IDs
   * @param notification - The notification object
   */
  sendNotificationToUsers(userIds: string[], notification: NotificationEvent) {
    try {
      for (const userId of userIds) {
        this.sendNotificationToUser(userId, notification);
      }
    } catch (error) {
      this.logger.error(
        `Error sending notification to multiple users: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Send a ping message to keep connections alive
   */
  sendPingToAll() {
    try {
      const event: WebSocketEvent<null> = {
        type: WebSocketEventType.PING,
        data: null,
        timestamp: new Date(),
      };

      this.server.emit(WebSocketEventType.PING, event);
      this.logger.debug("Sent ping to all connected clients");
    } catch (error) {
      this.logger.error(`Error sending ping: ${error.message}`, error.stack);
    }
  }

  /**
   * Get active connection count
   * @returns Number of active connections
   */
  getActiveConnectionCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Extract JWT token from socket handshake
   * @param client - The socket client
   * @returns The extracted token or null if not found
   */
  private extractTokenFromHeader(client: Socket): string | null {
    const authHeader = client.handshake.headers.authorization;
    if (!authHeader) return null;

    const [bearer, token] = authHeader.split(" ");
    if (bearer !== "Bearer" || !token) return null;

    return token;
  }
}
