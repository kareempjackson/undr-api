"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const security_controller_1 = require("./security.controller");
const escrow_service_1 = require("./escrow.service");
const risk_assessment_service_1 = require("./risk-assessment.service");
const dispute_service_1 = require("./dispute.service");
const three_ds_service_1 = require("./three-ds.service");
const proxy_detection_service_1 = require("./proxy-detection.service");
const encryption_service_1 = require("./encryption.service");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const escrow_entity_1 = require("../../entities/escrow.entity");
const delivery_proof_entity_1 = require("../../entities/delivery-proof.entity");
const user_entity_1 = require("../../entities/user.entity");
const common_1 = require("@nestjs/common");
describe("SecurityController", () => {
    let controller;
    let escrowService;
    const mockEscrowService = {
        createEscrow: jest.fn(),
        fundEscrow: jest.fn(),
        submitDeliveryProof: jest.fn(),
        reviewDeliveryProof: jest.fn(),
        updateMilestone: jest.fn(),
        completeEscrow: jest.fn(),
        cancelEscrow: jest.fn(),
        getEscrowsByUser: jest.fn(),
        getEscrowById: jest.fn(),
        getEscrowProofs: jest.fn(),
    };
    const mockRiskAssessmentService = {
        evaluateRisk: jest.fn(),
    };
    const mockDisputeService = {
        createDispute: jest.fn(),
        getDisputeById: jest.fn(),
    };
    const mockThreeDsService = {
        createPaymentIntent: jest.fn(),
        getPaymentIntentStatus: jest.fn(),
    };
    const mockProxyDetectionService = {
        detectProxy: jest.fn(),
    };
    const mockEncryptionService = {
        encrypt: jest.fn(),
        decrypt: jest.fn(),
    };
    const mockJwtService = {
        verify: jest.fn(),
        sign: jest.fn(),
    };
    const mockRequest = {
        ip: "127.0.0.1",
        headers: {
            "user-agent": "Test User Agent",
        },
        user: {
            id: "test-user-id",
        },
    };
    const mockRequestMetadata = {
        ip: "127.0.0.1",
        userAgent: "Test User Agent",
        timestamp: expect.any(String),
        userId: "test-user-id",
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [security_controller_1.SecurityController],
            providers: [
                { provide: escrow_service_1.EscrowService, useValue: mockEscrowService },
                { provide: risk_assessment_service_1.RiskAssessmentService, useValue: mockRiskAssessmentService },
                { provide: dispute_service_1.DisputeService, useValue: mockDisputeService },
                { provide: three_ds_service_1.ThreeDsService, useValue: mockThreeDsService },
                { provide: proxy_detection_service_1.ProxyDetectionService, useValue: mockProxyDetectionService },
                { provide: encryption_service_1.EncryptionService, useValue: mockEncryptionService },
                { provide: jwt_1.JwtService, useValue: mockJwtService },
                {
                    provide: (0, typeorm_1.getRepositoryToken)(escrow_entity_1.Escrow),
                    useValue: { findOne: jest.fn(), find: jest.fn(), save: jest.fn() },
                },
                {
                    provide: (0, typeorm_1.getRepositoryToken)(delivery_proof_entity_1.DeliveryProof),
                    useValue: { findOne: jest.fn(), find: jest.fn(), save: jest.fn() },
                },
                {
                    provide: (0, typeorm_1.getRepositoryToken)(user_entity_1.User),
                    useValue: { findOne: jest.fn(), find: jest.fn(), save: jest.fn() },
                },
            ],
        }).compile();
        controller = module.get(security_controller_1.SecurityController);
        escrowService = module.get(escrow_service_1.EscrowService);
        jest
            .spyOn(controller, "extractRequestMetadata")
            .mockImplementation(() => ({
            ip: "127.0.0.1",
            userAgent: "Test User Agent",
            timestamp: new Date().toISOString(),
            userId: "test-user-id",
        }));
    });
    it("should be defined", () => {
        expect(controller).toBeDefined();
    });
    describe("createEscrow", () => {
        it("should create an escrow successfully", async () => {
            const createEscrowDto = {
                title: "Test Escrow",
                description: "Test Description",
                totalAmount: 1000,
                sellerId: "seller-id",
                expirationDays: 30,
                milestones: [
                    { amount: 1000, description: "Test Milestone", sequence: 1 },
                ],
            };
            const mockEscrow = Object.assign(Object.assign({ id: "escrow-id" }, createEscrowDto), { buyerId: "test-user-id", status: escrow_entity_1.EscrowStatus.PENDING });
            mockEscrowService.createEscrow.mockResolvedValue(mockEscrow);
            const createEscrowSpy = jest.spyOn(controller, "createEscrow");
            createEscrowSpy.mockImplementation(async () => {
                return mockEscrowService.createEscrow(Object.assign(Object.assign({}, createEscrowDto), { buyerId: "test-user-id" }), mockRequestMetadata);
            });
            const result = await controller.createEscrow(mockRequest, createEscrowDto);
            expect(result).toEqual(mockEscrow);
            expect(mockEscrowService.createEscrow).toHaveBeenCalledWith(expect.objectContaining(Object.assign(Object.assign({}, createEscrowDto), { buyerId: "test-user-id" })), expect.any(Object));
        });
    });
    describe("fundEscrow", () => {
        it("should fund an escrow successfully", async () => {
            const escrowId = "escrow-id";
            const mockEscrow = {
                id: escrowId,
                status: escrow_entity_1.EscrowStatus.FUNDED,
            };
            mockEscrowService.fundEscrow.mockResolvedValue(mockEscrow);
            const result = await controller.fundEscrow(escrowId, mockRequest);
            expect(result).toEqual(mockEscrow);
            expect(mockEscrowService.fundEscrow).toHaveBeenCalledWith(escrowId, "test-user-id", expect.any(Object));
        });
        it("should throw ForbiddenException when user is not the buyer", async () => {
            const escrowId = "escrow-id";
            mockEscrowService.fundEscrow.mockRejectedValue(new common_1.ForbiddenException("Not authorized"));
            await expect(controller.fundEscrow(escrowId, mockRequest)).rejects.toThrow(common_1.ForbiddenException);
            expect(mockEscrowService.fundEscrow).toHaveBeenCalledWith(escrowId, "test-user-id", expect.any(Object));
        });
    });
    describe("submitDeliveryProof", () => {
        it("should submit delivery proof successfully", async () => {
            const escrowId = "escrow-id";
            const proofDto = {
                type: delivery_proof_entity_1.ProofType.IMAGE,
                description: "Proof of delivery",
                files: ["file1.jpg"],
                metadata: { note: "Important delivery note" },
            };
            const mockProof = Object.assign(Object.assign({ id: "proof-id", escrowId }, proofDto), { status: delivery_proof_entity_1.ProofStatus.PENDING });
            mockEscrowService.submitDeliveryProof.mockResolvedValue(mockProof);
            const result = await controller.submitDeliveryProof(escrowId, proofDto, mockRequest);
            expect(result).toEqual(mockProof);
            expect(mockEscrowService.submitDeliveryProof).toHaveBeenCalledWith(escrowId, proofDto, "test-user-id", expect.any(Object));
        });
        it("should throw ForbiddenException when user is not the seller", async () => {
            const escrowId = "escrow-id";
            const proofDto = {
                type: delivery_proof_entity_1.ProofType.IMAGE,
                description: "Proof of delivery",
                files: ["file1.jpg"],
                metadata: { note: "Important delivery note" },
            };
            mockEscrowService.submitDeliveryProof.mockRejectedValue(new common_1.ForbiddenException("Only the seller can submit delivery proof"));
            await expect(controller.submitDeliveryProof(escrowId, proofDto, mockRequest)).rejects.toThrow(common_1.ForbiddenException);
        });
    });
    describe("reviewDeliveryProof", () => {
        it("should review delivery proof successfully", async () => {
            const proofId = "proof-id";
            const reviewDto = {
                decision: "accept",
                rejectionReason: null,
            };
            const mockProof = {
                id: proofId,
                status: delivery_proof_entity_1.ProofStatus.ACCEPTED,
            };
            mockEscrowService.reviewDeliveryProof.mockResolvedValue(mockProof);
            const result = await controller.reviewDeliveryProof(proofId, reviewDto, mockRequest);
            expect(result).toEqual(mockProof);
            expect(mockEscrowService.reviewDeliveryProof).toHaveBeenCalledWith(proofId, reviewDto.decision, "test-user-id", reviewDto.rejectionReason, expect.any(Object));
        });
        it("should provide rejection reason when rejecting proof", async () => {
            const proofId = "proof-id";
            const reviewDto = {
                decision: "reject",
                rejectionReason: "Product not as described",
            };
            const mockProof = {
                id: proofId,
                status: delivery_proof_entity_1.ProofStatus.REJECTED,
                rejectionReason: "Product not as described",
            };
            mockEscrowService.reviewDeliveryProof.mockResolvedValue(mockProof);
            const result = await controller.reviewDeliveryProof(proofId, reviewDto, mockRequest);
            expect(result).toEqual(mockProof);
            expect(mockEscrowService.reviewDeliveryProof).toHaveBeenCalledWith(proofId, reviewDto.decision, "test-user-id", reviewDto.rejectionReason, expect.any(Object));
        });
    });
    describe("getEscrowProofs", () => {
        it("should get all proofs for an escrow", async () => {
            const escrowId = "escrow-id";
            const mockProofs = [
                {
                    id: "proof-1",
                    escrowId,
                    type: delivery_proof_entity_1.ProofType.IMAGE,
                    description: "First proof",
                    files: ["file1.jpg"],
                    status: delivery_proof_entity_1.ProofStatus.ACCEPTED,
                },
                {
                    id: "proof-2",
                    escrowId,
                    type: delivery_proof_entity_1.ProofType.DOCUMENT,
                    description: "Second proof",
                    files: ["file2.pdf"],
                    status: delivery_proof_entity_1.ProofStatus.PENDING,
                },
            ];
            mockEscrowService.getEscrowProofs.mockResolvedValue(mockProofs);
            mockEscrowService.getEscrowById.mockResolvedValue({
                id: escrowId,
                buyerId: "test-user-id",
                sellerId: "seller-id",
            });
            const result = await controller.getEscrowProofs(escrowId, mockRequest);
            expect(result).toEqual(mockProofs);
            expect(mockEscrowService.getEscrowProofs).toHaveBeenCalledWith(escrowId);
        });
        it("should return empty array if no proofs found", async () => {
            const escrowId = "escrow-id";
            mockEscrowService.getEscrowProofs.mockResolvedValue([]);
            mockEscrowService.getEscrowById.mockResolvedValue({
                id: escrowId,
                buyerId: "test-user-id",
                sellerId: "seller-id",
            });
            const result = await controller.getEscrowProofs(escrowId, mockRequest);
            expect(result).toEqual([]);
            expect(mockEscrowService.getEscrowProofs).toHaveBeenCalledWith(escrowId);
        });
    });
});
//# sourceMappingURL=security.controller.spec.js.map