import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { NotificationService } from "./notification.service";
import {
  Notification,
  NotificationType,
} from "../../entities/notification.entity";
import { NotificationPreference } from "../../entities/notification-preference.entity";
import { NotificationChannel } from "../../entities/notification-preference.entity";
import { User } from "../../entities/user.entity";
import { EmailService } from "./email.service";
import { ConfigService } from "@nestjs/config";
import { NotificationGateway } from "./notification.gateway";

// Mock repositories
const mockNotificationRepository = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  remove: jest.fn(),
});

const mockNotificationPreferenceRepository = () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  upsert: jest.fn(),
});

const mockUserRepository = () => ({
  findOne: jest.fn(),
  find: jest.fn(),
});

// Mock email service
const mockEmailService = () => ({
  sendNotificationEmail: jest.fn(),
});

// Mock notification gateway
const mockNotificationGateway = () => ({
  sendNotificationToUser: jest.fn(),
  sendUnreadCount: jest.fn(),
  sendNotificationToUsers: jest.fn(),
});

describe("NotificationService", () => {
  let service: NotificationService;
  let notificationRepo: jest.Mocked<Repository<Notification>>;
  let preferenceRepo: jest.Mocked<Repository<NotificationPreference>>;
  let userRepo: jest.Mocked<Repository<User>>;
  let emailService: jest.Mocked<EmailService>;
  let notificationGateway: jest.Mocked<NotificationGateway>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useFactory: mockNotificationRepository,
        },
        {
          provide: getRepositoryToken(NotificationPreference),
          useFactory: mockNotificationPreferenceRepository,
        },
        {
          provide: getRepositoryToken(User),
          useFactory: mockUserRepository,
        },
        {
          provide: EmailService,
          useFactory: mockEmailService,
        },
        {
          provide: NotificationGateway,
          useFactory: mockNotificationGateway,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              if (key === "APP_URL") return "https://app.ghostpay.com";
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    notificationRepo = module.get(
      getRepositoryToken(Notification)
    ) as jest.Mocked<Repository<Notification>>;
    preferenceRepo = module.get(
      getRepositoryToken(NotificationPreference)
    ) as jest.Mocked<Repository<NotificationPreference>>;
    userRepo = module.get(getRepositoryToken(User)) as jest.Mocked<
      Repository<User>
    >;
    emailService = module.get(EmailService) as jest.Mocked<EmailService>;
    notificationGateway = module.get(
      NotificationGateway
    ) as jest.Mocked<NotificationGateway>;
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("createNotification", () => {
    const mockUser = { id: "user-id", email: "test@example.com" };
    const mockNotificationInput = {
      userId: "user-id",
      type: NotificationType.PAYMENT_RECEIVED,
      title: "Payment Received",
      message: "You have received $50",
      actionUrl: "/payments",
    };

    const mockPreferences = [
      {
        type: NotificationType.PAYMENT_RECEIVED,
        channel: NotificationChannel.IN_APP,
        enabled: true,
      },
      {
        type: NotificationType.PAYMENT_RECEIVED,
        channel: NotificationChannel.EMAIL,
        enabled: true,
      },
    ];

    const mockSavedNotification = {
      id: "notification-id",
      ...mockNotificationInput,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    beforeEach(() => {
      userRepo.findOne.mockResolvedValue(mockUser as User);
      preferenceRepo.find.mockResolvedValue(
        mockPreferences as NotificationPreference[]
      );
      notificationRepo.create.mockReturnValue(
        mockNotificationInput as Notification
      );
      notificationRepo.save.mockResolvedValue(
        mockSavedNotification as Notification
      );
      emailService.sendNotificationEmail.mockResolvedValue("mock-email-id");
      notificationRepo.count.mockResolvedValue(5);
    });

    it("should create a notification", async () => {
      const result = await service.createNotification(mockNotificationInput);

      expect(notificationRepo.create).toHaveBeenCalledWith(
        mockNotificationInput
      );
      expect(notificationRepo.save).toHaveBeenCalled();
      expect(result).toEqual(mockSavedNotification);
    });

    it("should send an email if email preference is enabled", async () => {
      await service.createNotification(mockNotificationInput);

      expect(preferenceRepo.find).toHaveBeenCalledWith({
        where: {
          userId: mockNotificationInput.userId,
          type: mockNotificationInput.type,
        },
      });

      expect(emailService.sendNotificationEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockNotificationInput.title,
        mockNotificationInput.message,
        expect.stringContaining(mockNotificationInput.actionUrl)
      );
    });

    it("should not send an email if email preference is disabled", async () => {
      preferenceRepo.find.mockResolvedValue([
        {
          type: NotificationType.PAYMENT_RECEIVED,
          channel: NotificationChannel.IN_APP,
          enabled: true,
        },
        {
          type: NotificationType.PAYMENT_RECEIVED,
          channel: NotificationChannel.EMAIL,
          enabled: false,
        },
      ] as NotificationPreference[]);

      await service.createNotification(mockNotificationInput);

      expect(emailService.sendNotificationEmail).not.toHaveBeenCalled();
    });

    it("should send real-time notification via WebSockets", async () => {
      await service.createNotification(mockNotificationInput);

      expect(notificationGateway.sendNotificationToUser).toHaveBeenCalledWith(
        mockNotificationInput.userId,
        expect.objectContaining({
          ...mockSavedNotification,
          isNew: true,
        })
      );

      expect(notificationGateway.sendUnreadCount).toHaveBeenCalledWith(
        mockNotificationInput.userId,
        5
      );
    });
  });

  describe("createBulkNotifications", () => {
    const mockUsers = [
      { id: "user-id-1", email: "user1@example.com" },
      { id: "user-id-2", email: "user2@example.com" },
    ];

    const mockBulkInput = {
      userIds: ["user-id-1", "user-id-2"],
      type: NotificationType.SYSTEM_ANNOUNCEMENT,
      title: "System Update",
      message: "The system will be down for maintenance",
      actionUrl: "/announcements",
    };

    const mockNotifications = [
      {
        id: "notif-1",
        userId: "user-id-1",
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: "System Update",
        message: "The system will be down for maintenance",
        actionUrl: "/announcements",
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "notif-2",
        userId: "user-id-2",
        type: NotificationType.SYSTEM_ANNOUNCEMENT,
        title: "System Update",
        message: "The system will be down for maintenance",
        actionUrl: "/announcements",
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    beforeEach(() => {
      userRepo.find.mockResolvedValue(mockUsers as User[]);
      notificationRepo.create.mockImplementation(
        (input) => input as Notification
      );
      notificationRepo.save.mockResolvedValue(mockNotifications as any);
      preferenceRepo.find.mockResolvedValue([
        {
          type: NotificationType.SYSTEM_ANNOUNCEMENT,
          channel: NotificationChannel.IN_APP,
          enabled: true,
        },
      ] as NotificationPreference[]);
      notificationRepo.count.mockResolvedValue(3);
    });

    it("should create notifications for multiple users", async () => {
      const result = await service.createBulkNotifications(mockBulkInput);

      expect(notificationRepo.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            userId: "user-id-1",
            title: mockBulkInput.title,
          }),
          expect.objectContaining({
            userId: "user-id-2",
            title: mockBulkInput.title,
          }),
        ])
      );

      expect(result).toEqual(mockNotifications);
    });

    it("should send real-time notifications via WebSockets for each user", async () => {
      await service.createBulkNotifications(mockBulkInput);

      expect(notificationGateway.sendNotificationToUser).toHaveBeenCalledTimes(
        2
      );
      expect(notificationGateway.sendNotificationToUser).toHaveBeenCalledWith(
        "user-id-1",
        expect.objectContaining({
          ...mockNotifications[0],
          isNew: true,
        })
      );
      expect(notificationGateway.sendNotificationToUser).toHaveBeenCalledWith(
        "user-id-2",
        expect.objectContaining({
          ...mockNotifications[1],
          isNew: true,
        })
      );

      // Should update unread count for each user
      expect(notificationGateway.sendUnreadCount).toHaveBeenCalledTimes(2);
    });
  });

  describe("getNotifications", () => {
    const mockQuery = {
      userId: "user-id",
      isRead: false,
      type: NotificationType.PAYMENT_RECEIVED,
      limit: 10,
      offset: 0,
    };

    const mockNotifications = [
      {
        id: "notification-1",
        type: NotificationType.PAYMENT_RECEIVED,
        title: "Title 1",
        isRead: false,
      },
      {
        id: "notification-2",
        type: NotificationType.PAYMENT_RECEIVED,
        title: "Title 2",
        isRead: false,
      },
    ];

    beforeEach(() => {
      notificationRepo.find.mockResolvedValue(
        mockNotifications as Notification[]
      );
    });

    it("should return notifications", async () => {
      const result = await service.getNotifications(mockQuery);

      expect(notificationRepo.find).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: mockQuery.userId,
          isRead: mockQuery.isRead,
          type: mockQuery.type,
        }),
        order: { createdAt: "DESC" },
        take: mockQuery.limit,
        skip: mockQuery.offset,
      });

      expect(result).toEqual(mockNotifications);
    });
  });

  describe("countNotifications", () => {
    const mockQuery = {
      userId: "user-id",
      isRead: false,
      type: NotificationType.PAYMENT_RECEIVED,
    };

    beforeEach(() => {
      notificationRepo.count.mockResolvedValue(5);
    });

    it("should return count of notifications", async () => {
      const result = await service.countNotifications(mockQuery);

      expect(notificationRepo.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          userId: mockQuery.userId,
          isRead: mockQuery.isRead,
          type: mockQuery.type,
        }),
      });

      expect(result).toBe(5);
    });
  });

  describe("markAsRead", () => {
    const mockNotification = {
      id: "notification-id",
      userId: "user-id",
      isRead: false,
    };

    const mockUpdatedNotification = {
      ...mockNotification,
      isRead: true,
      readAt: expect.any(Date),
    };

    beforeEach(() => {
      notificationRepo.findOne.mockResolvedValue(
        mockNotification as Notification
      );
      notificationRepo.save.mockResolvedValue(
        mockUpdatedNotification as Notification
      );
      notificationRepo.count.mockResolvedValue(4);
    });

    it("should mark a notification as read", async () => {
      const result = await service.markAsRead("notification-id", "user-id");

      expect(notificationRepo.findOne).toHaveBeenCalledWith({
        where: { id: "notification-id", userId: "user-id" },
      });
      expect(notificationRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "notification-id",
          isRead: true,
          readAt: expect.any(Date),
        })
      );
      expect(result).toEqual(mockUpdatedNotification);
    });

    it("should send updated unread count via WebSockets", async () => {
      await service.markAsRead("notification-id", "user-id");

      expect(notificationGateway.sendUnreadCount).toHaveBeenCalledWith(
        "user-id",
        4
      );
    });

    it("should throw an error if notification is not found", async () => {
      notificationRepo.findOne.mockResolvedValue(null);

      await expect(service.markAsRead("bad-id", "user-id")).rejects.toThrow();
    });
  });

  describe("markAllAsRead", () => {
    beforeEach(() => {
      notificationRepo.update.mockResolvedValue({ affected: 5 } as any);
    });

    it("should mark all notifications as read and return count", async () => {
      const result = await service.markAllAsRead("user-id");

      expect(notificationRepo.update).toHaveBeenCalledWith(
        { userId: "user-id", isRead: false },
        { isRead: true, readAt: expect.any(Date) }
      );
      expect(result).toBe(5);
    });

    it("should send updated unread count via WebSockets", async () => {
      await service.markAllAsRead("user-id");

      expect(notificationGateway.sendUnreadCount).toHaveBeenCalledWith(
        "user-id",
        0
      );
    });
  });

  describe("getUnreadCount", () => {
    beforeEach(() => {
      notificationRepo.count.mockResolvedValue(3);
    });

    it("should return the count of unread notifications", async () => {
      const result = await service.getUnreadCount("user-id");

      expect(notificationRepo.count).toHaveBeenCalledWith({
        where: { userId: "user-id", isRead: false },
      });
      expect(result).toBe(3);
    });
  });

  describe("deleteNotification", () => {
    const mockNotification = {
      id: "notification-id",
      userId: "user-id",
      isRead: false,
    };

    beforeEach(() => {
      notificationRepo.findOne.mockResolvedValue(
        mockNotification as Notification
      );
      notificationRepo.remove.mockResolvedValue({} as any);
      notificationRepo.count.mockResolvedValue(2);
    });

    it("should delete a notification", async () => {
      const result = await service.deleteNotification(
        "notification-id",
        "user-id"
      );

      expect(notificationRepo.findOne).toHaveBeenCalledWith({
        where: { id: "notification-id", userId: "user-id" },
      });
      expect(notificationRepo.remove).toHaveBeenCalledWith(mockNotification);
      expect(result).toBeTruthy();
    });

    it("should send updated unread count via WebSockets if notification was unread", async () => {
      await service.deleteNotification("notification-id", "user-id");

      expect(notificationGateway.sendUnreadCount).toHaveBeenCalledWith(
        "user-id",
        2
      );
    });

    it("should not update unread count if notification was already read", async () => {
      notificationRepo.findOne.mockResolvedValue({
        ...mockNotification,
        isRead: true,
      } as Notification);

      await service.deleteNotification("notification-id", "user-id");

      expect(notificationGateway.sendUnreadCount).not.toHaveBeenCalled();
    });

    it("should throw an error if notification is not found", async () => {
      notificationRepo.findOne.mockResolvedValue(null);

      await expect(
        service.deleteNotification("bad-id", "user-id")
      ).rejects.toThrow();
    });
  });

  describe("getPreferences", () => {
    const mockPreferences = [
      {
        type: NotificationType.PAYMENT_RECEIVED,
        channel: NotificationChannel.IN_APP,
        enabled: true,
      },
      {
        type: NotificationType.PAYMENT_RECEIVED,
        channel: NotificationChannel.EMAIL,
        enabled: false,
      },
    ];

    beforeEach(() => {
      preferenceRepo.find.mockResolvedValue(
        mockPreferences as NotificationPreference[]
      );
    });

    it("should return user preferences", async () => {
      const result = await service.getPreferences("user-id");

      expect(preferenceRepo.find).toHaveBeenCalledWith({
        where: { userId: "user-id" },
      });
      expect(result).toEqual(mockPreferences);
    });
  });

  describe("updatePreferences", () => {
    const mockPreferences = [
      {
        type: NotificationType.PAYMENT_RECEIVED,
        channel: NotificationChannel.EMAIL,
        enabled: true,
      },
      {
        type: NotificationType.ESCROW_CREATED,
        channel: NotificationChannel.IN_APP,
        enabled: false,
      },
    ];

    beforeEach(() => {
      preferenceRepo.upsert.mockResolvedValue({} as any);
      preferenceRepo.find.mockResolvedValue(
        mockPreferences as NotificationPreference[]
      );
    });

    it("should update user preferences", async () => {
      const result = await service.updatePreferences(
        "user-id",
        mockPreferences as any
      );

      expect(preferenceRepo.upsert).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            userId: "user-id",
            type: NotificationType.PAYMENT_RECEIVED,
            channel: NotificationChannel.EMAIL,
          }),
        ]),
        { conflictPaths: ["userId", "type", "channel"] }
      );
      expect(result).toEqual(mockPreferences);
    });
  });
});
