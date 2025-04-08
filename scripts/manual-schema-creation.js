/**
 * Manual Schema Creation Script
 *
 * This script manually creates the essential database tables if migrations fail.
 * It's a last-resort fallback to ensure the application can start and operate.
 */

// Load environment variables
require("dotenv").config();
const { Client } = require("pg");

// Create a database client
async function createSchema() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL environment variable is not set");
    process.exit(1);
  }

  console.log("=== MANUAL SCHEMA CREATION ===");
  console.log("Connecting to the database...");

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });

  try {
    await client.connect();
    console.log("Connected to the database successfully");

    // Check if the users table already exists
    const checkTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);

    if (checkTableResult.rows[0].exists) {
      console.log(
        "Users table already exists - schema is likely already created"
      );
      client.end();
      return;
    }

    console.log("Creating essential database tables...");

    // Create extension for UUID generation
    await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');

    // Start a transaction
    await client.query("BEGIN");

    // Create basic tables needed for authentication
    // 1. Users table
    await client.query(`
      CREATE TABLE "users" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL UNIQUE,
        "emailVerified" boolean NOT NULL DEFAULT false,
        "isOnboarded" boolean NOT NULL DEFAULT false,
        "role" character varying NOT NULL DEFAULT 'user',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "lastLoginAt" TIMESTAMP,
        "status" character varying NOT NULL DEFAULT 'active'
      );
    `);
    console.log("Created users table");

    // 2. User magic links table
    await client.query(`
      CREATE TABLE "magic_links" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "token" character varying NOT NULL UNIQUE,
        "expiresAt" TIMESTAMP NOT NULL,
        "usedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_magic_links_users" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    console.log("Created magic_links table");

    // 3. Create creators table
    await client.query(`
      CREATE TABLE "creators" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL UNIQUE,
        "displayName" character varying,
        "bio" text,
        "avatarUrl" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "stripeAccountId" character varying,
        "walletAddress" character varying,
        CONSTRAINT "FK_creators_users" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    console.log("Created creators table");

    // 4. Create fans table
    await client.query(`
      CREATE TABLE "fans" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL UNIQUE,
        "displayName" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "walletAddress" character varying,
        CONSTRAINT "FK_fans_users" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
      );
    `);
    console.log("Created fans table");

    // Commit the transaction
    await client.query("COMMIT");
    console.log("Schema creation completed successfully!");
  } catch (error) {
    console.error("Error creating schema:", error.message);
    // Roll back on error
    try {
      await client.query("ROLLBACK");
      console.log("Transaction rolled back");
    } catch (rollbackError) {
      console.error("Error rolling back transaction:", rollbackError.message);
    }
  } finally {
    client.end();
  }
}

// Run the function
createSchema().catch((error) => {
  console.error("Unhandled error in schema creation:", error);
  process.exit(1);
});
