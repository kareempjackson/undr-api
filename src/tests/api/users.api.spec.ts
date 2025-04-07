import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../app.module";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User, UserRole, UserStatus } from "../../entities/user.entity";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

describe("Users API (e2e)", () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let jwtService: JwtService;

  // Test user variables
  let adminUser: User;
  let adminToken: string;
  let regularUser: User;
  let regularUserToken: string;
  let creatorUser: User;
  let creatorUserToken: string;
  let testUsers: User[] = [];

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

    // Create admin user for testing
    adminUser = await userRepository.save(
      userRepository.create({
        email: `admin-${Date.now()}@example.com`,
        password: await bcrypt.hash("StrongAdminPass123!", 10),
        name: "Admin User",
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      })
    );
    testUsers.push(adminUser);
    adminToken = jwtService.sign({
      sub: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });

    // Create regular user
    regularUser = await userRepository.save(
      userRepository.create({
        email: `fan-${Date.now()}@example.com`,
        password: await bcrypt.hash("StrongUserPass123!", 10),
        name: "Regular User",
        role: UserRole.FAN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      })
    );
    testUsers.push(regularUser);
    regularUserToken = jwtService.sign({
      sub: regularUser.id,
      email: regularUser.email,
      role: regularUser.role,
    });

    // Create creator user
    creatorUser = await userRepository.save(
      userRepository.create({
        email: `creator-${Date.now()}@example.com`,
        password: await bcrypt.hash("StrongCreatorPass123!", 10),
        name: "Creator User",
        role: UserRole.CREATOR,
        status: UserStatus.ACTIVE,
        emailVerified: true,
        bio: "Professional content creator",
      })
    );
    testUsers.push(creatorUser);
    creatorUserToken = jwtService.sign({
      sub: creatorUser.id,
      email: creatorUser.email,
      role: creatorUser.role,
    });
  });

  afterAll(async () => {
    // Clean up test users
    for (const user of testUsers) {
      await userRepository.delete(user.id);
    }
    await app.close();
  });

  describe("GET /users/:id", () => {
    it("should get user profile by ID", async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${regularUser.id}`)
        .set("Authorization", `Bearer ${regularUserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", regularUser.id);
      expect(response.body).toHaveProperty("name", regularUser.name);
      expect(response.body).toHaveProperty("role", regularUser.role);

      // Sensitive fields should be excluded
      expect(response.body).not.toHaveProperty("password");
    });

    it("should return creator profile with details", async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/${creatorUser.id}`)
        .set("Authorization", `Bearer ${regularUserToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", creatorUser.id);
      expect(response.body).toHaveProperty("name", creatorUser.name);
      expect(response.body).toHaveProperty("role", UserRole.CREATOR);
      expect(response.body).toHaveProperty(
        "bio",
        "Professional content creator"
      );
    });

    it("should return 404 for non-existent user", async () => {
      await request(app.getHttpServer())
        .get("/users/non-existent-id")
        .set("Authorization", `Bearer ${regularUserToken}`)
        .expect(404);
    });

    it("should require authentication", async () => {
      await request(app.getHttpServer())
        .get(`/users/${regularUser.id}`)
        .expect(401);
    });
  });

  describe("GET /users", () => {
    it("should return a list of users for admin", async () => {
      const response = await request(app.getHttpServer())
        .get("/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("users");
      expect(Array.isArray(response.body.users)).toBeTruthy();
      expect(response.body.users.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty("pagination");
    });

    it("should respect pagination parameters", async () => {
      const response = await request(app.getHttpServer())
        .get("/users?page=1&limit=2")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.users.length).toBeLessThanOrEqual(2);
      expect(response.body.pagination).toHaveProperty("page", 1);
      expect(response.body.pagination).toHaveProperty("limit", 2);
    });

    it("should deny access to non-admin users", async () => {
      await request(app.getHttpServer())
        .get("/users")
        .set("Authorization", `Bearer ${regularUserToken}`)
        .expect(403);
    });
  });

  describe("PATCH /users/:id", () => {
    it("should allow users to update their own profile", async () => {
      const updatedName = "Updated User Name";
      const updatedBio = "This is an updated bio";

      const response = await request(app.getHttpServer())
        .patch(`/users/${regularUser.id}`)
        .set("Authorization", `Bearer ${regularUserToken}`)
        .send({
          name: updatedName,
          bio: updatedBio,
        })
        .expect(200);

      expect(response.body).toHaveProperty("name", updatedName);
      expect(response.body).toHaveProperty("bio", updatedBio);

      // Verify in database
      const updatedUser = await userRepository.findOne({
        where: { id: regularUser.id },
      });
      expect(updatedUser.name).toBe(updatedName);
      expect(updatedUser.bio).toBe(updatedBio);
    });

    it("should prevent users from updating other users' profiles", async () => {
      await request(app.getHttpServer())
        .patch(`/users/${creatorUser.id}`)
        .set("Authorization", `Bearer ${regularUserToken}`)
        .send({
          name: "Unauthorized Update",
        })
        .expect(403);
    });

    it("should allow admin to update any user profile", async () => {
      const updatedName = "Admin Updated Name";

      const response = await request(app.getHttpServer())
        .patch(`/users/${regularUser.id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: updatedName,
        })
        .expect(200);

      expect(response.body).toHaveProperty("name", updatedName);

      // Update our reference
      regularUser.name = updatedName;
    });

    it("should prevent updating sensitive fields directly", async () => {
      await request(app.getHttpServer())
        .patch(`/users/${regularUser.id}`)
        .set("Authorization", `Bearer ${regularUserToken}`)
        .send({
          role: UserRole.ADMIN,
          status: UserStatus.SUSPENDED,
        })
        .expect(400);

      // Verify that role didn't change
      const unchangedUser = await userRepository.findOne({
        where: { id: regularUser.id },
      });
      expect(unchangedUser.role).toBe(UserRole.FAN);
    });
  });

  describe("GET /users/search", () => {
    it("should search for users by name", async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/search?query=${encodeURIComponent(creatorUser.name)}`)
        .set("Authorization", `Bearer ${regularUserToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(
        response.body.some((user) => user.id === creatorUser.id)
      ).toBeTruthy();
    });

    it("should filter search by role", async () => {
      const response = await request(app.getHttpServer())
        .get(`/users/search?query=User&role=${UserRole.CREATOR}`)
        .set("Authorization", `Bearer ${regularUserToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();

      // Should include creator but not regular users
      const hasCreator = response.body.some(
        (user) => user.role === UserRole.CREATOR
      );
      const hasFan = response.body.some((user) => user.role === UserRole.FAN);

      expect(hasCreator).toBeTruthy();
      expect(hasFan).toBeFalsy();
    });

    it("should return empty array for no matches", async () => {
      const response = await request(app.getHttpServer())
        .get("/users/search?query=NonExistentUserXYZ")
        .set("Authorization", `Bearer ${regularUserToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBe(0);
    });

    it("should require authentication", async () => {
      await request(app.getHttpServer())
        .get("/users/search?query=User")
        .expect(401);
    });
  });

  describe("PATCH /users/:id/status (Admin only)", () => {
    it("should allow admin to update user status", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${regularUser.id}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: UserStatus.SUSPENDED,
        })
        .expect(200);

      expect(response.body).toHaveProperty("status", UserStatus.SUSPENDED);

      // Verify in database
      const updatedUser = await userRepository.findOne({
        where: { id: regularUser.id },
      });
      expect(updatedUser.status).toBe(UserStatus.SUSPENDED);
    });

    it("should deny status update to non-admin users", async () => {
      await request(app.getHttpServer())
        .patch(`/users/${creatorUser.id}/status`)
        .set("Authorization", `Bearer ${regularUserToken}`)
        .send({
          status: UserStatus.SUSPENDED,
        })
        .expect(403);
    });
  });

  describe("PATCH /users/:id/role (Admin only)", () => {
    it("should allow admin to update user role", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${regularUser.id}/role`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          role: UserRole.CREATOR,
        })
        .expect(200);

      expect(response.body).toHaveProperty("role", UserRole.CREATOR);

      // Verify in database
      const updatedUser = await userRepository.findOne({
        where: { id: regularUser.id },
      });
      expect(updatedUser.role).toBe(UserRole.CREATOR);

      // Update our reference
      regularUser.role = UserRole.CREATOR;
    });

    it("should deny role update to non-admin users", async () => {
      await request(app.getHttpServer())
        .patch(`/users/${creatorUser.id}/role`)
        .set("Authorization", `Bearer ${regularUserToken}`)
        .send({
          role: UserRole.ADMIN,
        })
        .expect(403);
    });
  });

  describe("POST /users/:id/avatar", () => {
    it("should allow users to upload an avatar", async () => {
      // Create a small test image buffer
      const testImageBuffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64"
      );

      const response = await request(app.getHttpServer())
        .post(`/users/${regularUser.id}/avatar`)
        .set("Authorization", `Bearer ${regularUserToken}`)
        .attach("avatar", testImageBuffer, "test-avatar.png")
        .expect(200);

      expect(response.body).toHaveProperty("profileImage");
      expect(response.body.profileImage).toContain("avatar");

      // Note: Full validation would require checking if file was actually uploaded
    });

    it("should prevent users from uploading avatars for others", async () => {
      const testImageBuffer = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
        "base64"
      );

      await request(app.getHttpServer())
        .post(`/users/${creatorUser.id}/avatar`)
        .set("Authorization", `Bearer ${regularUserToken}`)
        .attach("avatar", testImageBuffer, "test-avatar.png")
        .expect(403);
    });
  });
});
