"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const typeorm_1 = require("@nestjs/typeorm");
const encryption_service_1 = require("../src/modules/security/encryption.service");
const encrypted_column_factory_1 = require("../src/modules/common/transformers/encrypted-column.factory");
const user_entity_1 = require("../src/entities/user.entity");
async function checkEncryptedData() {
    console.log("Starting encrypted data validation...");
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    try {
        const encryptionService = app.get(encryption_service_1.EncryptionService);
        (0, encrypted_column_factory_1.setEncryptionService)(encryptionService);
        console.log("Encryption service initialized successfully");
        const dataSource = app.get((0, typeorm_1.getDataSourceToken)());
        console.log("\nChecking User entity encrypted fields...");
        const userRepo = dataSource.getRepository(user_entity_1.User);
        const userMetadata = userRepo.metadata;
        const encryptedColumns = userMetadata.columns
            .filter((column) => column.propertyName === "email" ||
            column.propertyName === "name" ||
            column.propertyName === "phoneNumber")
            .map((column) => ({
            propertyName: column.propertyName,
            databaseName: column.databaseName,
        }));
        console.log("Encrypted columns found:", encryptedColumns);
        const columnSql = encryptedColumns
            .map((col) => `"${col.databaseName}" as "${col.propertyName}"`)
            .join(", ");
        await checkTableWithQuery(dataSource, `SELECT id, ${columnSql} FROM users`, encryptedColumns.map((col) => col.propertyName), encryptionService);
        console.log("\nEncrypted data validation completed.");
    }
    catch (error) {
        console.error("Error during encrypted data validation:", error);
    }
    finally {
        await app.close();
    }
}
async function checkTableWithQuery(dataSource, query, columns, encryptionService) {
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
                        encryptionService.decrypt(value);
                    }
                    catch (error) {
                        issues.push({
                            column,
                            error: error.message,
                            value: typeof value === "string"
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
        }
        else {
            console.log(`⚠️ Found ${corruptedCount} corrupted records`);
        }
    }
    catch (error) {
        console.error(`Query failed: ${query}`);
        console.error(`Query error:`, error);
    }
}
checkEncryptedData()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
//# sourceMappingURL=check-encrypted-data.js.map