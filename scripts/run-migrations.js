/**
 * This script runs migrations using the compiled JavaScript files.
 * It should be used in production deployments to ensure proper migration execution.
 */

// Ensure environment variables are loaded
require("dotenv").config();

// Force NODE_ENV to be production to ensure correct entity paths
process.env.NODE_ENV = "production";

// Allow disabling SSL for local testing
// In real production, this should always be true
const useSSL = process.argv.includes("--no-ssl") ? false : true;
if (!useSSL) {
  console.log(
    "Warning: SSL is disabled for local testing. This should not be used in production."
  );
  process.env.USE_SSL = "false";
}

async function runMigrations() {
  try {
    // Use the compiled JavaScript files for migrations
    console.log("Loading AppDataSource from compiled JavaScript...");
    const { AppDataSource } = require("../dist/src/data-source.js");

    console.log("Initializing database connection...");
    await AppDataSource.initialize();

    console.log("Running migrations...");
    const migrations = await AppDataSource.runMigrations();
    console.log(`Successfully ran ${migrations.length} migrations`);

    console.log("Closing database connection...");
    await AppDataSource.destroy();

    console.log("Migration process completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  }
}

runMigrations();
