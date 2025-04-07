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
      console.error("DATABASE_URL environment variable is not set");
      console.log(
        "Skipping migrations. The application will continue to start."
      );
      return;
    }

    // Print diagnostic information
    console.log("Database connection info:");
    const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@]*@/, ":****@");
    console.log(`- URL: ${maskedUrl}`);
    console.log(`- SSL: ${useSSL ? "enabled" : "disabled"}`);
    console.log(`- NODE_ENV: ${process.env.NODE_ENV}`);

    // Use the compiled JavaScript files for migrations
    console.log("Loading AppDataSource from compiled JavaScript...");
    let AppDataSource;
    try {
      const dataSourceModule = require("../dist/src/data-source.js");
      AppDataSource = dataSourceModule.AppDataSource;
      if (!AppDataSource) {
        console.error("AppDataSource not found in data-source.js");
        console.log(
          "Skipping migrations. The application will continue to start."
        );
        return;
      }
    } catch (error) {
      console.error("Failed to load AppDataSource:", error.message);
      console.log(
        "Skipping migrations. The application will continue to start."
      );
      return;
    }

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
          console.error(
            `Failed to connect to database after ${MAX_RETRIES} attempts: ${e.message}`
          );
          console.log(
            "Skipping migrations. The application will continue to start."
          );
          return;
        }
      }
    }

    try {
      console.log("Running migrations...");
      const migrations = await AppDataSource.runMigrations();
      console.log(`Successfully ran ${migrations.length} migrations`);
    } catch (migrationError) {
      console.error("Error running migrations:", migrationError.message);
      console.log(
        "The application will continue to start despite migration failure."
      );
    } finally {
      // Always close the connection
      if (connected) {
        console.log("Closing database connection...");
        try {
          await AppDataSource.destroy();
        } catch (error) {
          console.error("Error closing database connection:", error.message);
        }
      }
    }

    console.log("Migration process completed!");
  } catch (error) {
    console.error("Error in migration process:", error);
    console.log(
      "The application will continue to start despite migration errors."
    );
  }
}

// Run migrations but don't exit process on error
runMigrations().catch((error) => {
  console.error("Unhandled error in migration script:", error);
  console.log(
    "The application will continue to start despite migration errors."
  );
});
