import { Repository, DataSource } from "typeorm";
import { Escrow, EscrowStatus, EscrowMilestone, MilestoneStatus } from "../../entities/escrow.entity";
import { Payment } from "../../entities/payment.entity";
import { User } from "../../entities/user.entity";
import { Wallet } from "../../entities/wallet.entity";
import { DeliveryProof } from "../../entities/delivery-proof.entity";
import { TransactionLog } from "../../entities/transaction-log.entity";
import { DeliveryProofSubmitDTO } from "../../dtos/escrow.dto";
import { NotificationService } from "../notification/notification.service";
interface CreateEscrowParams {
    title: string;
    description?: string;
    totalAmount: number;
    buyerId: string;
    sellerId: string;
    expirationDays: number;
    milestones: Array<{
        amount: number;
        description: string;
        sequence: number;
    }>;
    terms?: any;
    documents?: string[];
}
interface MilestoneUpdateParams {
    escrowId: string;
    milestoneId: string;
    status: MilestoneStatus;
    userId: string;
}
export declare class EscrowService {
    private escrowRepository;
    private milestoneRepository;
    private paymentRepository;
    private userRepository;
    private walletRepository;
    private deliveryProofRepository;
    private transactionLogRepository;
    private dataSource;
    private notificationService;
    private readonly logger;
    constructor(escrowRepository: Repository<Escrow>, milestoneRepository: Repository<EscrowMilestone>, paymentRepository: Repository<Payment>, userRepository: Repository<User>, walletRepository: Repository<Wallet>, deliveryProofRepository: Repository<DeliveryProof>, transactionLogRepository: Repository<TransactionLog>, dataSource: DataSource, notificationService: NotificationService);
    createEscrow(params: CreateEscrowParams, requestMetadata?: any): Promise<Escrow>;
    private sendEscrowCreatedNotifications;
    fundEscrow(escrowId: string, buyerId: string, requestMetadata?: any): Promise<Escrow>;
    private sendEscrowFundedNotifications;
    submitDeliveryProof(escrowId: string, data: DeliveryProofSubmitDTO, userId: string, requestMetadata?: any): Promise<DeliveryProof>;
    reviewDeliveryProof(proofId: string, decision: "accept" | "reject", userId: string, rejectionReason?: string, requestMetadata?: any): Promise<DeliveryProof>;
    private sendProofSubmittedNotification;
    private sendProofApprovedNotification;
    private sendProofRejectedNotification;
    updateMilestone(params: MilestoneUpdateParams, requestMetadata?: any): Promise<EscrowMilestone>;
    private sendMilestoneUpdateNotifications;
    completeEscrow(escrowId: string, transactionManager?: any): Promise<Escrow>;
    private sendEscrowCompletedNotifications;
    cancelEscrow(escrowId: string, userId: string, requestMetadata?: any): Promise<Escrow>;
    private sendEscrowCancelledNotifications;
    getEscrowsByUser(userId: string, status?: EscrowStatus, limit?: number, offset?: number): Promise<{
        escrows: Escrow[];
        total: number;
    }>;
    getEscrowById(escrowId: string): Promise<Escrow>;
    getEscrowProofs(escrowId: string): Promise<DeliveryProof[]>;
    processScheduledReleases(): Promise<number>;
    private sendAutomaticReleaseNotifications;
    private logTransaction;
}
export {};
