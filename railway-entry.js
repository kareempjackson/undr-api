/**
 * Railway Entry Script
 *
 * This script is used as the primary entry point for Railway deployments.
 * It helps with diagnosing issues and ensures a clean startup process.
 */

// Force production mode
process.env.NODE_ENV = "production";

// By default, skip database checks to ensure the app starts
if (process.env.SKIP_DB_CHECK === undefined) {
  process.env.SKIP_DB_CHECK = "true";
}

console.log("=======================================");
console.log("UNDR API - Railway Entry Script");
console.log("=======================================");
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`SKIP_DB_CHECK: ${process.env.SKIP_DB_CHECK}`);
console.log(`PORT: ${process.env.PORT || 3001}`);
console.log(`DATABASE_URL configured: ${!!process.env.DATABASE_URL}`);
console.log("Starting application...");

// Using require here instead of import to avoid transpilation issues
const { spawn } = require("child_process");
const path = require("path");

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
