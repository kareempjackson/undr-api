import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { Repository, DataSource } from "typeorm";
import { EscrowService } from "./escrow.service";
import {
  Escrow,
  EscrowStatus,
  EscrowMilestone,
  MilestoneStatus,
} from "../../entities/escrow.entity";
import { Payment } from "../../entities/payment.entity";
import { PaymentStatus } from "../../entities/common.enums";
import { User } from "../../entities/user.entity";
import { Wallet } from "../../entities/wallet.entity";
import {
  DeliveryProof,
  ProofStatus,
  ProofType,
} from "../../entities/delivery-proof.entity";
import {
  TransactionLog,
  TransactionType,
} from "../../entities/transaction-log.entity";
import { DeliveryProofSubmitDTO } from "../../dtos/escrow.dto";

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;
const createMockRepository = <T = any>(): MockRepository<T> => ({
  findOne: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getMany: jest.fn(),
    getManyAndCount: jest.fn(),
    execute: jest.fn(),
  })),
});

describe("EscrowService", () => {
  let service: EscrowService;
  let escrowRepository: MockRepository<Escrow>;
  let milestoneRepository: MockRepository<EscrowMilestone>;
  let paymentRepository: MockRepository<Payment>;
  let userRepository: MockRepository<User>;
  let walletRepository: MockRepository<Wallet>;
  let deliveryProofRepository: MockRepository<DeliveryProof>;
  let transactionLogRepository: MockRepository<TransactionLog>;
  let dataSource: Partial<DataSource>;

  beforeEach(async () => {
    const mockDataSource = {
      createQueryRunner: jest.fn(() => ({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        manager: {
          save: jest.fn(),
          findOne: jest.fn(),
          update: jest.fn(),
        },
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      })),
      transaction: jest.fn((fn) =>
        fn({
          save: jest.fn(),
          findOne: jest.fn(),
          update: jest.fn(),
        })
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EscrowService,
        {
          provide: getRepositoryToken(Escrow),
          useFactory: createMockRepository,
        },
        {
          provide: getRepositoryToken(EscrowMilestone),
          useFactory: createMockRepository,
        },
        {
          provide: getRepositoryToken(Payment),
          useFactory: createMockRepository,
        },
        { provide: getRepositoryToken(User), useFactory: createMockRepository },
        {
          provide: getRepositoryToken(Wallet),
          useFactory: createMockRepository,
        },
        {
          provide: getRepositoryToken(DeliveryProof),
          useFactory: createMockRepository,
        },
        {
          provide: getRepositoryToken(TransactionLog),
          useFactory: createMockRepository,
        },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = module.get<EscrowService>(EscrowService);
    escrowRepository = module.get(getRepositoryToken(Escrow));
    milestoneRepository = module.get(getRepositoryToken(EscrowMilestone));
    paymentRepository = module.get(getRepositoryToken(Payment));
    userRepository = module.get(getRepositoryToken(User));
    walletRepository = module.get(getRepositoryToken(Wallet));
    deliveryProofRepository = module.get(getRepositoryToken(DeliveryProof));
    transactionLogRepository = module.get(getRepositoryToken(TransactionLog));
    dataSource = module.get<DataSource>(DataSource);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  // Test for createEscrow method
  describe("createEscrow", () => {
    it("should throw BadRequestException if buyer is not found", async () => {
      // Arrange
      userRepository.findOne.mockResolvedValueOnce(null); // Buyer not found

      // Act & Assert
      await expect(
        service.createEscrow({
          title: "Test Escrow",
          totalAmount: 1000,
          buyerId: "non-existent-id",
          sellerId: "seller-id",
          expirationDays: 30,
          milestones: [
            { amount: 1000, description: "Test milestone", sequence: 1 },
          ],
        })
      ).rejects.toThrow(BadRequestException);

      expect(userRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "non-existent-id" },
          relations: ["wallet"],
        })
      );
    });

    it("should throw BadRequestException if seller is not found", async () => {
      // Arrange
      const mockBuyer = { id: "buyer-id", wallet: { balance: 2000 } };
      userRepository.findOne.mockResolvedValueOnce(mockBuyer); // Buyer found
      userRepository.findOne.mockResolvedValueOnce(null); // Seller not found

      // Act & Assert
      await expect(
        service.createEscrow({
          title: "Test Escrow",
          totalAmount: 1000,
          buyerId: "buyer-id",
          sellerId: "non-existent-id",
          expirationDays: 30,
          milestones: [
            { amount: 1000, description: "Test milestone", sequence: 1 },
          ],
        })
      ).rejects.toThrow(BadRequestException);

      expect(userRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "non-existent-id" },
        })
      );
    });

    it("should throw BadRequestException if buyer has insufficient funds", async () => {
      // Arrange
      const mockBuyer = { id: "buyer-id", wallet: { balance: 500 } };
      const mockSeller = { id: "seller-id" };
      userRepository.findOne.mockResolvedValueOnce(mockBuyer); // Buyer found with insufficient balance
      userRepository.findOne.mockResolvedValueOnce(mockSeller); // Seller found

      // Act & Assert
      await expect(
        service.createEscrow({
          title: "Test Escrow",
          totalAmount: 1000,
          buyerId: "buyer-id",
          sellerId: "seller-id",
          expirationDays: 30,
          milestones: [
            { amount: 1000, description: "Test milestone", sequence: 1 },
          ],
        })
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if milestone totals do not match escrow amount", async () => {
      // Arrange
      const mockBuyer = { id: "buyer-id", wallet: { balance: 2000 } };
      const mockSeller = { id: "seller-id" };
      userRepository.findOne.mockResolvedValueOnce(mockBuyer); // Buyer found with sufficient balance
      userRepository.findOne.mockResolvedValueOnce(mockSeller); // Seller found

      // Act & Assert
      await expect(
        service.createEscrow({
          title: "Test Escrow",
          totalAmount: 1000,
          buyerId: "buyer-id",
          sellerId: "seller-id",
          expirationDays: 30,
          milestones: [
            { amount: 500, description: "Test milestone 1", sequence: 1 },
          ], // Only 500 of 1000 is specified
        })
      ).rejects.toThrow(BadRequestException);
    });

    it("should successfully create an escrow when all inputs are valid", async () => {
      // Arrange
      const mockBuyer = { id: "buyer-id", wallet: { balance: 2000 } };
      const mockSeller = { id: "seller-id" };
      const mockEscrow = {
        id: "escrow-id",
        title: "Test Escrow",
        totalAmount: 1000,
        buyerId: "buyer-id",
        sellerId: "seller-id",
        status: EscrowStatus.PENDING,
        expiresAt: expect.any(Date),
        milestones: [
          {
            id: "milestone-id",
            amount: 1000,
            description: "Test milestone",
            sequence: 1,
            status: MilestoneStatus.PENDING,
          },
        ],
      };

      userRepository.findOne.mockResolvedValueOnce(mockBuyer); // Buyer found with sufficient balance
      userRepository.findOne.mockResolvedValueOnce(mockSeller); // Seller found
      escrowRepository.save.mockResolvedValueOnce(mockEscrow);
      milestoneRepository.save.mockResolvedValueOnce(mockEscrow.milestones[0]);
      transactionLogRepository.save.mockResolvedValueOnce({});

      // Mock the DataSource transaction behavior to return the mockEscrow
      jest
        .spyOn(dataSource, "transaction")
        .mockImplementation(async (callbackOrIsolationLevel, maybeCallback) => {
          // Handle both transaction method overloads
          const callback =
            typeof callbackOrIsolationLevel === "function"
              ? callbackOrIsolationLevel
              : maybeCallback;

          return mockEscrow; // Return the mockEscrow directly
        });

      // Act
      const result = await service.createEscrow({
        title: "Test Escrow",
        totalAmount: 1000,
        buyerId: "buyer-id",
        sellerId: "seller-id",
        expirationDays: 30,
        milestones: [
          { amount: 1000, description: "Test milestone", sequence: 1 },
        ],
      });

      // Assert
      expect(result).toEqual(mockEscrow);
      expect(dataSource.transaction).toHaveBeenCalled();
    });
  });

  // Test for fundEscrow method
  describe("fundEscrow", () => {
    it("should throw NotFoundException if escrow is not found", async () => {
      // Arrange
      jest
        .spyOn(dataSource, "transaction")
        .mockImplementation(async (callbackOrIsolationLevel, maybeCallback) => {
          // Handle both transaction method overloads
          const callback =
            typeof callbackOrIsolationLevel === "function"
              ? callbackOrIsolationLevel
              : maybeCallback;

          // Mock the transaction callback to simulate escrow not found
          return await callback({
            findOne: jest.fn().mockResolvedValueOnce(null), // Escrow not found
          } as any);
        });

      // Act & Assert
      await expect(
        service.fundEscrow("non-existent-id", "buyer-id")
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException if user is not the buyer", async () => {
      // Arrange
      const mockEscrow = {
        id: "escrow-id",
        buyerId: "buyer-id",
        status: EscrowStatus.PENDING,
      };

      jest
        .spyOn(dataSource, "transaction")
        .mockImplementation(async (callbackOrIsolationLevel, maybeCallback) => {
          // Handle both transaction method overloads
          const callback =
            typeof callbackOrIsolationLevel === "function"
              ? callbackOrIsolationLevel
              : maybeCallback;

          // Mock the transaction callback to simulate wrong buyer
          return await callback({
            findOne: jest.fn().mockResolvedValueOnce(mockEscrow), // Escrow found
          } as any);
        });

      // Act & Assert
      await expect(
        service.fundEscrow("escrow-id", "not-buyer-id")
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw BadRequestException if escrow is not in PENDING status", async () => {
      // Arrange
      const mockEscrow = {
        id: "escrow-id",
        buyerId: "buyer-id",
        status: EscrowStatus.FUNDED, // Already funded
      };

      jest
        .spyOn(dataSource, "transaction")
        .mockImplementation(async (callbackOrIsolationLevel, maybeCallback) => {
          // Handle both transaction method overloads
          const callback =
            typeof callbackOrIsolationLevel === "function"
              ? callbackOrIsolationLevel
              : maybeCallback;

          // Mock the transaction callback to simulate already funded
          return await callback({
            findOne: jest.fn().mockResolvedValueOnce(mockEscrow), // Escrow found in wrong status
          } as any);
        });

      // Act & Assert
      await expect(service.fundEscrow("escrow-id", "buyer-id")).rejects.toThrow(
        BadRequestException
      );
    });

    it("should successfully fund an escrow when inputs are valid", async () => {
      // Arrange
      const mockEscrow = {
        id: "escrow-id",
        buyerId: "buyer-id",
        sellerId: "seller-id",
        totalAmount: 1000,
        status: EscrowStatus.PENDING,
      };
      const mockBuyer = {
        id: "buyer-id",
        wallet: { id: "wallet-id", balance: 2000 },
      };
      const mockUpdatedEscrow = {
        ...mockEscrow,
        status: EscrowStatus.FUNDED,
        paymentId: "payment-id",
      };

      jest
        .spyOn(dataSource, "transaction")
        .mockImplementation(async (callbackOrIsolationLevel, maybeCallback) => {
          // Handle both transaction method overloads
          const callback =
            typeof callbackOrIsolationLevel === "function"
              ? callbackOrIsolationLevel
              : maybeCallback;

          // Mock the transaction callback for successful funding
          return await callback({
            findOne: jest
              .fn()
              .mockResolvedValueOnce(mockEscrow) // First findOne for escrow
              .mockResolvedValueOnce(mockBuyer), // Second findOne for buyer
            save: jest
              .fn()
              .mockResolvedValueOnce(mockBuyer.wallet) // Save wallet
              .mockResolvedValueOnce({ id: "payment-id" }) // Save payment
              .mockResolvedValueOnce(mockUpdatedEscrow), // Save escrow
          } as any);
        });

      // Act
      const result = await service.fundEscrow("escrow-id", "buyer-id");

      // Assert
      expect(result).toEqual(mockUpdatedEscrow);
      expect(dataSource.transaction).toHaveBeenCalled();
    });
  });

  // Tests for submitDeliveryProof
  describe("submitDeliveryProof", () => {
    it("should throw NotFoundException if escrow is not found", async () => {
      // Arrange
      jest
        .spyOn(dataSource, "transaction")
        .mockImplementation(async (callbackOrIsolationLevel, maybeCallback) => {
          // Handle both transaction method overloads
          const callback =
            typeof callbackOrIsolationLevel === "function"
              ? callbackOrIsolationLevel
              : maybeCallback;

          // Mock the transaction callback to simulate escrow not found
          return await callback({
            findOne: jest.fn().mockResolvedValueOnce(null), // Escrow not found
          } as any);
        });

      // Act & Assert
      await expect(
        service.submitDeliveryProof(
          "non-existent-id",
          {
            type: ProofType.IMAGE,
            description: "Test proof",
            files: ["file1"],
            metadata: {},
          },
          "seller-id"
        )
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException if user is not the seller", async () => {
      // Arrange
      const mockEscrow = {
        id: "escrow-id",
        sellerId: "seller-id",
        status: EscrowStatus.FUNDED,
      };

      jest
        .spyOn(dataSource, "transaction")
        .mockImplementation(async (callbackOrIsolationLevel, maybeCallback) => {
          // Handle both transaction method overloads
          const callback =
            typeof callbackOrIsolationLevel === "function"
              ? callbackOrIsolationLevel
              : maybeCallback;

          // Mock the transaction callback for wrong seller
          return await callback({
            findOne: jest.fn().mockResolvedValueOnce(mockEscrow), // Escrow found
          } as any);
        });

      // Act & Assert
      await expect(
        service.submitDeliveryProof(
          "escrow-id",
          {
            type: ProofType.IMAGE,
            description: "Test proof",
            files: ["file1"],
            metadata: {},
          },
          "not-seller-id"
        )
      ).rejects.toThrow(ForbiddenException);
    });

    it("should successfully create a delivery proof when inputs are valid", async () => {
      // Arrange
      const mockEscrow = {
        id: "escrow-id",
        sellerId: "seller-id",
        status: EscrowStatus.FUNDED,
      };
      const mockProof = {
        id: "proof-id",
        escrowId: "escrow-id",
        type: ProofType.IMAGE,
        description: "Test proof",
        files: ["file1"],
        status: ProofStatus.PENDING,
        metadata: {},
      };

      jest
        .spyOn(dataSource, "transaction")
        .mockImplementation(async (callbackOrIsolationLevel, maybeCallback) => {
          // Handle both transaction method overloads
          const callback =
            typeof callbackOrIsolationLevel === "function"
              ? callbackOrIsolationLevel
              : maybeCallback;

          // Mock the transaction callback for successful proof submission
          return await callback({
            findOne: jest.fn().mockResolvedValueOnce(mockEscrow), // Escrow found
            save: jest.fn().mockResolvedValueOnce(mockProof), // Proof saved
          } as any);
        });

      // Act
      const result = await service.submitDeliveryProof(
        "escrow-id",
        {
          type: ProofType.IMAGE,
          description: "Test proof",
          files: ["file1"],
          metadata: {},
        },
        "seller-id"
      );

      // Assert
      expect(result).toEqual(mockProof);
    });
  });

  // Additional test cases can be added for other methods
  // Tests for reviewDeliveryProof, completeEscrow, cancelEscrow, etc.
});
