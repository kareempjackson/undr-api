import { NestFactory } from "@nestjs/core";
import { AppModule } from "../src/app.module";
import { getDataSourceToken } from "@nestjs/typeorm";
import { DataSource, getRepository, Repository } from "typeorm";
import { EncryptionService } from "../src/modules/security/encryption.service";
import { setEncryptionService } from "../src/modules/common/transformers/encrypted-column.factory";
import { User } from "../src/entities/user.entity";

/**
 * This script checks for corrupted encrypted data in the database
 * by attempting to decrypt values in encrypted columns.
 */
async function checkEncryptedData() {
  console.log("Starting encrypted data validation...");

  // Create a standalone NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Initialize encryption service for transformers
    const encryptionService = app.get(EncryptionService);
    setEncryptionService(encryptionService);
    console.log("Encryption service initialized successfully");

    // Get the database connection
    const dataSource = app.get<DataSource>(getDataSourceToken());

    // Check User entity encrypted fields
    console.log("\nChecking User entity encrypted fields...");

    // Get column metadata from entity to ensure correct casing
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

    console.log("Encrypted columns found:", encryptedColumns);

    // Build SQL query with correct column names
    const columnSql = encryptedColumns
      .map((col) => `"${col.databaseName}" as "${col.propertyName}"`)
      .join(", ");

    await checkTableWithQuery(
      dataSource,
      `SELECT id, ${columnSql} FROM users`,
      encryptedColumns.map((col) => col.propertyName),
      encryptionService
    );

    console.log("\nEncrypted data validation completed.");
  } catch (error) {
    console.error("Error during encrypted data validation:", error);
  } finally {
    await app.close();
  }
}

/**
 * Check a specific table for encrypted column issues using a custom query
 */
async function checkTableWithQuery(
  dataSource: DataSource,
  query: string,
  columns: string[],
  encryptionService: EncryptionService
) {
  try {
    console.log(`Executing query: ${query}`);
    const records = await dataSource.query(query);

    console.log(`Found ${records.length} records`);
    let corruptedCount = 0;

    for (const record of records) {
      const issues = [];

      for (const column of columns) {
        const value = record[column];

        if (value) {
          try {
            // Try to decrypt the value
            encryptionService.decrypt(value);
          } catch (error) {
            issues.push({
              column,
              error: error.message,
              value:
                typeof value === "string"
                  ? value.substring(0, 30) + "..."
                  : typeof value,
            });
          }
        }
      }

      if (issues.length > 0) {
        corruptedCount++;
        console.log(`\nCorrupted record found:`);
        console.log(`ID: ${record.id}`);
        console.log("Issues:", JSON.stringify(issues, null, 2));
      }
    }

    if (corruptedCount === 0) {
      console.log(`✅ All records validated successfully`);
    } else {
      console.log(`⚠️ Found ${corruptedCount} corrupted records`);
    }
  } catch (error) {
    console.error(`Query failed: ${query}`);
    console.error(`Query error:`, error);
  }
}

// Run the script
checkEncryptedData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
