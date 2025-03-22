import { RawBodyRequest } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { Repository } from "typeorm";
import { Deposit } from "../../entities/deposit.entity";
import { User } from "../../entities/user.entity";
import { Wallet } from "../../entities/wallet.entity";
import { Request } from "express";
export declare class PaymentsController {
    private paymentsService;
    private depositRepository;
    private userRepository;
    private walletRepository;
    private readonly logger;
    constructor(paymentsService: PaymentsService, depositRepository: Repository<Deposit>, userRepository: Repository<User>, walletRepository: Repository<Wallet>);
    handleStripeWebhook(req: RawBodyRequest<Request>, signature: string): Promise<{
        received: boolean;
        error?: undefined;
    } | {
        received: boolean;
        error: any;
    }>;
    handleCryptoWebhook(payload: any): Promise<{
        received: boolean;
        error?: undefined;
    } | {
        received: boolean;
        error: any;
    }>;
}
