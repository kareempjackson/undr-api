import { Repository } from "typeorm";
import { Dispute, DisputeStatus, DisputeReason } from "../../entities/dispute.entity";
import { Payment } from "../../entities/payment.entity";
import { User } from "../../entities/user.entity";
interface CreateDisputeParams {
    paymentId: string;
    filedByUserId: string;
    reason: DisputeReason;
    description: string;
    evidenceFiles?: string[];
}
interface ResolveDisputeParams {
    disputeId: string;
    resolvedByUserId: string;
    resolveForCustomer: boolean;
    resolutionNotes?: string;
}
interface DisputeEvidence {
    description: string;
    files: string[];
}
export declare class DisputeService {
    private disputeRepository;
    private paymentRepository;
    private userRepository;
    constructor(disputeRepository: Repository<Dispute>, paymentRepository: Repository<Payment>, userRepository: Repository<User>);
    createDispute(params: CreateDisputeParams): Promise<Dispute>;
    private generateResponsePacket;
    addEvidence(disputeId: string, userId: string, evidence: DisputeEvidence): Promise<Dispute>;
    resolveDispute(params: ResolveDisputeParams): Promise<Dispute>;
    getDisputes(filters: {
        status?: DisputeStatus;
        userId?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        disputes: Dispute[];
        total: number;
    }>;
    getDisputeById(disputeId: string): Promise<Dispute>;
}
export {};
