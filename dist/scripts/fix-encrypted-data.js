"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const typeorm_1 = require("@nestjs/typeorm");
const encryption_service_1 = require("../src/modules/security/encryption.service");
const encrypted_column_factory_1 = require("../src/modules/common/transformers/encrypted-column.factory");
const user_entity_1 = require("../src/entities/user.entity");
async function fixEncryptedData() {
    console.log("Starting data encryption fix process...");
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    try {
        const encryptionService = app.get(encryption_service_1.EncryptionService);
        (0, encrypted_column_factory_1.setEncryptionService)(encryptionService);
        console.log("Encryption service initialized successfully");
        const dataSource = app.get((0, typeorm_1.getDataSourceToken)());
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
        console.log("Encrypted columns to fix:", encryptedColumns);
        const users = await userRepo.find();
        console.log(`Found ${users.length} users to process`);
        let updatedCount = 0;
        let skippedCount = 0;
        for (const user of users) {
            let needsUpdate = false;
            const updates = {};
            for (const column of encryptedColumns) {
                const propertyName = column.propertyName;
                const value = user[propertyName];
                if (value) {
                    try {
                        encryptionService.decrypt(value);
                    }
                    catch (error) {
                        try {
                            const encrypted = encryptionService.encrypt(value);
                            updates[propertyName] = encrypted;
                            needsUpdate = true;
                            console.log(`Will encrypt ${propertyName} for user ${user.id}`);
                        }
                        catch (encryptError) {
                            console.error(`Error encrypting ${propertyName} for user ${user.id}:`, encryptError.message);
                        }
                    }
                }
            }
            if (needsUpdate) {
                try {
                    await dataSource
                        .createQueryBuilder()
                        .update(user_entity_1.User)
                        .set(updates)
                        .where("id = :id", { id: user.id })
                        .execute();
                    updatedCount++;
                    console.log(`✅ Updated user ${user.id}`);
                }
                catch (updateError) {
                    console.error(`Error updating user ${user.id}:`, updateError.message);
                }
            }
            else {
                skippedCount++;
            }
        }
        console.log(`\nEncryption fix completed:`);
        console.log(`- Updated ${updatedCount} users`);
        console.log(`- Skipped ${skippedCount} users (already encrypted or no data)`);
    }
    catch (error) {
        console.error("Error during data encryption fix:", error);
    }
    finally {
        await app.close();
    }
}
async function promptForConfirmation() {
    if (process.env.NODE_ENV !== "development") {
        console.warn("⚠️ WARNING: You are not in a development environment!");
        const readline = require("readline").createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        return new Promise((resolve) => {
            readline.question("Are you sure you want to continue? This will modify data in your database. (yes/no): ", (answer) => {
                readline.close();
                resolve(answer.toLowerCase() === "yes");
            });
        });
    }
    return true;
}
async function main() {
    const proceed = await promptForConfirmation();
    if (proceed) {
        await fixEncryptedData();
    }
    else {
        console.log("Operation canceled");
    }
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
//# sourceMappingURL=fix-encrypted-data.js.map