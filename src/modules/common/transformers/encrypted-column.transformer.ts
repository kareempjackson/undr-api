import { ValueTransformer } from "typeorm";
import { EncryptionService } from "../../security/encryption.service";
import { Logger } from "@nestjs/common";

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
  private readonly logger = new Logger(EncryptedColumnTransformer.name);

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

    try {
      // Convert non-string values to string
      const stringValue =
        typeof value === "string" ? value : JSON.stringify(value);

      return this.encryptionService.encrypt(stringValue);
    } catch (error) {
      this.logger.error(`Error encrypting value: ${error.message}`, {
        valueType: typeof value,
        valuePreview:
          typeof value === "string"
            ? value.substring(0, 20) + "..."
            : String(value).substring(0, 20) + "...",
        error: error.stack,
      });
      // Return null on error to prevent database write errors
      // This is a safety fallback, but ideally the service should throw
      return null;
    }
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

    try {
      const decrypted = this.encryptionService.decrypt(value);

      if (decrypted === null) {
        return null;
      }

      // Try to parse the decrypted value back to its original type
      try {
        return JSON.parse(decrypted);
      } catch (jsonError) {
        // If it's not valid JSON, return as is (it's a string)
        return decrypted;
      }
    } catch (error) {
      this.logger.error(`Error decrypting value: ${error.message}`, {
        valuePreview:
          typeof value === "string"
            ? value.substring(0, 30) + "..."
            : String(value).substring(0, 30) + "...",
        error: error.stack,
      });

      // Return original value as fallback to prevent application failure
      // This will allow the app to continue working with encrypted values
      // while errors are being fixed
      return `[DECRYPTION_ERROR: ${error.message}]`;
    }
  }
}
