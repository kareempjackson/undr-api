import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../../app.module";
import { getRepositoryToken } from "@nestjs/typeorm";
import { User } from "../../entities/user.entity";
import { Wallet } from "../../entities/wallet.entity";
import { Withdrawal } from "../../entities/withdrawal.entity";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { WithdrawalStatus } from "../../entities/common.enums";

describe("Withdrawals API (e2e)", () => {
  let app: INestApplication;
  let userRepository;
  let walletRepository;
  let withdrawalRepository;
  let mockUser;
  let mockWallet;
  let jwtToken;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    userRepository = moduleFixture.get(getRepositoryToken(User));
    walletRepository = moduleFixture.get(getRepositoryToken(Wallet));
    withdrawalRepository = moduleFixture.get(getRepositoryToken(Withdrawal));

    // Create test user and wallet
    mockUser = await userRepository.save({
      email: "test-withdrawals@example.com",
      password: "hashed-password",
      displayName: "Test User",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockWallet = await walletRepository.save({
      userId: mockUser.id,
      balance: 1000, // $1000 initial balance
      currency: "USD",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Generate a mock JWT token for the test user
    jwtToken = "test-jwt-token";
  });

  afterAll(async () => {
    // Clean up test data
    await withdrawalRepository.delete({ userId: mockUser.id });
    await walletRepository.delete({ id: mockWallet.id });
    await userRepository.delete({ id: mockUser.id });
    await app.close();
  });

  it("GET /withdrawals - should return user withdrawals", async () => {
    // Create some test withdrawals
    const withdrawals = await withdrawalRepository.save([
      {
        userId: mockUser.id,
        amount: 100,
        method: "WALLET",
        status: WithdrawalStatus.COMPLETED,
        payoutDetails: { methodType: "bank", accountNumber: "1234567890" },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: mockUser.id,
        amount: 50,
        method: "WALLET",
        status: WithdrawalStatus.PENDING,
        payoutDetails: { methodType: "bank", accountNumber: "0987654321" },
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Make request to get withdrawals
    const response = await request(app.getHttpServer())
      .get("/withdrawals")
      .set("Authorization", `Bearer ${jwtToken}`)
      .expect(200);

    // Check response
    expect(response.body).toHaveLength(2);
    expect(response.body[0].amount).toBe(100);
    expect(response.body[1].amount).toBe(50);

    // Clean up
    await withdrawalRepository.delete(withdrawals.map((w) => w.id));
  });

  it("POST /withdrawals - should create a withdrawal and update balance", async () => {
    // Initial balance
    const initialBalance = mockWallet.balance;

    // Create withdrawal request
    const withdrawalData = {
      amount: 200,
      destination: JSON.stringify({
        method: "bank",
        accountNumber: "1234567890",
        currency: "USD",
      }),
    };

    // Make request to create withdrawal
    const response = await request(app.getHttpServer())
      .post("/withdrawals")
      .set("Authorization", `Bearer ${jwtToken}`)
      .send(withdrawalData)
      .expect(201);

    // Check response
    expect(response.body).toBeDefined();
    expect(response.body.amount).toBe(200);
    expect(response.body.status).toBe(WithdrawalStatus.PENDING);

    // Check wallet balance was updated
    const updatedWallet = await walletRepository.findOne({
      where: { id: mockWallet.id },
    });

    expect(Number(updatedWallet.balance)).toBe(Number(initialBalance) - 200);

    // Clean up
    await withdrawalRepository.delete(response.body.id);

    // Reset wallet balance
    mockWallet.balance = initialBalance;
    await walletRepository.save(mockWallet);
  });

  it("POST /withdrawals - should return 400 if insufficient balance", async () => {
    // Try to withdraw more than available balance
    const withdrawalData = {
      amount: 2000, // More than the 1000 balance
      destination: JSON.stringify({
        method: "bank",
        accountNumber: "1234567890",
        currency: "USD",
      }),
    };

    // Make request to create withdrawal
    const response = await request(app.getHttpServer())
      .post("/withdrawals")
      .set("Authorization", `Bearer ${jwtToken}`)
      .send(withdrawalData)
      .expect(400);

    // Check error message
    expect(response.body.message).toBe("Insufficient wallet balance");

    // Check wallet balance remains unchanged
    const updatedWallet = await walletRepository.findOne({
      where: { id: mockWallet.id },
    });

    expect(Number(updatedWallet.balance)).toBe(1000);
  });

  it("POST /withdrawals - should return 400 for invalid destination format", async () => {
    // Invalid destination format
    const withdrawalData = {
      amount: 100,
      destination: "invalid-json",
    };

    // Make request to create withdrawal
    await request(app.getHttpServer())
      .post("/withdrawals")
      .set("Authorization", `Bearer ${jwtToken}`)
      .send(withdrawalData)
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toBe("Invalid destination format");
      });
  });

  it("POST /withdrawals - should return 400 for missing destination info", async () => {
    // Missing account number
    const withdrawalData = {
      amount: 100,
      destination: JSON.stringify({
        method: "bank",
        // accountNumber is missing
      }),
    };

    // Make request to create withdrawal
    await request(app.getHttpServer())
      .post("/withdrawals")
      .set("Authorization", `Bearer ${jwtToken}`)
      .send(withdrawalData)
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toBe(
          "Missing required destination information"
        );
      });
  });
});
