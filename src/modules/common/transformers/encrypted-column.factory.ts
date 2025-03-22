import {
  EncryptedColumnTransformer,
  IEncryptedColumnTransformer,
} from "./encrypted-column.transformer";
import { EncryptionService } from "../../security/encryption.service";
import { Logger } from "@nestjs/common";

// Global encryption service instance
let encryptionServiceInstance: EncryptionService;
const logger = new Logger("EncryptedColumnFactory");

/**
 * Set the encryption service instance for use in entity transformers
 * This should be called once during application bootstrap
 */
export function setEncryptionService(
  encryptionService: EncryptionService
): void {
  encryptionServiceInstance = encryptionService;
  logger.log("Encryption service successfully set for column transformers");
}

/**
 * Factory function to create encrypted column transformers
 * Use this in entity column definitions
 */
export function encryptedColumn(): IEncryptedColumnTransformer {
  // Create a lazy-loading transformer that will get the encryption service when needed
  return new LazyEncryptedColumnTransformer(() => {
    if (!encryptionServiceInstance) {
      logger.error(
        "Encryption service not initialized. This is a critical error."
      );
      throw new Error(
        "Encryption service not initialized. Call setEncryptionService first."
      );
    }
    return encryptionServiceInstance;
  });
}

/**
 * A transformer that lazily gets the encryption service when needed
 * This allows entities to be defined before the encryption service is initialized
 */
class LazyEncryptedColumnTransformer implements IEncryptedColumnTransformer {
  private transformer: EncryptedColumnTransformer | null = null;
  private readonly logger = new Logger(LazyEncryptedColumnTransformer.name);

  constructor(private getEncryptionService: () => EncryptionService) {}

  private getTransformer(): EncryptedColumnTransformer {
    if (!this.transformer) {
      try {
        const encryptionService = this.getEncryptionService();
        this.transformer = new EncryptedColumnTransformer(encryptionService);
      } catch (error) {
        this.logger.error(
          `Failed to initialize transformer: ${error.message}`,
          error.stack
        );
        throw new Error(
          `Encryption transformer initialization failed: ${error.message}`
        );
      }
    }
    return this.transformer;
  }

  to(value: any): string | null {
    try {
      return this.getTransformer().to(value);
    } catch (error) {
      this.logger.error(`Error in to() transformation: ${error.message}`, {
        valueType: typeof value,
        error: error.stack,
      });
      return null; // Fallback to prevent database errors
    }
  }

  from(value: string): any {
    try {
      return this.getTransformer().from(value);
    } catch (error) {
      this.logger.error(`Error in from() transformation: ${error.message}`, {
        error: error.stack,
      });
      // Return a placeholder to indicate decryption error
      return `[DECRYPTION_ERROR: ${error.message}]`;
    }
  }
}
