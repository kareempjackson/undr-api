import { EscrowService } from "../modules/escrow/escrow.service";
export declare class EscrowSchedulerService {
    private readonly escrowService;
    private readonly logger;
    constructor(escrowService: EscrowService);
    handleScheduledReleases(): Promise<void>;
}
