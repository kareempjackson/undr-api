/**
 * Database Configuration Validation Script
 *
 * This script tests the database connection and validates that the application can:
 * 1. Connect to the database
 * 2. Access the users table
 * 3. Perform a test insert/delete to verify write permissions
 *
 * Use this script to troubleshoot database configuration issues.
 */

require("dotenv").config();
const { Client } = require("pg");

async function validateDatabaseConfig() {
  console.log("=== DATABASE CONFIGURATION VALIDATION ===");

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is not set");
    return false;
  }

  const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@]*@/, ":****@");
  console.log(`Using DATABASE_URL: ${maskedUrl}`);

  // Check for conflicting credentials
  const pgCredentials = ["POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB"];

  let hasConflicts = false;
  pgCredentials.forEach((cred) => {
    if (process.env[cred]) {
      console.log(
        `WARNING: ${cred} is set but will be ignored when DATABASE_URL is present`
      );
      hasConflicts = true;
    }
  });

  if (hasConflicts) {
    console.log(
      "RECOMMENDATION: Remove individual credentials and use only DATABASE_URL"
    );
  }

  // Connect to the database
  console.log("\nConnecting to database...");
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });

  try {
    await client.connect();
    console.log("✓ Successfully connected to database");

    // Check database structure
    console.log("\nChecking database structure...");

    // 1. Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log("✓ Users table exists");

      // 2. Check if we can query the users table
      try {
        const countResult = await client.query("SELECT COUNT(*) FROM users");
        console.log(
          `✓ Can query users table (${countResult.rows[0].count} users found)`
        );
      } catch (error) {
        console.error(`✗ Failed to query users table: ${error.message}`);
        return false;
      }

      // 3. Test write permissions with a test user
      try {
        console.log("\nTesting write permissions...");
        const testEmail = `test-${Date.now()}@example.com`;

        // Begin transaction
        await client.query("BEGIN");

        // Insert test user
        const insertResult = await client.query(
          "INSERT INTO users (email, role) VALUES ($1, $2) RETURNING id",
          [testEmail, "test"]
        );

        const testUserId = insertResult.rows[0].id;
        console.log(`✓ Successfully inserted test user with ID: ${testUserId}`);

        // Delete test user
        await client.query("DELETE FROM users WHERE id = $1", [testUserId]);
        console.log("✓ Successfully deleted test user");

        // Commit transaction
        await client.query("COMMIT");
        console.log("✓ Write permissions test passed");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        console.error(`✗ Write permissions test failed: ${error.message}`);
        return false;
      }
    } else {
      console.error(
        "✗ Users table does not exist. Migrations may not have run successfully."
      );

      // Check if we have any tables
      const allTablesCheck = await client.query(`
        SELECT COUNT(*) FROM information_schema.tables 
        WHERE table_schema = 'public';
      `);

      const tableCount = parseInt(allTablesCheck.rows[0].count, 10);
      console.log(`Found ${tableCount} tables in the database`);

      if (tableCount > 0) {
        console.log("Tables found in database:");
        const tablesResult = await client.query(`
          SELECT table_name FROM information_schema.tables 
          WHERE table_schema = 'public'
          ORDER BY table_name;
        `);

        tablesResult.rows.forEach((row) => {
          console.log(`- ${row.table_name}`);
        });
      } else {
        console.log(
          "The database appears to be empty. Migrations have not run."
        );
      }

      return false;
    }

    console.log("\n=== VALIDATION SUMMARY ===");
    console.log("✓ Database connection successful");
    console.log("✓ Users table exists and is accessible");
    console.log("✓ Write permissions confirmed");
    console.log("\nThe database configuration appears to be correct.");
    console.log("User login functionality should work properly.");

    return true;
  } catch (error) {
    console.error(`Failed to connect to database: ${error.message}`);

    if (error.message.includes("ECONNREFUSED")) {
      console.log("\nPossible causes:");
      console.log("1. The database server is not running");
      console.log("2. The connection URL is incorrect");
      console.log("3. There is a firewall blocking the connection");
    }

    return false;
  } finally {
    await client.end().catch(() => {});
  }
}

// Run validation
validateDatabaseConfig()
  .then((success) => {
    if (success) {
      console.log("\nDatabase validation PASSED");
    } else {
      console.log("\nDatabase validation FAILED - see errors above");
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("Unhandled error during validation:", error);
    process.exit(1);
  });
