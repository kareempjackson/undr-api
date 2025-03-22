import { EscrowService } from "../services/escrow.service";
import { EscrowCreateDTO, DeliveryProofSubmitDTO, EscrowQueryDTO, RefundRequestDTO } from "../dtos/escrow.dto";
import { Request } from "express";
import { DeliveryProof } from "../entities/delivery-proof.entity";
import { Escrow } from "../entities/escrow.entity";
export declare class EscrowController {
    private readonly escrowService;
    constructor(escrowService: EscrowService);
    createEscrow(createEscrowDto: EscrowCreateDTO, req: Request): Promise<Escrow>;
    getEscrow(id: string, req: Request): Promise<Escrow>;
    getUserEscrows(query: EscrowQueryDTO, req: Request): Promise<{
        escrows: Escrow[];
        total: number;
    }>;
    submitProof(id: string, proofDto: DeliveryProofSubmitDTO, req: Request): Promise<DeliveryProof>;
    releaseFunds(id: string, req: Request): Promise<Escrow>;
    issueRefund(id: string, refundDto: RefundRequestDTO, req: Request): Promise<Escrow>;
    private extractRequestMetadata;
    private hashIp;
}
