import { RiskAssessmentService } from "./risk-assessment.service";
import { ThreeDsService } from "./three-ds.service";
import { DisputeService } from "./dispute.service";
import { EscrowService } from "./escrow.service";
import { DeliveryProofSubmitDTO, ReviewProofDTO } from "../../dtos/escrow.dto";
export declare class SecurityController {
    private readonly riskAssessmentService;
    private readonly threeDsService;
    private readonly disputeService;
    private readonly escrowService;
    private readonly logger;
    constructor(riskAssessmentService: RiskAssessmentService, threeDsService: ThreeDsService, disputeService: DisputeService, escrowService: EscrowService);
    private extractRequestMetadata;
    create3dsIntent(body: any, req: any): Promise<{
        clientSecret: string;
        requires3ds: boolean;
        paymentIntentId: string;
    }>;
    check3dsStatus(paymentIntentId: string): Promise<{
        status: "succeeded" | "requires_payment_method" | "requires_action" | "canceled" | "processing" | "requires_capture";
        threeDsStatus: import("../../entities").ThreeDsStatus;
        paymentIntent: import("stripe").Stripe.PaymentIntent;
    }>;
    assessRisk(body: any, req: any): Promise<import("../../entities").RiskAssessment>;
    getPendingRiskReviews(): Promise<import("../../entities").RiskAssessment[]>;
    reviewRiskAssessment(id: string, body: any, req: any): Promise<import("../../entities").RiskAssessment>;
    createDispute(body: any, req: any): Promise<import("../../entities/dispute.entity").Dispute>;
    addDisputeEvidence(id: string, body: any, req: any): Promise<import("../../entities/dispute.entity").Dispute>;
    resolveDispute(id: string, body: any, req: any): Promise<import("../../entities/dispute.entity").Dispute>;
    getDisputes(query: any, req: any): Promise<{
        disputes: import("../../entities/dispute.entity").Dispute[];
        total: number;
    }>;
    getDisputeById(id: string): Promise<import("../../entities/dispute.entity").Dispute>;
    createEscrow(body: any, req: any): Promise<import("../../entities/escrow.entity").Escrow>;
    fundEscrow(id: string, req: any): Promise<import("../../entities/escrow.entity").Escrow>;
    submitDeliveryProof(id: string, data: DeliveryProofSubmitDTO, req: any): Promise<import("../../entities").DeliveryProof>;
    getEscrowProofs(id: string, req: any): Promise<import("../../entities").DeliveryProof[]>;
    reviewDeliveryProof(proofId: string, data: ReviewProofDTO, req: any): Promise<import("../../entities").DeliveryProof>;
    updateMilestone(escrowId: string, milestoneId: string, body: any, req: any): Promise<import("../../entities/escrow.entity").EscrowMilestone>;
    completeEscrow(id: string, req: any): Promise<import("../../entities/escrow.entity").Escrow>;
    cancelEscrow(id: string, req: any): Promise<import("../../entities/escrow.entity").Escrow>;
    getEscrows(query: any, req: any): Promise<{
        escrows: import("../../entities/escrow.entity").Escrow[];
        total: number;
    }>;
    getEscrowById(id: string, req: any): Promise<import("../../entities/escrow.entity").Escrow>;
}
