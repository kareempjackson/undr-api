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

// Print current directory and paths to help with debugging
console.log(`Current working directory: ${process.cwd()}`);
const fs = require("fs");
const path = require("path");

// Check if dist/src/migrations exists
const migrationsPath = path.join(process.cwd(), "dist", "src", "migrations");
if (fs.existsSync(migrationsPath)) {
  console.log(`Found migrations directory at: ${migrationsPath}`);
  console.log("Migration files available:");
  fs.readdirSync(migrationsPath).forEach((file) => {
    console.log(`- ${file}`);
  });
} else {
  console.log(`No migrations directory found at: ${migrationsPath}`);
}

// Check if data-source.js exists
const dataSourcePaths = [
  path.join(process.cwd(), "dist", "src", "data-source.js"),
  path.join(process.cwd(), "dist", "data-source.js"),
];

let dataSourcePath;
for (const p of dataSourcePaths) {
  if (fs.existsSync(p)) {
    dataSourcePath = p;
    console.log(`Found data-source.js at: ${p}`);
    break;
  }
}

if (!dataSourcePath) {
  console.error("Could not find data-source.js in any expected location");
  console.log("Skipping migrations. The application will continue to start.");
  return;
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
      const dataSourceModule = require(dataSourcePath);
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

    // Log the database options for debugging
    console.log("DataSource configuration:");
    try {
      const options = { ...AppDataSource.options };
      if (options.password) options.password = "****"; // Mask password
      console.log(JSON.stringify(options, null, 2));
    } catch (e) {
      console.log("Could not stringify database options:", e.message);
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

      if (migrations.length === 0) {
        console.log(
          "No migrations to run - checking if database schema exists..."
        );

        // Try a simple query to check if the tables exist
        try {
          const queryRunner = AppDataSource.createQueryRunner();
          await queryRunner.connect();

          // Check if users table exists
          const result = await queryRunner.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'users'
            );
          `);

          const usersTableExists = result[0].exists;
          console.log(`Users table exists: ${usersTableExists}`);

          if (!usersTableExists) {
            console.log(
              "Users table doesn't exist, forcing initial migration..."
            );

            // Tables don't exist, force run the initial migration
            console.log("Attempting to run initial migration manually...");
            // Get list of migrations and run them in order
            const migrationFiles = fs
              .readdirSync(migrationsPath)
              .filter(
                (file) =>
                  file.endsWith(".js") &&
                  !file.endsWith(".d.ts") &&
                  !file.endsWith(".map")
              );

            console.log(`Found migration files: ${migrationFiles.join(", ")}`);

            for (const migration of migrationFiles) {
              try {
                const migrationPath = path.join(migrationsPath, migration);
                console.log(`Running migration: ${migration}`);
                // Load the migration
                const migrationModule = require(migrationPath);
                const migrationInstance = new migrationModule[
                  Object.keys(migrationModule)[0]
                ]();

                console.log("Executing up() method of migration");
                await migrationInstance.up(queryRunner);
                console.log(`Migration ${migration} completed successfully`);
              } catch (error) {
                console.error(
                  `Error running migration ${migration}: ${error.message}`
                );
              }
            }
          }

          await queryRunner.release();
        } catch (error) {
          console.error("Error checking database schema:", error.message);
        }
      }
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
