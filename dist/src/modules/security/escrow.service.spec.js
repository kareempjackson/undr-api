"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const typeorm_1 = require("@nestjs/typeorm");
const common_1 = require("@nestjs/common");
const typeorm_2 = require("typeorm");
const escrow_service_1 = require("./escrow.service");
const escrow_entity_1 = require("../../entities/escrow.entity");
const payment_entity_1 = require("../../entities/payment.entity");
const user_entity_1 = require("../../entities/user.entity");
const wallet_entity_1 = require("../../entities/wallet.entity");
const delivery_proof_entity_1 = require("../../entities/delivery-proof.entity");
const transaction_log_entity_1 = require("../../entities/transaction-log.entity");
const createMockRepository = () => ({
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
    let service;
    let escrowRepository;
    let milestoneRepository;
    let paymentRepository;
    let userRepository;
    let walletRepository;
    let deliveryProofRepository;
    let transactionLogRepository;
    let dataSource;
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
            transaction: jest.fn((fn) => fn({
                save: jest.fn(),
                findOne: jest.fn(),
                update: jest.fn(),
            })),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                escrow_service_1.EscrowService,
                {
                    provide: (0, typeorm_1.getRepositoryToken)(escrow_entity_1.Escrow),
                    useFactory: createMockRepository,
                },
                {
                    provide: (0, typeorm_1.getRepositoryToken)(escrow_entity_1.EscrowMilestone),
                    useFactory: createMockRepository,
                },
                {
                    provide: (0, typeorm_1.getRepositoryToken)(payment_entity_1.Payment),
                    useFactory: createMockRepository,
                },
                { provide: (0, typeorm_1.getRepositoryToken)(user_entity_1.User), useFactory: createMockRepository },
                {
                    provide: (0, typeorm_1.getRepositoryToken)(wallet_entity_1.Wallet),
                    useFactory: createMockRepository,
                },
                {
                    provide: (0, typeorm_1.getRepositoryToken)(delivery_proof_entity_1.DeliveryProof),
                    useFactory: createMockRepository,
                },
                {
                    provide: (0, typeorm_1.getRepositoryToken)(transaction_log_entity_1.TransactionLog),
                    useFactory: createMockRepository,
                },
                { provide: typeorm_2.DataSource, useValue: mockDataSource },
            ],
        }).compile();
        service = module.get(escrow_service_1.EscrowService);
        escrowRepository = module.get((0, typeorm_1.getRepositoryToken)(escrow_entity_1.Escrow));
        milestoneRepository = module.get((0, typeorm_1.getRepositoryToken)(escrow_entity_1.EscrowMilestone));
        paymentRepository = module.get((0, typeorm_1.getRepositoryToken)(payment_entity_1.Payment));
        userRepository = module.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
        walletRepository = module.get((0, typeorm_1.getRepositoryToken)(wallet_entity_1.Wallet));
        deliveryProofRepository = module.get((0, typeorm_1.getRepositoryToken)(delivery_proof_entity_1.DeliveryProof));
        transactionLogRepository = module.get((0, typeorm_1.getRepositoryToken)(transaction_log_entity_1.TransactionLog));
        dataSource = module.get(typeorm_2.DataSource);
    });
    it("should be defined", () => {
        expect(service).toBeDefined();
    });
    describe("createEscrow", () => {
        it("should throw BadRequestException if buyer is not found", async () => {
            userRepository.findOne.mockResolvedValueOnce(null);
            await expect(service.createEscrow({
                title: "Test Escrow",
                totalAmount: 1000,
                buyerId: "non-existent-id",
                sellerId: "seller-id",
                expirationDays: 30,
                milestones: [
                    { amount: 1000, description: "Test milestone", sequence: 1 },
                ],
            })).rejects.toThrow(common_1.BadRequestException);
            expect(userRepository.findOne).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: "non-existent-id" },
                relations: ["wallet"],
            }));
        });
        it("should throw BadRequestException if seller is not found", async () => {
            const mockBuyer = { id: "buyer-id", wallet: { balance: 2000 } };
            userRepository.findOne.mockResolvedValueOnce(mockBuyer);
            userRepository.findOne.mockResolvedValueOnce(null);
            await expect(service.createEscrow({
                title: "Test Escrow",
                totalAmount: 1000,
                buyerId: "buyer-id",
                sellerId: "non-existent-id",
                expirationDays: 30,
                milestones: [
                    { amount: 1000, description: "Test milestone", sequence: 1 },
                ],
            })).rejects.toThrow(common_1.BadRequestException);
            expect(userRepository.findOne).toHaveBeenCalledWith(expect.objectContaining({
                where: { id: "non-existent-id" },
            }));
        });
        it("should throw BadRequestException if buyer has insufficient funds", async () => {
            const mockBuyer = { id: "buyer-id", wallet: { balance: 500 } };
            const mockSeller = { id: "seller-id" };
            userRepository.findOne.mockResolvedValueOnce(mockBuyer);
            userRepository.findOne.mockResolvedValueOnce(mockSeller);
            await expect(service.createEscrow({
                title: "Test Escrow",
                totalAmount: 1000,
                buyerId: "buyer-id",
                sellerId: "seller-id",
                expirationDays: 30,
                milestones: [
                    { amount: 1000, description: "Test milestone", sequence: 1 },
                ],
            })).rejects.toThrow(common_1.BadRequestException);
        });
        it("should throw BadRequestException if milestone totals do not match escrow amount", async () => {
            const mockBuyer = { id: "buyer-id", wallet: { balance: 2000 } };
            const mockSeller = { id: "seller-id" };
            userRepository.findOne.mockResolvedValueOnce(mockBuyer);
            userRepository.findOne.mockResolvedValueOnce(mockSeller);
            await expect(service.createEscrow({
                title: "Test Escrow",
                totalAmount: 1000,
                buyerId: "buyer-id",
                sellerId: "seller-id",
                expirationDays: 30,
                milestones: [
                    { amount: 500, description: "Test milestone 1", sequence: 1 },
                ],
            })).rejects.toThrow(common_1.BadRequestException);
        });
        it("should successfully create an escrow when all inputs are valid", async () => {
            const mockBuyer = { id: "buyer-id", wallet: { balance: 2000 } };
            const mockSeller = { id: "seller-id" };
            const mockEscrow = {
                id: "escrow-id",
                title: "Test Escrow",
                totalAmount: 1000,
                buyerId: "buyer-id",
                sellerId: "seller-id",
                status: escrow_entity_1.EscrowStatus.PENDING,
                expiresAt: expect.any(Date),
                milestones: [
                    {
                        id: "milestone-id",
                        amount: 1000,
                        description: "Test milestone",
                        sequence: 1,
                        status: escrow_entity_1.MilestoneStatus.PENDING,
                    },
                ],
            };
            userRepository.findOne.mockResolvedValueOnce(mockBuyer);
            userRepository.findOne.mockResolvedValueOnce(mockSeller);
            escrowRepository.save.mockResolvedValueOnce(mockEscrow);
            milestoneRepository.save.mockResolvedValueOnce(mockEscrow.milestones[0]);
            transactionLogRepository.save.mockResolvedValueOnce({});
            jest
                .spyOn(dataSource, "transaction")
                .mockImplementation(async (callbackOrIsolationLevel, maybeCallback) => {
                const callback = typeof callbackOrIsolationLevel === "function"
                    ? callbackOrIsolationLevel
                    : maybeCallback;
                return mockEscrow;
            });
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
            expect(result).toEqual(mockEscrow);
            expect(dataSource.transaction).toHaveBeenCalled();
        });
    });
    describe("fundEscrow", () => {
        it("should throw NotFoundException if escrow is not found", async () => {
            jest
                .spyOn(dataSource, "transaction")
                .mockImplementation(async (callbackOrIsolationLevel, maybeCallback) => {
                const callback = typeof callbackOrIsolationLevel === "function"
                    ? callbackOrIsolationLevel
                    : maybeCallback;
                return await callback({
                    findOne: jest.fn().mockResolvedValueOnce(null),
                });
            });
            await expect(service.fundEscrow("non-existent-id", "buyer-id")).rejects.toThrow(common_1.NotFoundException);
        });
        it("should throw ForbiddenException if user is not the buyer", async () => {
            const mockEscrow = {
                id: "escrow-id",
                buyerId: "buyer-id",
                status: escrow_entity_1.EscrowStatus.PENDING,
            };
            jest
                .spyOn(dataSource, "transaction")
                .mockImplementation(async (callbackOrIsolationLevel, maybeCallback) => {
                const callback = typeof callbackOrIsolationLevel === "function"
                    ? callbackOrIsolationLevel
                    : maybeCallback;
                return await callback({
                    findOne: jest.fn().mockResolvedValueOnce(mockEscrow),
                });
            });
            await expect(service.fundEscrow("escrow-id", "not-buyer-id")).rejects.toThrow(common_1.ForbiddenException);
        });
        it("should throw BadRequestException if escrow is not in PENDING status", async () => {
            const mockEscrow = {
                id: "escrow-id",
                buyerId: "buyer-id",
                status: escrow_entity_1.EscrowStatus.FUNDED,
            };
            jest
                .spyOn(dataSource, "transaction")
                .mockImplementation(async (callbackOrIsolationLevel, maybeCallback) => {
                const callback = typeof callbackOrIsolationLevel === "function"
                    ? callbackOrIsolationLevel
                    : maybeCallback;
                return await callback({
                    findOne: jest.fn().mockResolvedValueOnce(mockEscrow),
                });
            });
            await expect(service.fundEscrow("escrow-id", "buyer-id")).rejects.toThrow(common_1.BadRequestException);
        });
        it("should successfully fund an escrow when inputs are valid", async () => {
            const mockEscrow = {
                id: "escrow-id",
                buyerId: "buyer-id",
                sellerId: "seller-id",
                totalAmount: 1000,
                status: escrow_entity_1.EscrowStatus.PENDING,
            };
            const mockBuyer = {
                id: "buyer-id",
                wallet: { id: "wallet-id", balance: 2000 },
            };
            const mockUpdatedEscrow = Object.assign(Object.assign({}, mockEscrow), { status: escrow_entity_1.EscrowStatus.FUNDED, paymentId: "payment-id" });
            jest
                .spyOn(dataSource, "transaction")
                .mockImplementation(async (callbackOrIsolationLevel, maybeCallback) => {
                const callback = typeof callbackOrIsolationLevel === "function"
                    ? callbackOrIsolationLevel
                    : maybeCallback;
                return await callback({
                    findOne: jest
                        .fn()
                        .mockResolvedValueOnce(mockEscrow)
                        .mockResolvedValueOnce(mockBuyer),
                    save: jest
                        .fn()
                        .mockResolvedValueOnce(mockBuyer.wallet)
                        .mockResolvedValueOnce({ id: "payment-id" })
                        .mockResolvedValueOnce(mockUpdatedEscrow),
                });
            });
            const result = await service.fundEscrow("escrow-id", "buyer-id");
            expect(result).toEqual(mockUpdatedEscrow);
            expect(dataSource.transaction).toHaveBeenCalled();
        });
    });
    describe("submitDeliveryProof", () => {
        it("should throw NotFoundException if escrow is not found", async () => {
            jest
                .spyOn(dataSource, "transaction")
                .mockImplementation(async (callbackOrIsolationLevel, maybeCallback) => {
                const callback = typeof callbackOrIsolationLevel === "function"
                    ? callbackOrIsolationLevel
                    : maybeCallback;
                return await callback({
                    findOne: jest.fn().mockResolvedValueOnce(null),
                });
            });
            await expect(service.submitDeliveryProof("non-existent-id", {
                type: delivery_proof_entity_1.ProofType.IMAGE,
                description: "Test proof",
                files: ["file1"],
                metadata: {},
            }, "seller-id")).rejects.toThrow(common_1.NotFoundException);
        });
        it("should throw ForbiddenException if user is not the seller", async () => {
            const mockEscrow = {
                id: "escrow-id",
                sellerId: "seller-id",
                status: escrow_entity_1.EscrowStatus.FUNDED,
            };
            jest
                .spyOn(dataSource, "transaction")
                .mockImplementation(async (callbackOrIsolationLevel, maybeCallback) => {
                const callback = typeof callbackOrIsolationLevel === "function"
                    ? callbackOrIsolationLevel
                    : maybeCallback;
                return await callback({
                    findOne: jest.fn().mockResolvedValueOnce(mockEscrow),
                });
            });
            await expect(service.submitDeliveryProof("escrow-id", {
                type: delivery_proof_entity_1.ProofType.IMAGE,
                description: "Test proof",
                files: ["file1"],
                metadata: {},
            }, "not-seller-id")).rejects.toThrow(common_1.ForbiddenException);
        });
        it("should successfully create a delivery proof when inputs are valid", async () => {
            const mockEscrow = {
                id: "escrow-id",
                sellerId: "seller-id",
                status: escrow_entity_1.EscrowStatus.FUNDED,
            };
            const mockProof = {
                id: "proof-id",
                escrowId: "escrow-id",
                type: delivery_proof_entity_1.ProofType.IMAGE,
                description: "Test proof",
                files: ["file1"],
                status: delivery_proof_entity_1.ProofStatus.PENDING,
                metadata: {},
            };
            jest
                .spyOn(dataSource, "transaction")
                .mockImplementation(async (callbackOrIsolationLevel, maybeCallback) => {
                const callback = typeof callbackOrIsolationLevel === "function"
                    ? callbackOrIsolationLevel
                    : maybeCallback;
                return await callback({
                    findOne: jest.fn().mockResolvedValueOnce(mockEscrow),
                    save: jest.fn().mockResolvedValueOnce(mockProof),
                });
            });
            const result = await service.submitDeliveryProof("escrow-id", {
                type: delivery_proof_entity_1.ProofType.IMAGE,
                description: "Test proof",
                files: ["file1"],
                metadata: {},
            }, "seller-id");
            expect(result).toEqual(mockProof);
        });
    });
});
//# sourceMappingURL=escrow.service.spec.js.map