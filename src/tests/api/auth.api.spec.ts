import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../app.module";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User, UserRole, UserStatus } from "../../entities/user.entity";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

describe("Auth API (e2e)", () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let jwtService: JwtService;
  let testUserEmail: string;
  let testUserPassword: string;
  let testUserId: string;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User)
    );
    jwtService = moduleFixture.get<JwtService>(JwtService);

    // Setup test user data
    testUserEmail = `test-user-${Date.now()}@example.com`;
    testUserPassword = "StrongPassword123!";
  });

  afterAll(async () => {
    // Cleanup - delete test user
    if (testUserId) {
      await userRepository.delete(testUserId);
    }
    await app.close();
  });

  describe("POST /auth/register", () => {
    it("should register a new user", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: testUserEmail,
          password: testUserPassword,
          name: "Test User",
          role: UserRole.FAN,
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("email", testUserEmail);
      expect(response.body).toHaveProperty("token");
      expect(response.body.message).toContain("User registered successfully");

      // Save user ID for cleanup
      testUserId = response.body.id;
    });

    it("should reject registration with existing email", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: testUserEmail,
          password: testUserPassword,
          name: "Duplicate User",
          role: UserRole.FAN,
        })
        .expect(400);

      expect(response.body.message).toContain("already exists");
    });

    it("should reject registration with weak password", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          email: "weak-password@example.com",
          password: "weak",
          name: "Weak Password User",
          role: UserRole.FAN,
        })
        .expect(400);

      expect(response.body.message).toContain("password");
    });
  });

  describe("POST /auth/login", () => {
    it("should authenticate a user with valid credentials", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: testUserEmail,
          password: testUserPassword,
        })
        .expect(200);

      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe(testUserEmail);

      // Save token for later use
      authToken = response.body.token;
    });

    it("should reject authentication with invalid credentials", async () => {
      await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: testUserEmail,
          password: "WrongPassword123!",
        })
        .expect(401);
    });

    it("should reject authentication for non-existent user", async () => {
      await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: "non-existent@example.com",
          password: testUserPassword,
        })
        .expect(401);
    });
  });

  describe("GET /auth/me", () => {
    it("should get current user profile with valid token", async () => {
      const response = await request(app.getHttpServer())
        .get("/auth/me")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", testUserId);
      expect(response.body).toHaveProperty("email", testUserEmail);
      expect(response.body).toHaveProperty("role", UserRole.FAN);
    });

    it("should reject request without authentication", async () => {
      await request(app.getHttpServer()).get("/auth/me").expect(401);
    });

    it("should reject request with invalid token", async () => {
      await request(app.getHttpServer())
        .get("/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });
  });

  describe("POST /auth/reset-password-request", () => {
    it("should initiate password reset for existing user", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/reset-password-request")
        .send({
          email: testUserEmail,
        })
        .expect(200);

      expect(response.body.message).toContain("reset link");
    });

    it("should handle request for non-existent email gracefully", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/reset-password-request")
        .send({
          email: "non-existent@example.com",
        })
        .expect(200); // Should return 200 even if user doesn't exist for security

      expect(response.body.message).toContain("reset link");
    });
  });

  describe("POST /auth/verify-email", () => {
    let verificationToken: string;

    beforeAll(async () => {
      // Create a verification token
      const user = await userRepository.findOne({ where: { id: testUserId } });
      verificationToken = jwtService.sign(
        { sub: user.id, email: user.email, type: "email-verification" },
        { expiresIn: "1h" }
      );

      // Update user to unverified state for testing
      await userRepository.update(testUserId, { emailVerified: false });
    });

    it("should verify user email with valid token", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/verify-email")
        .send({
          token: verificationToken,
        })
        .expect(200);

      expect(response.body.message).toContain("verified");

      // Check that user is now verified
      const user = await userRepository.findOne({ where: { id: testUserId } });
      expect(user.emailVerified).toBe(true);
    });

    it("should reject verification with invalid token", async () => {
      await request(app.getHttpServer())
        .post("/auth/verify-email")
        .send({
          token: "invalid-token",
        })
        .expect(401);
    });
  });

  describe("POST /auth/change-password", () => {
    const newPassword = "NewStrongPassword456!";

    it("should change password with valid current password", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          currentPassword: testUserPassword,
          newPassword: newPassword,
        })
        .expect(200);

      expect(response.body.message).toContain("Password changed successfully");

      // Verify new password works for login
      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({
          email: testUserEmail,
          password: newPassword,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty("token");

      // Update our reference to the current password
      testUserPassword = newPassword;
    });

    it("should reject password change with incorrect current password", async () => {
      await request(app.getHttpServer())
        .post("/auth/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          currentPassword: "WrongCurrentPassword123!",
          newPassword: "AnotherNewPassword789!",
        })
        .expect(400);
    });

    it("should reject password change with weak new password", async () => {
      await request(app.getHttpServer())
        .post("/auth/change-password")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          currentPassword: testUserPassword,
          newPassword: "weak",
        })
        .expect(400);
    });
  });

  describe("POST /auth/logout", () => {
    it("should successfully log out a user", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/logout")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.message).toContain("logged out");

      // Verify token is now invalid (depends on implementation)
      // Some systems invalidate tokens on logout, others rely on client-side clearing
    });
  });
});
