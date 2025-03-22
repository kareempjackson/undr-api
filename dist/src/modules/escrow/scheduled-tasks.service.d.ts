import { EscrowService } from "./escrow.service";
export declare class ScheduledTasksService {
    private escrowService;
    private readonly logger;
    constructor(escrowService: EscrowService);
    releaseEscrowedPayments(): Promise<void>;
}
