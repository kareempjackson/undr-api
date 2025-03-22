"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
function generateEncryptionKey() {
    const encryptionKey = crypto.randomBytes(32).toString("hex");
    console.log("Generated encryption key:", encryptionKey);
    const envPath = path.resolve(process.cwd(), ".env");
    if (!fs.existsSync(envPath)) {
        console.error(".env file not found at", envPath);
        process.exit(1);
    }
    let envContent = fs.readFileSync(envPath, "utf8");
    if (envContent.includes("ENCRYPTION_KEY=")) {
        console.log("ENCRYPTION_KEY already exists in .env file");
        if (process.argv.includes("--force")) {
            envContent = envContent.replace(/ENCRYPTION_KEY=.*/, `ENCRYPTION_KEY=${encryptionKey}`);
            fs.writeFileSync(envPath, envContent);
            console.log("Replaced existing ENCRYPTION_KEY in .env file");
        }
    }
    else {
        envContent += `\n# Encryption key for sensitive data (generated ${new Date().toISOString()})\nENCRYPTION_KEY=${encryptionKey}\n`;
        fs.writeFileSync(envPath, envContent);
        console.log("Added ENCRYPTION_KEY to .env file");
    }
    console.log("IMPORTANT: Keep this key secure and backed up. If lost, encrypted data cannot be recovered!");
}
generateEncryptionKey();
//# sourceMappingURL=generate-encryption-key.js.map