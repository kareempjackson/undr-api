import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../app.module";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User, UserRole, UserStatus } from "../../entities/user.entity";
import { Payment } from "../../entities/payment.entity";
import {
  PaymentStatus,
  PaymentMethod,
  ThreeDsStatus,
} from "../../entities/common.enums";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

describe("Payments API (e2e)", () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let paymentRepository: Repository<Payment>;
  let jwtService: JwtService;

  // Test users
  let fanUser: User;
  let fanToken: string;
  let creatorUser: User;
  let creatorToken: string;
  let adminUser: User;
  let adminToken: string;

  // Test payments
  let testPayment: Payment;
  let testPaymentId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User)
    );
    paymentRepository = moduleFixture.get<Repository<Payment>>(
      getRepositoryToken(Payment)
    );
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Create test users
    fanUser = await userRepository.save({
      email: `fan-${Date.now()}@example.com`,
      password: await bcrypt.hash("StrongFanPass123!", 10),
      name: "Fan User",
      role: UserRole.FAN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      walletBalance: 1000, // Start with enough balance
    });
    fanToken = jwtService.sign({
      sub: fanUser.id,
      email: fanUser.email,
      role: fanUser.role,
    });

    creatorUser = await userRepository.save({
      email: `creator-${Date.now()}@example.com`,
      password: await bcrypt.hash("StrongCreatorPass123!", 10),
      name: "Creator User",
      role: UserRole.CREATOR,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      walletBalance: 500,
    });
    creatorToken = jwtService.sign({
      sub: creatorUser.id,
      email: creatorUser.email,
      role: creatorUser.role,
    });

    adminUser = await userRepository.save({
      email: `admin-${Date.now()}@example.com`,
      password: await bcrypt.hash("StrongAdminPass123!", 10),
      name: "Admin User",
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    });
    adminToken = jwtService.sign({
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });

    // Create a test payment
    testPayment = await paymentRepository.save({
      fromUser: fanUser,
      toUser: creatorUser,
      amount: 100,
      fee: 10,
      status: PaymentStatus.COMPLETED,
      paymentMethod: PaymentMethod.WALLET,
      description: "Test payment for content",
      createdAt: new Date(),
      completedAt: new Date(),
    });
    testPaymentId = testPayment.id;
  });

  afterAll(async () => {
    // Clean up test data
    await paymentRepository.delete(testPaymentId);
    await userRepository.delete([fanUser.id, creatorUser.id, adminUser.id]);
    await app.close();
  });

  describe("POST /payments", () => {
    it("should create a new payment as a fan", async () => {
      const paymentData = {
        toUserId: creatorUser.id,
        amount: 50,
        description: "Payment for premium content",
        paymentMethod: PaymentMethod.WALLET,
      };

      const response = await request(app.getHttpServer())
        .post("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(paymentData)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("amount", 50);
      expect(response.body).toHaveProperty("status", PaymentStatus.COMPLETED);
      expect(response.body).toHaveProperty("fromUser.id", fanUser.id);
      expect(response.body).toHaveProperty("toUser.id", creatorUser.id);

      // Clean up this payment
      await paymentRepository.delete(response.body.id);
    });

    it("should reject payment if insufficient wallet balance", async () => {
      const largePaymentData = {
        toUserId: creatorUser.id,
        amount: 2000, // More than the fan's balance
        description: "Payment for premium content",
        paymentMethod: PaymentMethod.WALLET,
      };

      const response = await request(app.getHttpServer())
        .post("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(largePaymentData)
        .expect(400);

      expect(response.body.message).toContain("insufficient");
    });

    it("should reject payment to non-existent user", async () => {
      const invalidPaymentData = {
        toUserId: "non-existent-user-id",
        amount: 50,
        description: "Payment for premium content",
        paymentMethod: PaymentMethod.WALLET,
      };

      await request(app.getHttpServer())
        .post("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(invalidPaymentData)
        .expect(404);
    });

    it("should reject payment with negative amount", async () => {
      const invalidPaymentData = {
        toUserId: creatorUser.id,
        amount: -50,
        description: "Payment for premium content",
        paymentMethod: PaymentMethod.WALLET,
      };

      await request(app.getHttpServer())
        .post("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(invalidPaymentData)
        .expect(400);
    });
  });

  describe("GET /payments/:id", () => {
    it("should retrieve payment details as payment creator", async () => {
      const response = await request(app.getHttpServer())
        .get(`/payments/${testPaymentId}`)
        .set("Authorization", `Bearer ${fanToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", testPaymentId);
      expect(response.body).toHaveProperty("amount", 100);
      expect(response.body).toHaveProperty("status", PaymentStatus.COMPLETED);
      expect(response.body).toHaveProperty(
        "description",
        "Test payment for content"
      );
    });

    it("should retrieve payment details as payment recipient", async () => {
      const response = await request(app.getHttpServer())
        .get(`/payments/${testPaymentId}`)
        .set("Authorization", `Bearer ${creatorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", testPaymentId);
    });

    it("should retrieve payment details as admin", async () => {
      const response = await request(app.getHttpServer())
        .get(`/payments/${testPaymentId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", testPaymentId);
    });

    it("should reject access to payment by unrelated user", async () => {
      // Create another user not related to the payment
      const otherUser = await userRepository.save({
        email: `other-${Date.now()}@example.com`,
        password: await bcrypt.hash("StrongPass123!", 10),
        name: "Other User",
        role: UserRole.FAN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      });
      const otherToken = jwtService.sign({
        sub: otherUser.id,
        email: otherUser.email,
        role: otherUser.role,
      });

      await request(app.getHttpServer())
        .get(`/payments/${testPaymentId}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .expect(403);

      // Clean up
      await userRepository.delete(otherUser.id);
    });

    it("should return 404 for non-existent payment", async () => {
      await request(app.getHttpServer())
        .get("/payments/non-existent-id")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe("GET /payments", () => {
    it("should retrieve user payment history", async () => {
      const response = await request(app.getHttpServer())
        .get("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("payments");
      expect(Array.isArray(response.body.payments)).toBeTruthy();
      expect(
        response.body.payments.some((payment) => payment.id === testPaymentId)
      ).toBeTruthy();
      expect(response.body).toHaveProperty("pagination");
    });

    it("should respect pagination parameters", async () => {
      const response = await request(app.getHttpServer())
        .get("/payments?page=1&limit=5")
        .set("Authorization", `Bearer ${fanToken}`)
        .expect(200);

      expect(response.body.payments.length).toBeLessThanOrEqual(5);
      expect(response.body.pagination).toHaveProperty("page", 1);
      expect(response.body.pagination).toHaveProperty("limit", 5);
    });

    it("should filter payments by status", async () => {
      const response = await request(app.getHttpServer())
        .get(`/payments?status=${PaymentStatus.COMPLETED}`)
        .set("Authorization", `Bearer ${fanToken}`)
        .expect(200);

      expect(
        response.body.payments.every(
          (payment) => payment.status === PaymentStatus.COMPLETED
        )
      ).toBeTruthy();
    });

    it("should filter payments by payment method", async () => {
      const response = await request(app.getHttpServer())
        .get(`/payments?paymentMethod=${PaymentMethod.WALLET}`)
        .set("Authorization", `Bearer ${fanToken}`)
        .expect(200);

      expect(
        response.body.payments.every(
          (payment) => payment.paymentMethod === PaymentMethod.WALLET
        )
      ).toBeTruthy();
    });
  });

  describe("GET /payments/sent", () => {
    it("should retrieve payments sent by the user", async () => {
      const response = await request(app.getHttpServer())
        .get("/payments/sent")
        .set("Authorization", `Bearer ${fanToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("payments");
      expect(Array.isArray(response.body.payments)).toBeTruthy();
      expect(
        response.body.payments.some((payment) => payment.id === testPaymentId)
      ).toBeTruthy();
      expect(
        response.body.payments.every(
          (payment) => payment.fromUser.id === fanUser.id
        )
      ).toBeTruthy();
    });
  });

  describe("GET /payments/received", () => {
    it("should retrieve payments received by the user", async () => {
      const response = await request(app.getHttpServer())
        .get("/payments/received")
        .set("Authorization", `Bearer ${creatorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("payments");
      expect(Array.isArray(response.body.payments)).toBeTruthy();
      expect(
        response.body.payments.some((payment) => payment.id === testPaymentId)
      ).toBeTruthy();
      expect(
        response.body.payments.every(
          (payment) => payment.toUser.id === creatorUser.id
        )
      ).toBeTruthy();
    });
  });

  describe("POST /payments/:id/cancel", () => {
    let cancelablePaymentId: string;

    beforeAll(async () => {
      // Create a pending payment that can be canceled
      const cancelablePayment = await paymentRepository.save({
        fromUser: fanUser,
        toUser: creatorUser,
        amount: 75,
        fee: 7.5,
        status: PaymentStatus.FAILED,
        paymentMethod: PaymentMethod.WALLET,
        description: "Payment to be canceled",
        createdAt: new Date(),
      });
      cancelablePaymentId = cancelablePayment.id;
    });

    afterAll(async () => {
      // Clean up
      await paymentRepository.delete(cancelablePaymentId);
    });

    it("should allow user to cancel their pending payment", async () => {
      const response = await request(app.getHttpServer())
        .post(`/payments/${cancelablePaymentId}/cancel`)
        .set("Authorization", `Bearer ${fanToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("status", PaymentStatus.FAILED);
      expect(response.body).toHaveProperty("id", cancelablePaymentId);

      // Verify in database
      const updatedPayment = await paymentRepository.findOne({
        where: { id: cancelablePaymentId },
      });
      expect(updatedPayment).not.toBeNull();
      expect(updatedPayment!.status).toBe(PaymentStatus.FAILED);
    });

    it("should not allow cancellation of completed payments", async () => {
      await request(app.getHttpServer())
        .post(`/payments/${testPaymentId}/cancel`)
        .set("Authorization", `Bearer ${fanToken}`)
        .expect(400);
    });

    it("should not allow recipients to cancel the payment", async () => {
      // Create another pending payment
      const anotherPendingPayment = await paymentRepository.save({
        fromUser: fanUser,
        toUser: creatorUser,
        amount: 50,
        fee: 5,
        status: PaymentStatus.FAILED,
        paymentMethod: PaymentMethod.WALLET,
        description: "Another payment to test cancellation",
        createdAt: new Date(),
      });

      await request(app.getHttpServer())
        .post(`/payments/${anotherPendingPayment.id}/cancel`)
        .set("Authorization", `Bearer ${creatorToken}`)
        .expect(403);

      // Clean up
      await paymentRepository.delete(anotherPendingPayment.id);
    });
  });

  describe("GET /admin/payments (Admin only)", () => {
    it("should allow admin to view all payments", async () => {
      const response = await request(app.getHttpServer())
        .get("/admin/payments")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("payments");
      expect(Array.isArray(response.body.payments)).toBeTruthy();
      expect(response.body.payments.length).toBeGreaterThan(0);
    });

    it("should deny access to non-admin users", async () => {
      await request(app.getHttpServer())
        .get("/admin/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .expect(403);
    });
  });

  describe("GET /payments/methods", () => {
    it("should retrieve payment methods", async () => {
      const response = await request(app.getHttpServer())
        .get("/payments/methods")
        .set("Authorization", `Bearer ${fanToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body).toContain(PaymentMethod.WALLET);
      expect(response.body).toContain(PaymentMethod.CREDIT_CARD);
    });
  });

  describe("POST /payments", () => {
    it("should create a new payment as a fan", async () => {
      const paymentData = {
        toUserId: creatorUser.id,
        amount: 50,
        description: "Payment for premium content",
        paymentMethod: PaymentMethod.WALLET,
      };

      const response = await request(app.getHttpServer())
        .post("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(paymentData)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("amount", 50);
      expect(response.body).toHaveProperty("status", PaymentStatus.COMPLETED);
      expect(response.body).toHaveProperty("fromUser.id", fanUser.id);
      expect(response.body).toHaveProperty("toUser.id", creatorUser.id);

      // Clean up this payment
      await paymentRepository.delete(response.body.id);
    });

    it("should reject payment if insufficient wallet balance", async () => {
      const largePaymentData = {
        toUserId: creatorUser.id,
        amount: 2000, // More than the fan's balance
        description: "Payment for premium content",
        paymentMethod: PaymentMethod.WALLET,
      };

      const response = await request(app.getHttpServer())
        .post("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(largePaymentData)
        .expect(400);

      expect(response.body.message).toContain("insufficient");
    });

    it("should reject payment to non-existent user", async () => {
      const invalidPaymentData = {
        toUserId: "non-existent-user-id",
        amount: 50,
        description: "Payment for premium content",
        paymentMethod: PaymentMethod.WALLET,
      };

      await request(app.getHttpServer())
        .post("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(invalidPaymentData)
        .expect(404);
    });

    it("should reject payment with negative amount", async () => {
      const invalidPaymentData = {
        toUserId: creatorUser.id,
        amount: -50,
        description: "Payment for premium content",
        paymentMethod: PaymentMethod.WALLET,
      };

      await request(app.getHttpServer())
        .post("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(invalidPaymentData)
        .expect(400);
    });
  });

  describe("POST /payments", () => {
    it("should create a new payment as a fan", async () => {
      const paymentData = {
        toUserId: creatorUser.id,
        amount: 50,
        description: "Payment for premium content",
        paymentMethod: PaymentMethod.WALLET,
      };

      const response = await request(app.getHttpServer())
        .post("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(paymentData)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("amount", 50);
      expect(response.body).toHaveProperty("status", PaymentStatus.COMPLETED);
      expect(response.body).toHaveProperty("fromUser.id", fanUser.id);
      expect(response.body).toHaveProperty("toUser.id", creatorUser.id);

      // Clean up this payment
      await paymentRepository.delete(response.body.id);
    });

    it("should reject payment if insufficient wallet balance", async () => {
      const largePaymentData = {
        toUserId: creatorUser.id,
        amount: 2000, // More than the fan's balance
        description: "Payment for premium content",
        paymentMethod: PaymentMethod.WALLET,
      };

      const response = await request(app.getHttpServer())
        .post("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(largePaymentData)
        .expect(400);

      expect(response.body.message).toContain("insufficient");
    });

    it("should reject payment to non-existent user", async () => {
      const invalidPaymentData = {
        toUserId: "non-existent-user-id",
        amount: 50,
        description: "Payment for premium content",
        paymentMethod: PaymentMethod.WALLET,
      };

      await request(app.getHttpServer())
        .post("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(invalidPaymentData)
        .expect(404);
    });

    it("should reject payment with negative amount", async () => {
      const invalidPaymentData = {
        toUserId: creatorUser.id,
        amount: -50,
        description: "Payment for premium content",
        paymentMethod: PaymentMethod.WALLET,
      };

      await request(app.getHttpServer())
        .post("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(invalidPaymentData)
        .expect(400);
    });
  });

  describe("POST /payments", () => {
    it("should create a new payment as a fan", async () => {
      const paymentData = {
        toUserId: creatorUser.id,
        amount: 50,
        description: "Payment for premium content",
        paymentMethod: PaymentMethod.WALLET,
      };

      const response = await request(app.getHttpServer())
        .post("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(paymentData)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("amount", 50);
      expect(response.body).toHaveProperty("status", PaymentStatus.COMPLETED);
      expect(response.body).toHaveProperty("fromUser.id", fanUser.id);
      expect(response.body).toHaveProperty("toUser.id", creatorUser.id);

      // Clean up this payment
      await paymentRepository.delete(response.body.id);
    });

    it("should reject payment if insufficient wallet balance", async () => {
      const largePaymentData = {
        toUserId: creatorUser.id,
        amount: 2000, // More than the fan's balance
        description: "Payment for premium content",
        paymentMethod: PaymentMethod.WALLET,
      };

      const response = await request(app.getHttpServer())
        .post("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(largePaymentData)
        .expect(400);

      expect(response.body.message).toContain("insufficient");
    });

    it("should reject payment to non-existent user", async () => {
      const invalidPaymentData = {
        toUserId: "non-existent-user-id",
        amount: 50,
        description: "Payment for premium content",
        paymentMethod: PaymentMethod.WALLET,
      };

      await request(app.getHttpServer())
        .post("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(invalidPaymentData)
        .expect(404);
    });

    it("should reject payment with negative amount", async () => {
      const invalidPaymentData = {
        toUserId: creatorUser.id,
        amount: -50,
        description: "Payment for premium content",
        paymentMethod: PaymentMethod.WALLET,
      };

      await request(app.getHttpServer())
        .post("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(invalidPaymentData)
        .expect(400);
    });
  });

  describe("POST /payments", () => {
    it("should create a new payment as a fan", async () => {
      const paymentData = {
        toUserId: creatorUser.id,
        amount: 50,
        description: "Payment for premium content",
        paymentMethod: PaymentMethod.WALLET,
      };

      const response = await request(app.getHttpServer())
        .post("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(paymentData)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("amount", 50);
      expect(response.body).toHaveProperty("status", PaymentStatus.COMPLETED);
      expect(response.body).toHaveProperty("fromUser.id", fanUser.id);
      expect(response.body).toHaveProperty("toUser.id", creatorUser.id);

      // Clean up this payment
      await paymentRepository.delete(response.body.id);
    });

    it("should reject payment if insufficient wallet balance", async () => {
      const largePaymentData = {
        toUserId: creatorUser.id,
        amount: 2000, // More than the fan's balance
        description: "Payment for premium content",
        paymentMethod: PaymentMethod.WALLET,
      };

      const response = await request(app.getHttpServer())
        .post("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(largePaymentData)
        .expect(400);

      expect(response.body.message).toContain("insufficient");
    });

    it("should reject payment to non-existent user", async () => {
      const invalidPaymentData = {
        toUserId: "non-existent-user-id",
        amount: 50,
        description: "Payment for premium content",
        paymentMethod: PaymentMethod.WALLET,
      };

      await request(app.getHttpServer())
        .post("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(invalidPaymentData)
        .expect(404);
    });

    it("should reject payment with negative amount", async () => {
      const invalidPaymentData = {
        toUserId: creatorUser.id,
        amount: -50,
        description: "Payment for premium content",
        paymentMethod: PaymentMethod.WALLET,
      };

      await request(app.getHttpServer())
        .post("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(invalidPaymentData)
        .expect(400);
    });
  });

  describe("POST /payments", () => {
    it("should create a new payment as a fan", async () => {
      const paymentData = {
        toUserId: creatorUser.id,
        amount: 50,
        description: "Payment for premium content",
        paymentMethod: PaymentMethod.WALLET,
      };

      const response = await request(app.getHttpServer())
        .post("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(paymentData)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("amount", 50);
      expect(response.body).toHaveProperty("status", PaymentStatus.COMPLETED);
      expect(response.body).toHaveProperty("fromUser.id", fanUser.id);
      expect(response.body).toHaveProperty("toUser.id", creatorUser.id);

      // Clean up this payment
      await paymentRepository.delete(response.body.id);
    });

    it("should reject payment if insufficient wallet balance", async () => {
      const largePaymentData = {
        toUserId: creatorUser.id,
        amount: 2000, // More than the fan's balance
        description: "Payment for premium content",
        paymentMethod: PaymentMethod.WALLET,
      };

      const response = await request(app.getHttpServer())
        .post("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(largePaymentData)
        .expect(400);

      expect(response.body.message).toContain("insufficient");
    });

    it("should reject payment to non-existent user", async () => {
      const invalidPaymentData = {
        toUserId: "non-existent-user-id",
        amount: 50,
        description: "Payment for premium content",
        paymentMethod: PaymentMethod.WALLET,
      };

      await request(app.getHttpServer())
        .post("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(invalidPaymentData)
        .expect(404);
    });

    it("should reject payment with negative amount", async () => {
      const invalidPaymentData = {
        toUserId: creatorUser.id,
        amount: -50,
        description: "Payment for premium content",
        paymentMethod: PaymentMethod.WALLET,
      };

      await request(app.getHttpServer())
        .post("/payments")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(invalidPaymentData)
        .expect(400);
    });
  });
});
