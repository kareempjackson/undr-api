import { ValueTransformer } from "typeorm";
import { EncryptionService } from "../../security/encryption.service";
export interface IEncryptedColumnTransformer extends ValueTransformer {
    to(value: any): string | null;
    from(value: string): any;
}
export declare class EncryptedColumnTransformer implements IEncryptedColumnTransformer {
    private encryptionService;
    private readonly logger;
    constructor(encryptionService: EncryptionService);
    to(value: any): string | null;
    from(value: string): any;
}
