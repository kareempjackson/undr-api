import { IEncryptedColumnTransformer } from "./encrypted-column.transformer";
import { EncryptionService } from "../../security/encryption.service";
export declare function setEncryptionService(encryptionService: EncryptionService): void;
export declare function encryptedColumn(): IEncryptedColumnTransformer;
