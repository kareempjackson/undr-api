import { ValueTransformer } from "typeorm";
import { EncryptionService } from "../../security/encryption.service";

/**
 * Interface for encrypted column transformers
 */
export interface IEncryptedColumnTransformer extends ValueTransformer {
  to(value: any): string | null;
  from(value: string): any;
}

/**
 * This transformer is used for encrypted columns in TypeORM entities.
 * It automatically encrypts data when persisting to the database
 * and decrypts data when retrieving from the database.
 */
export class EncryptedColumnTransformer implements IEncryptedColumnTransformer {
  constructor(private encryptionService: EncryptionService) {}

  /**
   * Transform the value before it's persisted to the database
   * @param value The value to encrypt
   * @returns The encrypted value as a string
   */
  to(value: any): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    // Convert non-string values to string
    const stringValue =
      typeof value === "string" ? value : JSON.stringify(value);

    return this.encryptionService.encrypt(stringValue);
  }

  /**
   * Transform the value after it's retrieved from the database
   * @param value The encrypted value from the database
   * @returns The decrypted value
   */
  from(value: string): any {
    if (value === null || value === undefined) {
      return null;
    }

    const decrypted = this.encryptionService.decrypt(value);

    // Try to parse the decrypted value back to its original type
    try {
      return JSON.parse(decrypted);
    } catch {
      // If it's not valid JSON, return as is (it's a string)
      return decrypted;
    }
  }
}
