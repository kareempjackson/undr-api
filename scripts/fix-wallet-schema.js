/**
 * Fix Wallet Schema Script
 *
 * This script directly adds the missing chargebackBuffer column to the wallets table.
 * Use this as an emergency fix if the migrations are not being properly applied.
 */

require("dotenv").config();
const { Client } = require("pg");

async function fixWalletSchema() {
  console.log("=== FIX WALLET SCHEMA SCRIPT ===");

  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is not set");
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });

  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("Connected successfully");

    // Check if wallets table exists
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'wallets'
      );
    `);

    if (!tableExists.rows[0].exists) {
      console.error("ERROR: wallets table does not exist!");
      console.log(
        "The database schema may not be set up correctly. Run migrations first."
      );
      process.exit(1);
    }

    // Check if chargebackBuffer column exists
    const columnExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'wallets'
        AND column_name = 'chargebackBuffer'
      );
    `);

    if (columnExists.rows[0].exists) {
      console.log("chargebackBuffer column already exists in wallets table");
      return;
    }

    // Add the missing column
    console.log("Adding chargebackBuffer column to wallets table...");
    await client.query(`
      ALTER TABLE wallets
      ADD COLUMN IF NOT EXISTS "chargebackBuffer" boolean NOT NULL DEFAULT false;
    `);

    console.log(
      "✓ Successfully added chargebackBuffer column to wallets table"
    );

    // Verify the column was added
    const verifyColumn = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'wallets'
      AND column_name = 'chargebackBuffer';
    `);

    if (verifyColumn.rows.length > 0) {
      console.log("Column details:");
      console.log(`- Name: ${verifyColumn.rows[0].column_name}`);
      console.log(`- Type: ${verifyColumn.rows[0].data_type}`);
      console.log(`- Nullable: ${verifyColumn.rows[0].is_nullable}`);
      console.log(`- Default: ${verifyColumn.rows[0].column_default}`);
    }
  } catch (error) {
    console.error("Error fixing wallet schema:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the fix
fixWalletSchema()
  .then(() => {
    console.log("Schema fix complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
