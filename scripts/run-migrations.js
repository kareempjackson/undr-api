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
    // Validate DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }

    // Print diagnostic information
    console.log("Database connection info:");
    const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@]*@/, ":****@");
    console.log(`- URL: ${maskedUrl}`);
    console.log(`- SSL: ${useSSL ? "enabled" : "disabled"}`);
    console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);

    // Use the compiled JavaScript files for migrations
    console.log("Loading AppDataSource from compiled JavaScript...");
    const { AppDataSource } = require("../dist/src/data-source.js");

    // Attempt database connection with retries
    console.log("Initializing database connection...");
    const MAX_RETRIES = 5;
    const RETRY_DELAY = 3000; // 3 seconds

    let attempt = 0;
    let connected = false;

    while (attempt < MAX_RETRIES && !connected) {
      try {
        attempt++;
        console.log(`Connection attempt ${attempt}/${MAX_RETRIES}...`);
        await AppDataSource.initialize();
        connected = true;
        console.log("Database connection successful!");
      } catch (e) {
        console.error(`Connection attempt ${attempt} failed: ${e.message}`);

        if (attempt < MAX_RETRIES) {
          console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        } else {
          throw new Error(
            `Failed to connect to database after ${MAX_RETRIES} attempts: ${e.message}`
          );
        }
      }
    }

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
