/// <reference types="node" />
/// <reference types="node" />
import { ConfigService } from "@nestjs/config";
import { EscrowService } from "../modules/escrow/escrow.service";
export declare class WebhookController {
    private readonly escrowService;
    private readonly configService;
    private readonly logger;
    private readonly stripeWebhookSecret;
    constructor(escrowService: EscrowService, configService: ConfigService);
    handleStripeWebhook(signature: string, rawBody: Buffer | string): Promise<{
        received: boolean;
    }>;
    private handleDisputeCreated;
}
