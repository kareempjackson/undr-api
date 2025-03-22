import { Repository, DataSource } from "typeorm";
import { Escrow } from "../entities/escrow.entity";
import { DeliveryProof } from "../entities/delivery-proof.entity";
import { TransactionLog } from "../entities/transaction-log.entity";
import { User } from "../entities/user.entity";
import { Payment } from "../entities/payment.entity";
import { EscrowCreateDTO, DeliveryProofSubmitDTO } from "../dtos/escrow.dto";
export declare class EscrowService {
    private escrowRepository;
    private deliveryProofRepository;
    private transactionLogRepository;
    private userRepository;
    private paymentRepository;
    private dataSource;
    private readonly logger;
    constructor(escrowRepository: Repository<Escrow>, deliveryProofRepository: Repository<DeliveryProof>, transactionLogRepository: Repository<TransactionLog>, userRepository: Repository<User>, paymentRepository: Repository<Payment>, dataSource: DataSource);
    createEscrow(data: EscrowCreateDTO, requestMetadata?: any): Promise<Escrow>;
    submitDeliveryProof(escrowId: string, data: DeliveryProofSubmitDTO, userId: string, requestMetadata?: any): Promise<DeliveryProof>;
    releaseFunds(escrowId: string, userId: string, requestMetadata?: any): Promise<Escrow>;
    issueRefund(escrowId: string, userId: string, reason: string, requestMetadata?: any): Promise<Escrow>;
    handleChargeback(stripePaymentIntentId: string, stripeDisputeId: string, disputeData: any): Promise<void>;
    private calculateRiskScore;
    findOne(id: string): Promise<Escrow>;
    findByUser(userId: string, limit?: number, offset?: number): Promise<{
        escrows: Escrow[];
        total: number;
    }>;
    processScheduledReleases(): Promise<number>;
}
