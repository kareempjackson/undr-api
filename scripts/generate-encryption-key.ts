import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

/**
 * This script generates a secure encryption key and adds it to the .env file
 * if it doesn't already exist.
 */
function generateEncryptionKey() {
  // Generate a 256-bit (32-byte) key for AES-256-GCM
  const encryptionKey = crypto.randomBytes(32).toString("hex");
  console.log("Generated encryption key:", encryptionKey);

  // Path to .env file
  const envPath = path.resolve(process.cwd(), ".env");

  // Check if .env file exists
  if (!fs.existsSync(envPath)) {
    console.error(".env file not found at", envPath);
    process.exit(1);
  }

  // Read the .env file
  let envContent = fs.readFileSync(envPath, "utf8");

  // Check if ENCRYPTION_KEY already exists
  if (envContent.includes("ENCRYPTION_KEY=")) {
    console.log("ENCRYPTION_KEY already exists in .env file");

    // Option to replace the key
    if (process.argv.includes("--force")) {
      // Replace the existing key
      envContent = envContent.replace(
        /ENCRYPTION_KEY=.*/,
        `ENCRYPTION_KEY=${encryptionKey}`
      );
      fs.writeFileSync(envPath, envContent);
      console.log("Replaced existing ENCRYPTION_KEY in .env file");
    }
  } else {
    // Add the encryption key to the .env file
    envContent += `\n# Encryption key for sensitive data (generated ${new Date().toISOString()})\nENCRYPTION_KEY=${encryptionKey}\n`;
    fs.writeFileSync(envPath, envContent);
    console.log("Added ENCRYPTION_KEY to .env file");
  }

  console.log(
    "IMPORTANT: Keep this key secure and backed up. If lost, encrypted data cannot be recovered!"
  );
}

// Run the script
generateEncryptionKey();
