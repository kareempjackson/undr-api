import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as io from "socket.io-client";
import { JwtService } from "@nestjs/jwt";
import { getRepositoryToken } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "../../app.module";
import {
  Notification,
  NotificationType,
} from "../../entities/notification.entity";
import { User } from "../../entities/user.entity";
import { NotificationService } from "./notification.service";
import { NotificationChannel } from "../../entities/notification-preference.entity";

describe("WebSocket Notification System", () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let notificationService: NotificationService;
  let socket: io.Socket;
  let testUser: any;
  let testToken: string;

  // Helper to create a socket connection
  const createSocketConnection = (token: string) => {
    return io.connect("http://localhost:3001/notifications", {
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
      transports: ["websocket"],
      forceNew: true,
    });
  };

  beforeAll(async () => {
    // Create test module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // Create and init app
    app = moduleFixture.createNestApplication();
    await app.init();

    // Get services
    jwtService = app.get<JwtService>(JwtService);
    notificationService = app.get<NotificationService>(NotificationService);
    const userRepository = app.get(getRepositoryToken(User));

    // Create test user
    testUser = await userRepository.save({
      email: "websocket-test@example.com",
      name: "WebSocket Test User",
      alias: "websocket-tester",
      role: "user",
      isVerified: true,
      password: "hashed_password_here",
    });

    // Generate token for test user
    testToken = jwtService.sign({
      sub: testUser.id,
      email: testUser.email,
    });

    // Start listening
    await app.listen(3001);
  });

  afterAll(async () => {
    // Clean up
    if (socket) {
      socket.disconnect();
    }

    // Remove test user data
    const userRepository = app.get(getRepositoryToken(User));
    const notificationRepository = app.get(getRepositoryToken(Notification));

    await notificationRepository.delete({ userId: testUser.id });
    await userRepository.delete({ id: testUser.id });

    await app.close();
  });

  describe("Connection and Authentication", () => {
    it("should connect with valid token", (done) => {
      socket = createSocketConnection(testToken);

      socket.on("connect", () => {
        expect(socket.connected).toBe(true);
        done();
      });

      socket.on("connect_error", (err) => {
        done.fail(`Connection failed: ${err.message}`);
      });
    });

    it("should reject connection with invalid token", (done) => {
      const invalidSocket = createSocketConnection("invalid.token.here");

      // Should be disconnected
      invalidSocket.on("disconnect", () => {
        expect(invalidSocket.connected).toBe(false);
        done();
      });

      // If we connect, fail test
      invalidSocket.on("connect", () => {
        invalidSocket.disconnect();
        done.fail("Should not connect with invalid token");
      });
    });

    it("should allow subscribing to notifications", (done) => {
      socket.emit("subscribe_notifications", {}, (response) => {
        expect(response.success).toBe(true);
        done();
      });
    });
  });

  describe("Notification Delivery", () => {
    it("should receive notification when created via service", (done) => {
      // Listen for notification
      socket.on("notification", (event) => {
        expect(event.type).toBe("notification");
        expect(event.data.userId).toBe(testUser.id);
        expect(event.data.title).toBe("Test WebSocket Notification");
        done();
      });

      // Create notification
      notificationService.createNotification({
        userId: testUser.id,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: "Test WebSocket Notification",
        message: "This is a test notification sent via WebSocket",
      });
    });

    it("should receive unread count updates", (done) => {
      // Listen for unread count
      socket.on("unread_count", (event) => {
        expect(event.type).toBe("unread_count");
        expect(event.data.count).toBeGreaterThanOrEqual(0);
        done();
      });

      // Mark notification as read to trigger update
      notificationService
        .getNotifications({
          userId: testUser.id,
          isRead: false,
          limit: 1,
        })
        .then((notifications) => {
          if (notifications.length > 0) {
            notificationService.markAsRead(notifications[0].id, testUser.id);
          } else {
            // Create a notification if none exists
            notificationService.createNotification({
              userId: testUser.id,
              type: NotificationType.PAYMENT_RECEIVED,
              title: "Another Test Notification",
              message: "This is another test notification",
            });
          }
        });
    });

    it("should receive bulk notifications", (done) => {
      let notificationsReceived = 0;

      // Listen for notifications
      const listener = (event) => {
        expect(event.data.title).toBe("Bulk Test Notification");
        notificationsReceived++;

        if (notificationsReceived === 1) {
          socket.off("notification", listener);
          done();
        }
      };

      socket.on("notification", listener);

      // Create bulk notification
      notificationService.createBulkNotifications({
        userIds: [testUser.id],
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: "Bulk Test Notification",
        message: "This is a bulk test notification",
      });
    });
  });

  describe("Notification Management", () => {
    let testNotificationId: string;

    beforeEach(async () => {
      // Create a test notification
      const notification = await notificationService.createNotification({
        userId: testUser.id,
        type: NotificationType.PAYMENT_RECEIVED,
        title: "Test Management Notification",
        message: "This is a test notification for management testing",
      });

      testNotificationId = notification.id;
    });

    it("should update unread count when marking as read", (done) => {
      socket.on("unread_count", (event) => {
        expect(event.type).toBe("unread_count");
        done();
      });

      notificationService.markAsRead(testNotificationId, testUser.id);
    });

    it("should update unread count when marking all as read", (done) => {
      socket.on("unread_count", (event) => {
        expect(event.type).toBe("unread_count");
        expect(event.data.count).toBe(0);
        done();
      });

      notificationService.markAllAsRead(testUser.id);
    });

    it("should update unread count when deleting an unread notification", (done) => {
      // First, ensure notification is unread
      notificationService
        .createNotification({
          userId: testUser.id,
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          title: "Delete Test Notification",
          message: "This notification will be deleted",
        })
        .then((notification) => {
          socket.on("unread_count", (event) => {
            expect(event.type).toBe("unread_count");
            done();
          });

          notificationService.deleteNotification(notification.id, testUser.id);
        });
    });
  });

  describe("Reconnection and Session Management", () => {
    it("should restore notification subscription after reconnection", (done) => {
      // Disconnect socket
      socket.disconnect();

      // Reconnect
      socket = createSocketConnection(testToken);

      socket.on("connect", () => {
        // Subscribe again
        socket.emit("subscribe_notifications", {}, (response) => {
          expect(response.success).toBe(true);

          // Test notification delivery after reconnection
          socket.on("notification", (event) => {
            expect(event.data.title).toBe("Reconnection Test");
            done();
          });

          // Create a notification
          notificationService.createNotification({
            userId: testUser.id,
            type: NotificationType.SYSTEM_ANNOUNCEMENT,
            title: "Reconnection Test",
            message: "Testing notification delivery after reconnection",
          });
        });
      });
    });

    it("should handle multiple connections from the same user", (done) => {
      // Create second connection
      const secondSocket = createSocketConnection(testToken);

      secondSocket.on("connect", () => {
        // Subscribe second connection
        secondSocket.emit("subscribe_notifications", {}, () => {
          // Listen on both connections
          const notifications = new Set();

          const checkComplete = () => {
            if (notifications.size === 2) {
              secondSocket.disconnect();
              done();
            }
          };

          socket.on("notification", (event) => {
            expect(event.data.title).toBe("Multi-Connection Test");
            notifications.add("socket1");
            checkComplete();
          });

          secondSocket.on("notification", (event) => {
            expect(event.data.title).toBe("Multi-Connection Test");
            notifications.add("socket2");
            checkComplete();
          });

          // Create notification that should be delivered to both
          notificationService.createNotification({
            userId: testUser.id,
            type: NotificationType.SYSTEM_ANNOUNCEMENT,
            title: "Multi-Connection Test",
            message: "Testing delivery to multiple connections",
          });
        });
      });
    });
  });
});
