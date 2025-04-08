/**
 * Railway Entry Script
 *
 * This script is used as the primary entry point for Railway deployments.
 * It helps with diagnosing issues and ensures a clean startup process.
 */

// Force production mode
process.env.NODE_ENV = "production";

// Don't skip database checks in this version
process.env.SKIP_DB_CHECK = "false";

console.log("=======================================");
console.log("UNDR API - Railway Entry Script");
console.log("=======================================");
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`SKIP_DB_CHECK: ${process.env.SKIP_DB_CHECK}`);
console.log(`PORT: ${process.env.PORT || 3001}`);
console.log(`DATABASE_URL configured: ${!!process.env.DATABASE_URL}`);

// Using require here instead of import to avoid transpilation issues
const { spawn } = require("child_process");
const path = require("path");
const { execSync } = require("child_process");
const fs = require("fs");

// Run the database check script first
console.log("\n=== Running Database Connection Check ===");
try {
  execSync("node scripts/diagnose-db-connection.js", { stdio: "inherit" });
  console.log("Database check completed");
} catch (error) {
  console.error("Database check failed, but continuing:", error.message);
}

// Try running migrations
console.log("\n=== Running Database Migrations ===");
let migrationsSuccessful = false;
try {
  execSync("node scripts/run-migrations.js", { stdio: "inherit" });
  console.log("Migrations completed successfully");
  migrationsSuccessful = true;
} catch (error) {
  console.error("Migration process encountered an error:", error.message);
}

// If migrations failed, try manual schema creation as a fallback
if (!migrationsSuccessful) {
  console.log("\n=== Attempting Manual Schema Creation ===");
  try {
    execSync("node scripts/manual-schema-creation.js", { stdio: "inherit" });
    console.log("Manual schema creation completed");
  } catch (error) {
    console.error("Manual schema creation failed:", error.message);
    console.log("Continuing startup regardless of database status...");
  }
}

console.log("\n=== Starting Application ===");
// Start the main application
const app = spawn("node", ["dist/src/main"], {
  env: process.env,
  stdio: "inherit",
});

app.on("error", (err) => {
  console.error("Failed to start application:", err);
  process.exit(1);
});

app.on("close", (code) => {
  if (code !== 0) {
    console.error(`Application exited with code ${code}`);
    process.exit(code);
  }
});

// Handle termination signals
process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down...");
  app.kill("SIGINT");
});

process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down...");
  app.kill("SIGTERM");
});

// Keep the process alive
process.stdin.resume();
