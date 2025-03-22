import { ConfigService } from "@nestjs/config";
export declare class EncryptionService {
    private configService;
    private readonly encryptionKey;
    private readonly algorithm;
    private readonly logger;
    constructor(configService: ConfigService);
    encrypt(text: string): string;
    decrypt(encryptedJson: string): string;
    static generateEncryptionKey(): string;
}
