/**
 * Database Connection Diagnostic Script
 *
 * This script tests database connections for the UNDR API in production environment.
 * It checks the DATABASE_URL configuration and attempts to connect to verify settings.
 *
 * Usage: NODE_ENV=production node scripts/diagnose-db-connection.js
 *
 * Set SKIP_DB_CHECK=true to bypass database connectivity checks (useful for debugging)
 */

// Force production environment for testing
process.env.NODE_ENV = "production";

// Load environment variables
require("dotenv").config();
const { Client } = require("pg");
const dns = require("dns").promises;

// Main diagnostic function
async function testDatabaseConnection() {
  console.log("=== DATABASE CONNECTION DIAGNOSTIC ===");
  console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

  // Allow bypassing database checks for debugging
  if (process.env.SKIP_DB_CHECK === "true") {
    console.log(
      "SKIP_DB_CHECK is set to true, bypassing database connectivity checks"
    );
    console.log(
      "Application will continue startup even if database is not available"
    );
    console.log("\n=== DIAGNOSTIC COMPLETE ===");
    return true;
  }

  // Check if DATABASE_URL exists
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL environment variable is not set!");
    console.error("This is required for production database connections.");
    console.log("The application will attempt to start anyway, but may fail.");
    console.log("\n=== DIAGNOSTIC COMPLETE ===");
    return false;
  }

  // Mask password in logs
  const dbUrlForLogs = process.env.DATABASE_URL.replace(
    /postgresql:\/\/([^:]+):([^@]+)@/,
    "postgresql://$1:******@"
  );
  console.log(`DATABASE_URL is set: ${dbUrlForLogs}`);

  // Parse connection URL to get components
  let connectionInfo;
  try {
    // Extract connection parts from URL
    const matches = process.env.DATABASE_URL.match(
      /postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/
    );
    if (!matches) {
      console.error(
        "ERROR: Unable to parse DATABASE_URL. Format should be: postgresql://username:password@host:port/database"
      );
      console.log("The application will attempt to start anyway.");
      console.log("\n=== DIAGNOSTIC COMPLETE ===");
      return false;
    }

    connectionInfo = {
      user: matches[1],
      password: matches[2],
      host: matches[3],
      port: parseInt(matches[4], 10),
      database: matches[5].split("?")[0], // Remove query params if any
    };

    console.log("Parsed connection info:");
    console.log(`- Host: ${connectionInfo.host}`);
    console.log(`- Port: ${connectionInfo.port}`);
    console.log(`- Database: ${connectionInfo.database}`);

    // Resolve hostname
    try {
      console.log(`\nResolving host DNS for ${connectionInfo.host}...`);
      const addresses = await dns.lookup(connectionInfo.host, { all: true });
      console.log("DNS resolution results:");
      addresses.forEach((addr) => {
        console.log(
          `- ${addr.address} (${addr.family === 4 ? "IPv4" : "IPv6"})`
        );
      });

      // Log warning for localhost
      if (
        connectionInfo.host === "localhost" ||
        connectionInfo.host === "127.0.0.1" ||
        connectionInfo.host === "::1" ||
        addresses.some((a) => a.address === "127.0.0.1" || a.address === "::1")
      ) {
        console.error(
          "\nWARNING: Database host resolves to localhost/127.0.0.1/::1"
        );
        console.error(
          "This will NOT work in production environments like Railway!"
        );
        console.error(
          "Make sure DATABASE_URL points to a remote database host."
        );
      }
    } catch (dnsError) {
      console.error(`ERROR resolving DNS: ${dnsError.message}`);
      // Continue anyway, this is just a diagnostic
    }
  } catch (error) {
    console.error(`ERROR parsing DATABASE_URL: ${error.message}`);
    console.log("The application will attempt to start anyway.");
    console.log("\n=== DIAGNOSTIC COMPLETE ===");
    return false;
  }

  // Try to connect with SSL enabled
  console.log("\nAttempting connection WITH SSL...");
  let sslConnectionSucceeded = false;
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
      connectionTimeoutMillis: 10000, // 10 seconds
    });

    await client.connect();
    const result = await client.query("SELECT version()");
    console.log("CONNECTION SUCCESSFUL (SSL)!");
    console.log(`Database version: ${result.rows[0].version}`);
    await client.end();
    sslConnectionSucceeded = true;
  } catch (error) {
    console.error(`ERROR connecting with SSL: ${error.message}`);
    console.log(
      "SSL connection failed. This might be expected if SSL is not enabled on the database."
    );
    // Continue to try without SSL
  }

  // If SSL connection worked, we can skip non-SSL attempt
  if (!sslConnectionSucceeded) {
    // Try to connect without SSL
    console.log("\nAttempting connection WITHOUT SSL...");
    try {
      const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: false,
        connectionTimeoutMillis: 10000, // 10 seconds
      });

      await client.connect();
      const result = await client.query("SELECT version()");
      console.log("CONNECTION SUCCESSFUL (no SSL)!");
      console.log(`Database version: ${result.rows[0].version}`);
      await client.end();
    } catch (error) {
      console.error(`ERROR connecting without SSL: ${error.message}`);

      if (error.message.includes("ECONNREFUSED")) {
        console.error("\nECONNREFUSED ERROR DETECTED:");
        console.error(
          "This usually means the application cannot reach the database host."
        );
        console.error("Possible causes:");
        console.error("1. The database service is not running");
        console.error("2. The host address is incorrect");
        console.error("3. There is a network/firewall issue");
        console.error(
          "4. The PostgreSQL service is not listening on the specified port"
        );

        if (
          connectionInfo.host === "localhost" ||
          connectionInfo.host === "127.0.0.1" ||
          connectionInfo.host === "::1"
        ) {
          console.error(
            "\nYou're trying to connect to localhost in a containerized environment!"
          );
          console.error(
            "This won't work in Railway or similar platforms - you need to update"
          );
          console.error(
            "your DATABASE_URL to point to an actual PostgreSQL server accessible"
          );
          console.error("from the internet or your private network.");
        }
      }

      console.log(
        "\nWARNING: Unable to connect to database, but will continue startup process."
      );
      console.log(
        "Set SKIP_DB_CHECK=true in environment variables to bypass this check in the future."
      );
    }
  }

  // Final check of TypeORM environment variables
  console.log("\nChecking for conflicting TypeORM configuration:");
  const typeormVars = [
    "TYPEORM_HOST",
    "TYPEORM_PORT",
    "TYPEORM_USERNAME",
    "TYPEORM_PASSWORD",
    "TYPEORM_DATABASE",
    "DB_HOST",
    "DB_PORT",
    "DB_USERNAME",
    "DB_PASSWORD",
    "DB_DATABASE",
    "POSTGRES_HOST",
    "POSTGRES_PORT",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "POSTGRES_DB",
    "DATABASE_HOST",
    "DATABASE_PORT",
    "DATABASE_USERNAME",
    "DATABASE_PASSWORD",
    "DATABASE_DATABASE",
  ];

  let hasConflictingVars = false;
  typeormVars.forEach((varName) => {
    if (process.env[varName]) {
      console.error(
        `WARNING: Found potentially conflicting variable: ${varName}=${process.env[varName]}`
      );
      hasConflictingVars = true;
    }
  });

  if (!hasConflictingVars) {
    console.log("No conflicting TypeORM environment variables found.");
  } else {
    console.log(
      "\nIMPORTANT: Railway provides a DATABASE_URL environment variable that includes all database connection information."
    );
    console.log(
      "When DATABASE_URL is present, individual connection parameters like POSTGRES_USER, POSTGRES_PASSWORD, etc."
    );
    console.log("are ignored by your application, but may cause confusion.");

    console.log(
      "\nRECOMMENDATION: Since you're using DATABASE_URL, you should remove these variables in Railway:"
    );
    typeormVars.forEach((varName) => {
      if (process.env[varName]) {
        console.log(`- ${varName}`);
      }
    });
  }

  console.log("\n=== DIAGNOSTIC COMPLETE ===");
  // Return true to allow the application to continue even with db connection issues
  return true;
}

// Run the diagnostic and continue regardless of outcome
testDatabaseConnection()
  .catch((error) => {
    console.error("Unhandled error in diagnostic:", error);
    console.log(
      "Continuing with application startup despite diagnostic error."
    );
  })
  .finally(() => {
    console.log("Continuing with application startup...");
  });
