import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { getDataSourceToken } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { EncryptionService } from "../src/modules/security/encryption.service";
import { setEncryptionService } from "../src/modules/common/transformers/encrypted-column.factory";
import { User } from "../src/entities/user.entity";

/**
 * This script fixes corrupted data by properly encrypting fields
 * that were not encrypted correctly previously.
 */
async function fixEncryptedData() {
  console.log("Starting data encryption fix process...");

  // Create a standalone NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Initialize encryption service for transformers
    const encryptionService = app.get(EncryptionService);
    setEncryptionService(encryptionService);
    console.log("Encryption service initialized successfully");

    // Get the database connection
    const dataSource = app.get<DataSource>(getDataSourceToken());

    // Get User repository and metadata
    const userRepo = dataSource.getRepository(User);
    const userMetadata = userRepo.metadata;

    // Get encrypted columns from User entity
    const encryptedColumns = userMetadata.columns
      .filter(
        (column) =>
          column.propertyName === "email" ||
          column.propertyName === "name" ||
          column.propertyName === "phoneNumber"
      )
      .map((column) => ({
        propertyName: column.propertyName,
        databaseName: column.databaseName,
      }));

    console.log("Encrypted columns to fix:", encryptedColumns);

    // Fetch all users
    const users = await userRepo.find();
    console.log(`Found ${users.length} users to process`);

    let updatedCount = 0;
    let skippedCount = 0;

    // Process each user
    for (const user of users) {
      let needsUpdate = false;
      const updates: Record<string, any> = {};

      // Check each encrypted column
      for (const column of encryptedColumns) {
        const propertyName = column.propertyName;
        const value = user[propertyName];

        if (value) {
          try {
            // Try to decrypt - if it works, it's already encrypted
            encryptionService.decrypt(value);
            // Value is already properly encrypted
          } catch (error) {
            // Error means the value is not properly encrypted
            try {
              // Try to encrypt it
              const encrypted = encryptionService.encrypt(value);
              updates[propertyName] = encrypted;
              needsUpdate = true;
              console.log(`Will encrypt ${propertyName} for user ${user.id}`);
            } catch (encryptError) {
              console.error(
                `Error encrypting ${propertyName} for user ${user.id}:`,
                encryptError.message
              );
            }
          }
        }
      }

      // Update user if needed
      if (needsUpdate) {
        try {
          await dataSource
            .createQueryBuilder()
            .update(User)
            .set(updates)
            .where("id = :id", { id: user.id })
            .execute();

          updatedCount++;
          console.log(`✅ Updated user ${user.id}`);
        } catch (updateError) {
          console.error(`Error updating user ${user.id}:`, updateError.message);
        }
      } else {
        skippedCount++;
      }
    }

    console.log(`\nEncryption fix completed:`);
    console.log(`- Updated ${updatedCount} users`);
    console.log(
      `- Skipped ${skippedCount} users (already encrypted or no data)`
    );
  } catch (error) {
    console.error("Error during data encryption fix:", error);
  } finally {
    await app.close();
  }
}

// Add safety prompt if not in dev environment
async function promptForConfirmation(): Promise<boolean> {
  if (process.env.NODE_ENV !== "development") {
    console.warn("⚠️ WARNING: You are not in a development environment!");

    const readline = require("readline").createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      readline.question(
        "Are you sure you want to continue? This will modify data in your database. (yes/no): ",
        (answer) => {
          readline.close();
          resolve(answer.toLowerCase() === "yes");
        }
      );
    });
  }

  return true;
}

// Main function
async function main() {
  const proceed = await promptForConfirmation();

  if (proceed) {
    await fixEncryptedData();
  } else {
    console.log("Operation canceled");
  }
}

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
