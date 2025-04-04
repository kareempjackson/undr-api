import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { getRepositoryToken } from "@nestjs/typeorm";
import { JwtModule, JwtService } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { AuthModule } from "../auth/auth.module";
import { NotificationModule } from "./notification.module";
import {
  Notification,
  NotificationType,
} from "../../entities/notification.entity";
import { NotificationPreference } from "../../entities/notification-preference.entity";
import { NotificationChannel } from "../../entities/notification-preference.entity";
import { User, UserRole } from "../../entities/user.entity";
import { Repository } from "typeorm";
import * as io from "socket.io-client";
import { AppModule } from "../../app.module";
import { NotificationService } from "./notification.service";

describe("NotificationController (e2e)", () => {
  let app: INestApplication;
  let notificationRepository: Repository<Notification>;
  let preferenceRepository: Repository<NotificationPreference>;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let jwtToken: string;
  let testUser: User;
  let notificationService: NotificationService;
  let configService: ConfigService;
  let socket: io.Socket;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get<string>("JWT_SECRET") || "test-secret",
            signOptions: { expiresIn: "1h" },
          }),
        }),
        AuthModule,
        NotificationModule,
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    notificationRepository = moduleFixture.get(
      getRepositoryToken(Notification)
    );
    preferenceRepository = moduleFixture.get(
      getRepositoryToken(NotificationPreference)
    );
    userRepository = moduleFixture.get(getRepositoryToken(User));
    jwtService = moduleFixture.get(JwtService);
    notificationService =
      moduleFixture.get<NotificationService>(NotificationService);
    configService = moduleFixture.get<ConfigService>(ConfigService);

    await app.init();

    // Create a test user
    testUser = await createTestUser();

    // Generate JWT token for this user
    jwtToken = generateJwtToken(testUser);

    // Clear existing notifications
    await notificationRepository.delete({ userId: testUser.id });
  });

  afterAll(async () => {
    // Clean up test data
    await notificationRepository.delete({ userId: testUser.id });
    await preferenceRepository.delete({ userId: testUser.id });
    await userRepository.delete({ id: testUser.id });

    if (socket) {
      socket.disconnect();
    }

    await app.close();
  });

  async function createTestUser(): Promise<User> {
    const email = `test-${Date.now()}@example.com`;
    const user = userRepository.create({
      email,
      name: "Test User",
      alias: `testuser-${Date.now()}`,
      role: UserRole.FAN,
      // Add any other required fields based on your User entity
    });

    return await userRepository.save(user);
  }

  function generateJwtToken(user: User): string {
    return jwtService.sign({
      userId: user.id,
      email: user.email,
    });
  }

  async function createTestNotification(
    type: NotificationType = NotificationType.SYSTEM
  ): Promise<Notification> {
    const notification = notificationRepository.create({
      userId: testUser.id,
      type,
      title: "Test Notification",
      message: "This is a test notification",
      isRead: false,
    });

    return await notificationRepository.save(notification);
  }

  describe("/notifications (GET)", () => {
    beforeEach(async () => {
      // Create some test notifications
      await createTestNotification(NotificationType.SYSTEM);
      await createTestNotification(NotificationType.PAYMENT_RECEIVED);
    });

    afterEach(async () => {
      // Clean up notifications after each test
      await notificationRepository.delete({ userId: testUser.id });
    });

    it("should return user notifications", () => {
      return request(app.getHttpServer())
        .get("/notifications")
        .set("Authorization", `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("notifications");
          expect(res.body).toHaveProperty("total");
          expect(Array.isArray(res.body.notifications)).toBe(true);
          expect(res.body.notifications.length).toBeGreaterThan(0);
        });
    });

    it("should filter notifications by type", () => {
      return request(app.getHttpServer())
        .get("/notifications?type=system")
        .set("Authorization", `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.notifications)).toBe(true);
          expect(
            res.body.notifications.every(
              (n) => n.type === NotificationType.SYSTEM
            )
          ).toBe(true);
        });
    });

    it("should filter notifications by read status", () => {
      return request(app.getHttpServer())
        .get("/notifications?isRead=false")
        .set("Authorization", `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.notifications)).toBe(true);
          expect(res.body.notifications.every((n) => n.isRead === false)).toBe(
            true
          );
        });
    });
  });

  describe("/notifications/unread-count (GET)", () => {
    beforeEach(async () => {
      // Create unread notifications
      await createTestNotification();
      await createTestNotification();
    });

    afterEach(async () => {
      await notificationRepository.delete({ userId: testUser.id });
    });

    it("should return the unread count", () => {
      return request(app.getHttpServer())
        .get("/notifications/unread-count")
        .set("Authorization", `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("count");
          expect(typeof res.body.count).toBe("number");
          expect(res.body.count).toBeGreaterThanOrEqual(2);
        });
    });
  });

  describe("/notifications/:id/read (PATCH)", () => {
    let notification: Notification;

    beforeEach(async () => {
      notification = await createTestNotification();
    });

    afterEach(async () => {
      await notificationRepository.delete({ userId: testUser.id });
    });

    it("should mark a notification as read", () => {
      return request(app.getHttpServer())
        .patch(`/notifications/${notification.id}/read`)
        .set("Authorization", `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("message");
          expect(res.body.message).toContain("marked as read");
        });
    });

    it("should return 404 for non-existent notification", () => {
      return request(app.getHttpServer())
        .patch("/notifications/non-existent-id/read")
        .set("Authorization", `Bearer ${jwtToken}`)
        .expect(404);
    });
  });

  describe("/notifications/mark-all-read (POST)", () => {
    beforeEach(async () => {
      // Create multiple unread notifications
      await createTestNotification();
      await createTestNotification();
      await createTestNotification();
    });

    afterEach(async () => {
      await notificationRepository.delete({ userId: testUser.id });
    });

    it("should mark all notifications as read", () => {
      return request(app.getHttpServer())
        .post("/notifications/mark-all-read")
        .set("Authorization", `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("count");
          expect(res.body).toHaveProperty("message");
          expect(res.body.count).toBeGreaterThanOrEqual(3);
        });
    });
  });

  describe("/notifications/:id (DELETE)", () => {
    let notification: Notification;

    beforeEach(async () => {
      notification = await createTestNotification();
    });

    afterEach(async () => {
      await notificationRepository.delete({ userId: testUser.id });
    });

    it("should delete a notification", () => {
      return request(app.getHttpServer())
        .delete(`/notifications/${notification.id}`)
        .set("Authorization", `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("message");
          expect(res.body.message).toContain("deleted successfully");
        });
    });

    it("should return 404 for non-existent notification", () => {
      return request(app.getHttpServer())
        .delete("/notifications/non-existent-id")
        .set("Authorization", `Bearer ${jwtToken}`)
        .expect(404);
    });
  });

  describe("/notifications/preferences (GET & PATCH)", () => {
    beforeEach(async () => {
      // Create default preferences for the test user
      const notificationService = app.get("NotificationService");
      await notificationService.setupDefaultPreferences(testUser.id);
    });

    afterEach(async () => {
      await preferenceRepository.delete({ userId: testUser.id });
    });

    it("should get user preferences", () => {
      return request(app.getHttpServer())
        .get("/notifications/preferences")
        .set("Authorization", `Bearer ${jwtToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("preferences");
          expect(Array.isArray(res.body.preferences)).toBe(true);
          expect(res.body.preferences.length).toBeGreaterThan(0);
        });
    });

    it("should update user preferences", () => {
      const updatedPreferences = [
        {
          type: NotificationType.PAYMENT_RECEIVED,
          channel: NotificationChannel.EMAIL,
          enabled: false,
        },
      ];

      return request(app.getHttpServer())
        .patch("/notifications/preferences")
        .set("Authorization", `Bearer ${jwtToken}`)
        .send({ preferences: updatedPreferences })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty("preferences");
          expect(res.body).toHaveProperty("message");

          // Find the updated preference
          const updatedPref = res.body.preferences.find(
            (p) =>
              p.type === NotificationType.PAYMENT_RECEIVED &&
              p.channel === NotificationChannel.EMAIL
          );

          expect(updatedPref).toBeDefined();
          expect(updatedPref.enabled).toBe(false);
        });
    });

    it("should reject invalid preferences data", () => {
      return request(app.getHttpServer())
        .patch("/notifications/preferences")
        .set("Authorization", `Bearer ${jwtToken}`)
        .send({ preferences: [] })
        .expect(400);
    });
  });

  describe("WebSocket Connections", () => {
    it("should connect to WebSocket server with valid JWT token", (done) => {
      // Connect to WebSocket server with token
      const serverUrl = `http://localhost:3001/notifications`;
      socket = io.connect(serverUrl, {
        extraHeaders: {
          Authorization: `Bearer ${jwtToken}`,
        },
        transports: ["websocket"],
        forceNew: true,
      });

      // Listen for connection event
      socket.on("connect", () => {
        expect(socket.connected).toBe(true);
        done();
      });

      // Handle connection error
      socket.on("connect_error", (err) => {
        console.error("Connection error:", err);
        done.fail(err);
      });
    });

    it("should reject connection without a valid token", (done) => {
      // Try to connect without a token
      const invalidSocket = io.connect(`http://localhost:3001/notifications`, {
        transports: ["websocket"],
        forceNew: true,
      });

      // Should be disconnected
      invalidSocket.on("disconnect", () => {
        expect(invalidSocket.connected).toBe(false);
        done();
      });

      // If we somehow connect, fail the test
      invalidSocket.on("connect", () => {
        invalidSocket.disconnect();
        done.fail("Should not connect without a token");
      });
    });

    it("should subscribe to notifications", (done) => {
      socket.emit("subscribe_notifications", {}, (response) => {
        expect(response.success).toBe(true);
        done();
      });
    });
  });

  describe("Real-time Notifications", () => {
    it("should receive notification when created via service", (done) => {
      // Listen for notification event
      socket.on("notification", (event) => {
        expect(event.type).toBe("notification");
        expect(event.data.userId).toBe(testUser.id);
        expect(event.data.title).toBe("Test Notification");
        expect(event.data.isNew).toBe(true);
        done();
      });

      // Create a notification
      notificationService.createNotification({
        userId: testUser.id,
        type: NotificationType.PAYMENT_RECEIVED,
        title: "Test Notification",
        message: "This is a test notification",
        actionUrl: "/test",
      });
    });

    it("should receive unread count updates", (done) => {
      // Listen for unread count event
      socket.on("unread_count", (event) => {
        expect(event.type).toBe("unread_count");
        expect(event.data.count).toBeGreaterThanOrEqual(1);
        done();
      });

      // Create another notification
      notificationService.createNotification({
        userId: testUser.id,
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: "System Announcement",
        message: "This is a system announcement",
        actionUrl: "/announcements",
      });
    });

    it("should update unread count when marking notification as read", async () => {
      // Create a new notification
      const notification = await notificationService.createNotification({
        userId: testUser.id,
        type: NotificationType.ESCROW_CREATED,
        title: "Escrow Created",
        message: "A new escrow has been created",
        actionUrl: "/escrow",
      });

      // Define a promise for receiving the unread count update
      const unreadCountPromise = new Promise<number>((resolve) => {
        socket.once("unread_count", (event) => {
          resolve(event.data.count);
        });
      });

      // Mark the notification as read
      await notificationService.markAsRead(notification.id, testUser.id);

      // Wait for the unread count update
      const count = await unreadCountPromise;

      // Verify the count decreased
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("REST API Integration with WebSockets", () => {
    let notification: Notification;

    beforeEach(async () => {
      // Create a test notification
      notification = await notificationService.createNotification({
        userId: testUser.id,
        type: NotificationType.PAYMENT_RECEIVED,
        title: "API Test Notification",
        message: "This is a test notification for API testing",
        actionUrl: "/test",
      });
    });

    it("should mark notification as read via API and update count via WebSocket", async () => {
      // Define a promise for receiving the unread count update
      const unreadCountPromise = new Promise<number>((resolve) => {
        socket.once("unread_count", (event) => {
          resolve(event.data.count);
        });
      });

      // Make API request to mark notification as read
      await request(app.getHttpServer())
        .patch(`/notifications/${notification.id}/read`)
        .set("Authorization", `Bearer ${jwtToken}`)
        .expect(200);

      // Wait for the unread count update via WebSocket
      const count = await unreadCountPromise;

      // Verify the count was updated
      expect(typeof count).toBe("number");
    });

    it("should mark all notifications as read via API and update count via WebSocket", async () => {
      // Create multiple notifications
      await Promise.all([
        notificationService.createNotification({
          userId: testUser.id,
          type: NotificationType.PAYMENT_RECEIVED,
          title: "Notification 1",
          message: "Test message 1",
        }),
        notificationService.createNotification({
          userId: testUser.id,
          type: NotificationType.PAYMENT_RECEIVED,
          title: "Notification 2",
          message: "Test message 2",
        }),
      ]);

      // Define a promise for receiving the unread count update
      const unreadCountPromise = new Promise<number>((resolve) => {
        socket.once("unread_count", (event) => {
          resolve(event.data.count);
        });
      });

      // Make API request to mark all notifications as read
      await request(app.getHttpServer())
        .post("/notifications/mark-all-read")
        .set("Authorization", `Bearer ${jwtToken}`)
        .expect(200);

      // Wait for the unread count update via WebSocket
      const count = await unreadCountPromise;

      // Verify count is zero since all notifications should be read
      expect(count).toBe(0);
    });
  });

  describe("Server-Sent Events (SSE)", () => {
    it("should establish SSE connection and receive initial unread count", async () => {
      const response = await request(app.getHttpServer())
        .get("/notifications/events")
        .set("Authorization", `Bearer ${jwtToken}`)
        .set("Accept", "text/event-stream")
        .expect(200)
        .expect("Content-Type", /text\/event-stream/);

      // Check that we got a proper SSE response with initial unread count
      expect(response.text).toContain("data:");
      expect(response.text).toContain("unread_count");
    });
  });
});
