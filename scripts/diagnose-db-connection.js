/**
 * Script to diagnose database connection issues
 * Run with: node scripts/diagnose-db-connection.js
 */

// Load environment variables
require("dotenv").config();

// Use the pg library directly to test connection
const { Client } = require("pg");

// Force NODE_ENV to production for testing
process.env.NODE_ENV = "production";

async function testDatabaseConnection() {
  console.log("===== DATABASE CONNECTION DIAGNOSTIC =====");
  console.log(`Environment: ${process.env.NODE_ENV}`);

  // Check for DATABASE_URL
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is not set!");
    console.log("Please set DATABASE_URL environment variable.");
    process.exit(1);
  }

  // Mask password for logging
  const maskedUrl = process.env.DATABASE_URL.replace(/:[^:@]*@/, ":****@");
  console.log(`Attempting to connect to: ${maskedUrl}`);

  // Parse the connection string to get host information
  try {
    // Extract host from DATABASE_URL
    const urlMatch = process.env.DATABASE_URL.match(
      /postgresql:\/\/[^:]+:[^@]+@([^:]+):(\d+)\/(.+)/
    );
    if (urlMatch) {
      const [, host, port, database] = urlMatch;
      console.log(`Parsed connection details:`);
      console.log(`- Host: ${host}`);
      console.log(`- Port: ${port}`);
      console.log(`- Database: ${database}`);

      // Test if host is resolvable
      const dns = require("dns");
      dns.lookup(host, (err, address) => {
        if (err) {
          console.error(`ERROR: Cannot resolve host "${host}": ${err.message}`);
        } else {
          console.log(`Host "${host}" resolves to IP: ${address}`);
        }
      });
    }
  } catch (err) {
    console.log(`Could not parse connection URL: ${err.message}`);
  }

  // Test connection with SSL enabled
  try {
    console.log("\nAttempting connection WITH SSL...");
    const clientWithSsl = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    await clientWithSsl.connect();
    console.log("✅ Connection WITH SSL successful!");

    // Check version to verify connection
    const res = await clientWithSsl.query("SELECT version()");
    console.log(`Connected to: ${res.rows[0].version}`);

    await clientWithSsl.end();
  } catch (err) {
    console.error(`❌ Connection WITH SSL failed: ${err.message}`);
  }

  // Test connection with SSL disabled
  try {
    console.log("\nAttempting connection WITHOUT SSL...");
    const clientNoSsl = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: false,
    });

    await clientNoSsl.connect();
    console.log("✅ Connection WITHOUT SSL successful!");

    // Check version to verify connection
    const res = await clientNoSsl.query("SELECT version()");
    console.log(`Connected to: ${res.rows[0].version}`);

    await clientNoSsl.end();
  } catch (err) {
    console.error(`❌ Connection WITHOUT SSL failed: ${err.message}`);
  }

  console.log("\n===== DIAGNOSTIC COMPLETE =====");
}

testDatabaseConnection().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
