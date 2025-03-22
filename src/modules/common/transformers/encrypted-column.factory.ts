import {
  EncryptedColumnTransformer,
  IEncryptedColumnTransformer,
} from "./encrypted-column.transformer";
import { EncryptionService } from "../../security/encryption.service";

// Global encryption service instance
let encryptionServiceInstance: EncryptionService;

/**
 * Set the encryption service instance for use in entity transformers
 * This should be called once during application bootstrap
 */
export function setEncryptionService(
  encryptionService: EncryptionService
): void {
  encryptionServiceInstance = encryptionService;
}

/**
 * Factory function to create encrypted column transformers
 * Use this in entity column definitions
 */
export function encryptedColumn(): IEncryptedColumnTransformer {
  // Create a lazy-loading transformer that will get the encryption service when needed
  return new LazyEncryptedColumnTransformer(() => {
    if (!encryptionServiceInstance) {
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

  constructor(private getEncryptionService: () => EncryptionService) {}

  private getTransformer(): EncryptedColumnTransformer {
    if (!this.transformer) {
      const encryptionService = this.getEncryptionService();
      this.transformer = new EncryptedColumnTransformer(encryptionService);
    }
    return this.transformer;
  }

  to(value: any): string | null {
    return this.getTransformer().to(value);
  }

  from(value: string): any {
    return this.getTransformer().from(value);
  }
}
