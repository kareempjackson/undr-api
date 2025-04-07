import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../app.module";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User, UserRole, UserStatus } from "../../entities/user.entity";
import { Escrow, EscrowStatus } from "../../entities/escrow.entity";
import { Milestone, MilestoneStatus } from "../../entities/milestone.entity";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";

describe("Escrow API (e2e)", () => {
  let app: INestApplication;
  let userRepository: Repository<User>;
  let escrowRepository: Repository<Escrow>;
  let milestoneRepository: Repository<Milestone>;
  let jwtService: JwtService;

  // Test users
  let fanUser: User;
  let fanToken: string;
  let creatorUser: User;
  let creatorToken: string;
  let adminUser: User;
  let adminToken: string;

  // Test escrow
  let testEscrow: Escrow;
  let testEscrowId: string;

  // Test milestone
  let testMilestone: Milestone;
  let testMilestoneId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User)
    );
    escrowRepository = moduleFixture.get<Repository<Escrow>>(
      getRepositoryToken(Escrow)
    );
    milestoneRepository = moduleFixture.get<Repository<Milestone>>(
      getRepositoryToken(Milestone)
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

    // Create test escrow
    testEscrow = await escrowRepository.save({
      client: fanUser,
      provider: creatorUser,
      title: "Custom artwork project",
      description: "Creating a digital artwork for the client",
      totalAmount: 300,
      status: EscrowStatus.ACTIVE,
      createdAt: new Date(),
      terms: "Delivery within 2 weeks of approval",
    });
    testEscrowId = testEscrow.id;

    // Create test milestone
    testMilestone = await milestoneRepository.save({
      escrow: testEscrow,
      title: "Initial concept",
      description: "Provide initial concept sketches",
      amount: 100,
      status: MilestoneStatus.PENDING,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    });
    testMilestoneId = testMilestone.id;
  });

  afterAll(async () => {
    // Clean up test data
    await milestoneRepository.delete(testMilestoneId);
    await escrowRepository.delete(testEscrowId);
    await userRepository.delete([fanUser.id, creatorUser.id, adminUser.id]);
    await app.close();
  });

  describe("POST /escrow", () => {
    it("should create a new escrow agreement", async () => {
      const escrowData = {
        providerId: creatorUser.id,
        title: "New design project",
        description: "Logo design for my website",
        totalAmount: 200,
        terms: "Delivery in 3 iterations with feedback",
        milestones: [
          {
            title: "First concepts",
            description: "Initial design concepts",
            amount: 70,
            dueDate: new Date(
              Date.now() + 5 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            title: "Final delivery",
            description: "Complete design with source files",
            amount: 130,
            dueDate: new Date(
              Date.now() + 14 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        ],
      };

      const response = await request(app.getHttpServer())
        .post("/escrow")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(escrowData)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("title", "New design project");
      expect(response.body).toHaveProperty("totalAmount", 200);
      expect(response.body).toHaveProperty("status", EscrowStatus.PENDING);
      expect(response.body).toHaveProperty("client.id", fanUser.id);
      expect(response.body).toHaveProperty("provider.id", creatorUser.id);
      expect(response.body).toHaveProperty("milestones");
      expect(response.body.milestones.length).toBe(2);

      // Clean up this escrow and its milestones
      for (const milestone of response.body.milestones) {
        await milestoneRepository.delete(milestone.id);
      }
      await escrowRepository.delete(response.body.id);
    });

    it("should reject escrow with invalid provider ID", async () => {
      const invalidEscrowData = {
        providerId: "non-existent-id",
        title: "Invalid provider project",
        description: "This should fail",
        totalAmount: 100,
        terms: "Some terms",
        milestones: [],
      };

      await request(app.getHttpServer())
        .post("/escrow")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(invalidEscrowData)
        .expect(404);
    });

    it("should reject escrow with negative amount", async () => {
      const invalidEscrowData = {
        providerId: creatorUser.id,
        title: "Negative amount project",
        description: "This should fail",
        totalAmount: -100,
        terms: "Some terms",
        milestones: [],
      };

      await request(app.getHttpServer())
        .post("/escrow")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(invalidEscrowData)
        .expect(400);
    });
  });

  describe("GET /escrow/:id", () => {
    it("should retrieve escrow details for client", async () => {
      const response = await request(app.getHttpServer())
        .get(`/escrow/${testEscrowId}`)
        .set("Authorization", `Bearer ${fanToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", testEscrowId);
      expect(response.body).toHaveProperty("title", "Custom artwork project");
      expect(response.body).toHaveProperty("totalAmount", 300);
      expect(response.body).toHaveProperty("status", EscrowStatus.ACTIVE);
      expect(response.body).toHaveProperty("milestones");
      expect(Array.isArray(response.body.milestones)).toBeTruthy();
    });

    it("should retrieve escrow details for provider", async () => {
      const response = await request(app.getHttpServer())
        .get(`/escrow/${testEscrowId}`)
        .set("Authorization", `Bearer ${creatorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", testEscrowId);
    });

    it("should retrieve escrow details for admin", async () => {
      const response = await request(app.getHttpServer())
        .get(`/escrow/${testEscrowId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", testEscrowId);
    });

    it("should reject access by unrelated user", async () => {
      // Create another user not related to the escrow
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
        .get(`/escrow/${testEscrowId}`)
        .set("Authorization", `Bearer ${otherToken}`)
        .expect(403);

      // Clean up
      await userRepository.delete(otherUser.id);
    });

    it("should return 404 for non-existent escrow", async () => {
      await request(app.getHttpServer())
        .get("/escrow/non-existent-id")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe("GET /escrow", () => {
    it("should retrieve user escrow agreements", async () => {
      const response = await request(app.getHttpServer())
        .get("/escrow")
        .set("Authorization", `Bearer ${fanToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("escrows");
      expect(Array.isArray(response.body.escrows)).toBeTruthy();
      expect(
        response.body.escrows.some((escrow) => escrow.id === testEscrowId)
      ).toBeTruthy();
      expect(response.body).toHaveProperty("pagination");
    });

    it("should respect pagination parameters", async () => {
      const response = await request(app.getHttpServer())
        .get("/escrow?page=1&limit=5")
        .set("Authorization", `Bearer ${fanToken}`)
        .expect(200);

      expect(response.body.escrows.length).toBeLessThanOrEqual(5);
      expect(response.body.pagination).toHaveProperty("page", 1);
      expect(response.body.pagination).toHaveProperty("limit", 5);
    });

    it("should filter escrows by status", async () => {
      const response = await request(app.getHttpServer())
        .get(`/escrow?status=${EscrowStatus.ACTIVE}`)
        .set("Authorization", `Bearer ${fanToken}`)
        .expect(200);

      expect(
        response.body.escrows.every(
          (escrow) => escrow.status === EscrowStatus.ACTIVE
        )
      ).toBeTruthy();
    });
  });

  describe("GET /escrow/client", () => {
    it("should retrieve escrows where user is client", async () => {
      const response = await request(app.getHttpServer())
        .get("/escrow/client")
        .set("Authorization", `Bearer ${fanToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("escrows");
      expect(Array.isArray(response.body.escrows)).toBeTruthy();
      expect(
        response.body.escrows.some((escrow) => escrow.id === testEscrowId)
      ).toBeTruthy();
      expect(
        response.body.escrows.every((escrow) => escrow.client.id === fanUser.id)
      ).toBeTruthy();
    });
  });

  describe("GET /escrow/provider", () => {
    it("should retrieve escrows where user is provider", async () => {
      const response = await request(app.getHttpServer())
        .get("/escrow/provider")
        .set("Authorization", `Bearer ${creatorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("escrows");
      expect(Array.isArray(response.body.escrows)).toBeTruthy();
      expect(
        response.body.escrows.some((escrow) => escrow.id === testEscrowId)
      ).toBeTruthy();
      expect(
        response.body.escrows.every(
          (escrow) => escrow.provider.id === creatorUser.id
        )
      ).toBeTruthy();
    });
  });

  describe("PATCH /escrow/:id/status", () => {
    let statusTestEscrow: Escrow;

    beforeAll(async () => {
      // Create a pending escrow for status updates
      statusTestEscrow = await escrowRepository.save({
        client: fanUser,
        provider: creatorUser,
        title: "Status update test project",
        description: "Testing status updates",
        totalAmount: 150,
        status: EscrowStatus.PENDING,
        createdAt: new Date(),
        terms: "Terms for testing",
      });
    });

    afterAll(async () => {
      // Clean up
      await escrowRepository.delete(statusTestEscrow.id);
    });

    it("should allow provider to accept a pending escrow", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/escrow/${statusTestEscrow.id}/status`)
        .set("Authorization", `Bearer ${creatorToken}`)
        .send({
          status: EscrowStatus.ACTIVE,
        })
        .expect(200);

      expect(response.body).toHaveProperty("status", EscrowStatus.ACTIVE);

      // Verify in database
      const updatedEscrow = await escrowRepository.findOne({
        where: { id: statusTestEscrow.id },
      });
      expect(updatedEscrow.status).toBe(EscrowStatus.ACTIVE);
    });

    it("should allow client to mark escrow as completed", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/escrow/${statusTestEscrow.id}/status`)
        .set("Authorization", `Bearer ${fanToken}`)
        .send({
          status: EscrowStatus.COMPLETED,
        })
        .expect(200);

      expect(response.body).toHaveProperty("status", EscrowStatus.COMPLETED);

      // Verify in database
      const updatedEscrow = await escrowRepository.findOne({
        where: { id: statusTestEscrow.id },
      });
      expect(updatedEscrow.status).toBe(EscrowStatus.COMPLETED);
    });

    it("should reject invalid status transitions", async () => {
      // Create another escrow with CANCELED status
      const canceledEscrow = await escrowRepository.save({
        client: fanUser,
        provider: creatorUser,
        title: "Canceled project",
        description: "This project is canceled",
        totalAmount: 100,
        status: EscrowStatus.CANCELED,
        createdAt: new Date(),
        terms: "Terms for testing",
      });

      await request(app.getHttpServer())
        .patch(`/escrow/${canceledEscrow.id}/status`)
        .set("Authorization", `Bearer ${fanToken}`)
        .send({
          status: EscrowStatus.ACTIVE,
        })
        .expect(400);

      // Clean up
      await escrowRepository.delete(canceledEscrow.id);
    });
  });

  describe("POST /escrow/:id/cancel", () => {
    let cancelableEscrowId: string;

    beforeAll(async () => {
      // Create an active escrow that can be canceled
      const cancelableEscrow = await escrowRepository.save({
        client: fanUser,
        provider: creatorUser,
        title: "Cancelable project",
        description: "This project can be canceled",
        totalAmount: 200,
        status: EscrowStatus.ACTIVE,
        createdAt: new Date(),
        terms: "Terms for testing",
      });
      cancelableEscrowId = cancelableEscrow.id;
    });

    afterAll(async () => {
      // Clean up
      await escrowRepository.delete(cancelableEscrowId);
    });

    it("should allow client to cancel an active escrow", async () => {
      const response = await request(app.getHttpServer())
        .post(`/escrow/${cancelableEscrowId}/cancel`)
        .set("Authorization", `Bearer ${fanToken}`)
        .send({
          reason: "Project no longer needed",
        })
        .expect(200);

      expect(response.body).toHaveProperty("status", EscrowStatus.CANCELED);

      // Verify in database
      const updatedEscrow = await escrowRepository.findOne({
        where: { id: cancelableEscrowId },
      });
      expect(updatedEscrow.status).toBe(EscrowStatus.CANCELED);
    });
  });

  describe("PATCH /escrow/milestones/:id/status", () => {
    let statusMilestone: Milestone;

    beforeAll(async () => {
      // Create a milestone for status updates
      statusMilestone = await milestoneRepository.save({
        escrow: testEscrow,
        title: "Status test milestone",
        description: "Testing milestone status updates",
        amount: 50,
        status: MilestoneStatus.PENDING,
        dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      });
    });

    afterAll(async () => {
      // Clean up
      await milestoneRepository.delete(statusMilestone.id);
    });

    it("should allow provider to mark milestone as completed", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/escrow/milestones/${statusMilestone.id}/status`)
        .set("Authorization", `Bearer ${creatorToken}`)
        .send({
          status: MilestoneStatus.COMPLETED,
          comments: "Milestone work is finished",
        })
        .expect(200);

      expect(response.body).toHaveProperty("status", MilestoneStatus.COMPLETED);

      // Verify in database
      const updatedMilestone = await milestoneRepository.findOne({
        where: { id: statusMilestone.id },
      });
      expect(updatedMilestone.status).toBe(MilestoneStatus.COMPLETED);
    });

    it("should allow client to approve completed milestone", async () => {
      const response = await request(app.getHttpServer())
        .patch(`/escrow/milestones/${statusMilestone.id}/status`)
        .set("Authorization", `Bearer ${fanToken}`)
        .send({
          status: MilestoneStatus.APPROVED,
          comments: "Work approved, payment released",
        })
        .expect(200);

      expect(response.body).toHaveProperty("status", MilestoneStatus.APPROVED);

      // Verify in database
      const updatedMilestone = await milestoneRepository.findOne({
        where: { id: statusMilestone.id },
      });
      expect(updatedMilestone.status).toBe(MilestoneStatus.APPROVED);
    });

    it("should reject invalid milestone status transitions", async () => {
      // Create another milestone with REJECTED status
      const rejectedMilestone = await milestoneRepository.save({
        escrow: testEscrow,
        title: "Rejected milestone",
        description: "This milestone was rejected",
        amount: 25,
        status: MilestoneStatus.REJECTED,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      });

      await request(app.getHttpServer())
        .patch(`/escrow/milestones/${rejectedMilestone.id}/status`)
        .set("Authorization", `Bearer ${creatorToken}`)
        .send({
          status: MilestoneStatus.APPROVED,
          comments: "Trying invalid transition",
        })
        .expect(400);

      // Clean up
      await milestoneRepository.delete(rejectedMilestone.id);
    });
  });

  describe("POST /escrow/:id/documents", () => {
    it("should allow uploading documents to escrow", async () => {
      // Create a small test document buffer
      const testDocBuffer = Buffer.from(
        "This is a test document for an escrow agreement",
        "utf-8"
      );

      const response = await request(app.getHttpServer())
        .post(`/escrow/${testEscrowId}/documents`)
        .set("Authorization", `Bearer ${fanToken}`)
        .attach("document", testDocBuffer, "test-document.pdf")
        .field("title", "Test Document")
        .field("description", "A test document for the escrow")
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("title", "Test Document");
      expect(response.body).toHaveProperty(
        "description",
        "A test document for the escrow"
      );
      expect(response.body).toHaveProperty("fileUrl");

      // Note: Full validation would require checking if document was actually uploaded
      // Cleanup would require deleting the document
    });

    it("should reject document upload by unrelated user", async () => {
      // Create another user not related to the escrow
      const otherUser = await userRepository.save({
        email: `other-doc-${Date.now()}@example.com`,
        password: await bcrypt.hash("StrongPass123!", 10),
        name: "Other Doc User",
        role: UserRole.FAN,
        status: UserStatus.ACTIVE,
        emailVerified: true,
      });
      const otherToken = jwtService.sign({
        sub: otherUser.id,
        email: otherUser.email,
        role: otherUser.role,
      });

      const testDocBuffer = Buffer.from("This is a test document", "utf-8");

      await request(app.getHttpServer())
        .post(`/escrow/${testEscrowId}/documents`)
        .set("Authorization", `Bearer ${otherToken}`)
        .attach("document", testDocBuffer, "test-document.pdf")
        .field("title", "Unauthorized Document")
        .field("description", "This should fail")
        .expect(403);

      // Clean up
      await userRepository.delete(otherUser.id);
    });
  });

  describe("GET /admin/escrow (Admin only)", () => {
    it("should allow admin to view all escrows", async () => {
      const response = await request(app.getHttpServer())
        .get("/admin/escrow")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("escrows");
      expect(Array.isArray(response.body.escrows)).toBeTruthy();
      expect(response.body.escrows.length).toBeGreaterThan(0);
    });

    it("should deny access to non-admin users", async () => {
      await request(app.getHttpServer())
        .get("/admin/escrow")
        .set("Authorization", `Bearer ${fanToken}`)
        .expect(403);
    });
  });
});
