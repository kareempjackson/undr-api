import { Repository } from "typeorm";
import { Escrow, EscrowStatus, EscrowMilestone, MilestoneStatus } from "../../entities/escrow.entity";
import { Payment } from "../../entities/payment.entity";
import { User } from "../../entities/user.entity";
import { Wallet } from "../../entities/wallet.entity";
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
    constructor(escrowRepository: Repository<Escrow>, milestoneRepository: Repository<EscrowMilestone>, paymentRepository: Repository<Payment>, userRepository: Repository<User>, walletRepository: Repository<Wallet>);
    createEscrow(params: CreateEscrowParams): Promise<Escrow>;
    fundEscrow(escrowId: string, buyerId: string): Promise<Escrow>;
    updateMilestone(params: MilestoneUpdateParams): Promise<EscrowMilestone>;
    completeEscrow(escrowId: string): Promise<Escrow>;
    cancelEscrow(escrowId: string, userId: string): Promise<Escrow>;
    getEscrowsByUser(userId: string, status?: EscrowStatus, limit?: number, offset?: number): Promise<{
        escrows: Escrow[];
        total: number;
    }>;
    getEscrowById(escrowId: string): Promise<Escrow>;
}
export {};
