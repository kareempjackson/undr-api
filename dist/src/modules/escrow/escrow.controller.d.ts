import { EscrowService } from "./escrow.service";
import { EscrowCreateDTO, DeliveryProofSubmitDTO, EscrowQueryDTO, RefundRequestDTO } from "../../dtos/escrow.dto";
import { RequestWithUser } from "../../interfaces/request-with-user.interface";
import { DeliveryProof } from "../../entities/delivery-proof.entity";
import { Escrow } from "../../entities/escrow.entity";
export declare class EscrowController {
    private readonly escrowService;
    private readonly logger;
    constructor(escrowService: EscrowService);
    createEscrow(createEscrowDto: EscrowCreateDTO, req: RequestWithUser): Promise<Escrow>;
    getEscrow(id: string, req: RequestWithUser): Promise<Escrow>;
    getUserEscrows(query: EscrowQueryDTO, req: RequestWithUser): Promise<{
        escrows: Escrow[];
        total: number;
    }>;
    submitProof(id: string, proofDto: DeliveryProofSubmitDTO, req: RequestWithUser): Promise<DeliveryProof>;
    releaseFunds(id: string, req: RequestWithUser): Promise<Escrow>;
    issueRefund(id: string, refundDto: RefundRequestDTO, req: RequestWithUser): Promise<Escrow>;
    private extractRequestMetadata;
    private hashIdentifier;
}
