import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { TypeOrmModule } from "@nestjs/typeorm";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Connection, createConnection, getConnection } from "typeorm";
import { DisputeModule } from "./dispute.module";
import { AuthModule } from "../auth/auth.module";
import { SecurityModule } from "../security/security.module";
import { User } from "../../entities/user.entity";
import { Wallet } from "../../entities/wallet.entity";
import { Escrow, EscrowStatus } from "../../entities/escrow.entity";
import { EscrowMilestone } from "../../entities/escrow.entity";
import {
  Dispute,
  DisputeStatus,
  DisputeResolution,
} from "../../entities/dispute.entity";
import {
  DisputeEvidence,
  EvidenceType,
} from "../../entities/dispute-evidence.entity";
import { DisputeMessage } from "../../entities/dispute-message.entity";
import { v4 as uuidv4 } from "uuid";

describe("Dispute System (e2e)", () => {
  let app: INestApplication;
  let connection: Connection;
  let buyerToken: string;
  let sellerToken: string;
  let escrowId: string;
  let disputeId: string;

  // Test user data
  const buyerEmail = `buyer-${uuidv4()}@example.com`;
  const sellerEmail = `seller-${uuidv4()}@example.com`;
  const password = "Test12345!";
  let buyerId: string;
  let sellerId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ".env.test",
        }),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            type: "postgres",
            host: configService.get("DB_HOST", "localhost"),
            port: +configService.get("DB_PORT", 5432),
            username: configService.get("DB_USERNAME", "postgres"),
            password: configService.get("DB_PASSWORD", "postgres"),
            database: configService.get("DB_DATABASE", "ghostpay_test"),
            entities: [__dirname + "/../../entities/*.entity{.ts,.js}"],
            synchronize: true, // For testing only
            logging: false,
          }),
          inject: [ConfigService],
        }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get("JWT_SECRET", "testsecret"),
            signOptions: {
              expiresIn: configService.get("JWT_EXPIRATION", "1d"),
            },
          }),
          inject: [ConfigService],
        }),
        PassportModule,
        AuthModule,
        SecurityModule,
        DisputeModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get connection for direct database operations
    try {
      connection = getConnection();
    } catch (error) {
      // If connection doesn't exist, create one
      connection = await createConnection({
        type: "postgres",
        host: process.env.DB_HOST || "localhost",
        port: +process.env.DB_PORT || 5432,
        username: process.env.DB_USERNAME || "postgres",
        password: process.env.DB_PASSWORD || "postgres",
        database: process.env.DB_DATABASE || "ghostpay_test",
        entities: [__dirname + "/../../entities/*.entity{.ts,.js}"],
        synchronize: true,
      });
    }

    // Setup: Create test users, wallets, and escrow
    await setupTestUsers();
    await createTestEscrow();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();

    await app.close();
    try {
      await connection.close();
    } catch (error) {
      console.error("Error closing connection:", error);
    }
  });

  const setupTestUsers = async () => {
    // Register and authenticate buyer
    await request(app.getHttpServer()).post("/auth/register").send({
      email: buyerEmail,
      password,
      name: "Test Buyer",
    });

    const buyerLoginResp = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: buyerEmail,
        password,
      });

    buyerToken = buyerLoginResp.body.access_token;
    buyerId = buyerLoginResp.body.user.id;

    // Create a wallet for buyer
    await request(app.getHttpServer())
      .post("/wallets")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({
        name: "Buyer Wallet",
        initialBalance: 1000, // For testing
      });

    // Register and authenticate seller
    await request(app.getHttpServer()).post("/auth/register").send({
      email: sellerEmail,
      password,
      name: "Test Seller",
    });

    const sellerLoginResp = await request(app.getHttpServer())
      .post("/auth/login")
      .send({
        email: sellerEmail,
        password,
      });

    sellerToken = sellerLoginResp.body.access_token;
    sellerId = sellerLoginResp.body.user.id;

    // Create a wallet for seller
    await request(app.getHttpServer())
      .post("/wallets")
      .set("Authorization", `Bearer ${sellerToken}`)
      .send({
        name: "Seller Wallet",
        initialBalance: 0, // Initially empty
      });
  };

  const createTestEscrow = async () => {
    // Buyer creates an escrow
    const escrowResponse = await request(app.getHttpServer())
      .post("/security/escrows")
      .set("Authorization", `Bearer ${buyerToken}`)
      .send({
        title: "Test Product Purchase",
        description: "Test escrow for dispute testing",
        sellerId: sellerId,
        totalAmount: 100,
        milestones: [
          {
            title: "Product Delivery",
            description: "Delivery of test product",
            amount: 100,
          },
        ],
      });

    escrowId = escrowResponse.body.id;

    // Fund the escrow
    await request(app.getHttpServer())
      .post(`/security/escrows/${escrowId}/fund`)
      .set("Authorization", `Bearer ${buyerToken}`)
      .send();
  };

  const cleanupTestData = async () => {
    // Clean up any created disputes, evidence, and messages
    if (disputeId) {
      await connection.query(
        `DELETE FROM dispute_messages WHERE "disputeId" = $1`,
        [disputeId]
      );
      await connection.query(
        `DELETE FROM dispute_evidence WHERE "disputeId" = $1`,
        [disputeId]
      );
      await connection.query(`DELETE FROM disputes WHERE id = $1`, [disputeId]);
    }

    // Clean up escrow and milestones
    if (escrowId) {
      await connection.query(
        `DELETE FROM escrow_milestones WHERE "escrowId" = $1`,
        [escrowId]
      );
      await connection.query(`DELETE FROM escrows WHERE id = $1`, [escrowId]);
    }

    // Clean up wallets and users
    if (buyerId) {
      await connection.query(`DELETE FROM wallets WHERE "userId" = $1`, [
        buyerId,
      ]);
      await connection.query(`DELETE FROM users WHERE id = $1`, [buyerId]);
    }

    if (sellerId) {
      await connection.query(`DELETE FROM wallets WHERE "userId" = $1`, [
        sellerId,
      ]);
      await connection.query(`DELETE FROM users WHERE id = $1`, [sellerId]);
    }
  };

  describe("Dispute Flow", () => {
    it("should create a dispute for an escrow", async () => {
      const response = await request(app.getHttpServer())
        .post("/security/disputes")
        .set("Authorization", `Bearer ${buyerToken}`)
        .send({
          escrowId: escrowId,
          reason: "Product not as described",
          details: {
            description:
              "The product received does not match the original description",
          },
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.escrowId).toBe(escrowId);
      expect(response.body.reason).toBe("Product not as described");
      expect(response.body.status).toBe(DisputeStatus.EVIDENCE_SUBMISSION);

      disputeId = response.body.id;

      // Verify escrow status was updated
      const escrowResponse = await request(app.getHttpServer())
        .get(`/security/escrows/${escrowId}`)
        .set("Authorization", `Bearer ${buyerToken}`)
        .expect(200);

      expect(escrowResponse.body.status).toBe(EscrowStatus.DISPUTED);
    });

    it("should allow buyer to submit evidence", async () => {
      const response = await request(app.getHttpServer())
        .post(`/security/disputes/${disputeId}/evidence`)
        .set("Authorization", `Bearer ${buyerToken}`)
        .send({
          type: EvidenceType.TEXT,
          description:
            "Product differs from the listing in several key aspects",
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.disputeId).toBe(disputeId);
      expect(response.body.type).toBe(EvidenceType.TEXT);
    });

    it("should allow seller to submit evidence", async () => {
      const response = await request(app.getHttpServer())
        .post(`/security/disputes/${disputeId}/evidence`)
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          type: EvidenceType.TEXT,
          description: "Product matches the description exactly as listed",
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.disputeId).toBe(disputeId);
      expect(response.body.type).toBe(EvidenceType.TEXT);
    });

    it("should allow seller to propose a resolution", async () => {
      const response = await request(app.getHttpServer())
        .post(`/security/disputes/${disputeId}/propose-resolution`)
        .set("Authorization", `Bearer ${sellerToken}`)
        .send({
          resolution: DisputeResolution.SPLIT,
          buyerAmount: 50,
          sellerAmount: 50,
          details: {
            reason: "Offering partial refund as a compromise",
          },
        })
        .expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body.id).toBe(disputeId);
    });

    it("should allow buyer to accept the resolution", async () => {
      const response = await request(app.getHttpServer())
        .post(`/security/disputes/${disputeId}/accept-resolution`)
        .set("Authorization", `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body.id).toBe(disputeId);
      expect(response.body.status).toBe(DisputeStatus.MUTUALLY_RESOLVED);
      expect(response.body.resolvedAt).toBeDefined();
    });

    it("should return dispute details", async () => {
      const response = await request(app.getHttpServer())
        .get(`/security/disputes/${disputeId}`)
        .set("Authorization", `Bearer ${buyerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("dispute");
      expect(response.body).toHaveProperty("evidence");
      expect(response.body).toHaveProperty("messages");
      expect(response.body).toHaveProperty("escrow");

      expect(response.body.dispute.id).toBe(disputeId);
      expect(response.body.dispute.status).toBe(
        DisputeStatus.MUTUALLY_RESOLVED
      );

      // Evidence should include both submissions
      expect(response.body.evidence.length).toBe(2);

      // Messages should include system messages and potentially regular messages
      expect(response.body.messages.length).toBeGreaterThanOrEqual(3); // At least creation + 2 evidence submissions
    });

    it("should list all disputes for a user", async () => {
      const response = await request(app.getHttpServer())
        .get("/security/disputes")
        .set("Authorization", `Bearer ${buyerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBeTruthy();
      expect(response.body.length).toBeGreaterThanOrEqual(1);
      expect(response.body[0].id).toBe(disputeId);
    });
  });
});
