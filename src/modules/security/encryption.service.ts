import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

@Injectable()
export class EncryptionService {
  private readonly encryptionKey: Buffer;
  private readonly algorithm = "aes-256-gcm";
  private readonly logger = new Logger(EncryptionService.name);

  constructor(private configService: ConfigService) {
    // Get encryption key from environment variables
    const key = this.configService.get<string>("ENCRYPTION_KEY");

    if (!key) {
      this.logger.error("ENCRYPTION_KEY is not set in environment variables!");
      throw new Error("Encryption key is not configured");
    }

    // Convert the hex key to a Buffer
    this.encryptionKey = Buffer.from(key, "hex");

    // Validate key length for AES-256
    if (this.encryptionKey.length !== 32) {
      this.logger.error(
        `Invalid encryption key length: ${this.encryptionKey.length} bytes. Expected 32 bytes for AES-256.`
      );
      throw new Error("Invalid encryption key length");
    }

    this.logger.log(
      "Encryption service initialized successfully with valid key"
    );
  }

  /**
   * Encrypts a value using AES-256-GCM
   *
   * @param text The text to encrypt
   * @returns A JSON string containing the encrypted data, iv and auth tag
   */
  encrypt(text: string): string {
    if (text === null || text === undefined) {
      return null;
    }

    try {
      // Generate a random initialization vector
      const iv = crypto.randomBytes(16);

      // Create the cipher
      const cipher = crypto.createCipheriv(
        this.algorithm,
        this.encryptionKey,
        iv
      );

      // Encrypt the text
      let encrypted = cipher.update(text, "utf8", "base64");
      encrypted += cipher.final("base64");

      // Get the authentication tag
      const authTag = cipher.getAuthTag().toString("base64");

      // Return a JSON string containing all the data needed for decryption
      return JSON.stringify({
        iv: iv.toString("base64"),
        encrypted,
        authTag,
      });
    } catch (error) {
      this.logger.error(`Encryption error: ${error.message}`, error.stack);
      throw new Error(`Encryption failed: ${error.message}`);
    }
  }

  /**
   * Decrypts an encrypted value
   *
   * @param encryptedJson JSON string containing encrypted data, iv and auth tag
   * @returns The decrypted text
   */
  decrypt(encryptedJson: string): string {
    if (encryptedJson === null || encryptedJson === undefined) {
      return null;
    }

    try {
      // Parse the encrypted data
      let parsed;
      try {
        parsed = JSON.parse(encryptedJson);
      } catch (jsonError) {
        this.logger.error(`Invalid JSON format: ${jsonError.message}`, {
          encryptedValue: encryptedJson.substring(0, 30) + "...",
        });
        throw new Error(`Invalid encrypted format: ${jsonError.message}`);
      }

      const { iv, encrypted, authTag } = parsed;

      if (!iv || !encrypted || !authTag) {
        this.logger.error("Missing encryption components", {
          hasIv: !!iv,
          hasEncrypted: !!encrypted,
          hasAuthTag: !!authTag,
        });
        throw new Error("Invalid encrypted data structure");
      }

      // Create the decipher
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        this.encryptionKey,
        Buffer.from(iv, "base64")
      );

      // Set the auth tag
      decipher.setAuthTag(Buffer.from(authTag, "base64"));

      // Decrypt the data
      let decrypted = decipher.update(encrypted, "base64", "utf8");
      decrypted += decipher.final("utf8");

      return decrypted;
    } catch (error) {
      this.logger.error(`Decryption error: ${error.message}`, {
        error: error.stack,
        encryptedValue:
          typeof encryptedJson === "string"
            ? encryptedJson.substring(0, 30) + "..."
            : typeof encryptedJson,
      });
      throw new Error(`Decryption failed: ${error.message}`);
    }
  }

  /**
   * Generate a secure encryption key
   * Utility method to generate a new key
   */
  static generateEncryptionKey(): string {
    // Generate a 256-bit (32-byte) key for AES-256
    return crypto.randomBytes(32).toString("hex");
  }
}
