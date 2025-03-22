/**
 * Script to set up development accounts with proper wallet balances
 * Run with: node scripts/setup-dev-accounts.js
 */

const { Client } = require("pg");

async function main() {
  // Create a new client
  const client = new Client({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "F@stskin101",
    database: "ghostpay",
  });

  try {
    await client.connect();
    console.log("Connected to database");

    // Standard dev accounts we want to set up
    const devAccounts = [
      {
        email: "devfan@example.com",
        name: "Dev Fan",
        role: "FAN",
        balance: 100.0,
      },
      {
        email: "devcreator@example.com",
        name: "Dev Creator",
        role: "CREATOR",
        balance: 500.0,
      },
      {
        email: "devagency@example.com",
        name: "Dev Agency",
        role: "AGENCY",
        balance: 1000.0,
      },
      {
        email: "devadmin@example.com",
        name: "Dev Admin",
        role: "ADMIN",
        balance: 5000.0,
      },
    ];

    // Process each account
    for (const account of devAccounts) {
      console.log(`Setting up ${account.role} account: ${account.email}`);

      // First check if the user exists
      const userResult = await client.query(
        `SELECT id FROM users WHERE email = $1`,
        [account.email]
      );

      let userId;

      if (userResult.rows.length === 0) {
        // Create the user if they don't exist
        console.log(`Creating new user: ${account.email}`);
        const newUser = await client.query(
          `INSERT INTO users (email, name, role, status, "emailVerified", "createdAt", "updatedAt") 
           VALUES ($1, $2, $3, 'ACTIVE', true, NOW(), NOW()) 
           RETURNING id`,
          [account.email, account.name, account.role]
        );
        userId = newUser.rows[0].id;
      } else {
        // User exists, update their info
        userId = userResult.rows[0].id;
        console.log(`Updating existing user: ${account.email} (ID: ${userId})`);
        await client.query(
          `UPDATE users SET name = $1, role = $2, status = 'ACTIVE', "emailVerified" = true WHERE id = $3`,
          [account.name, account.role, userId]
        );
      }

      // Check if wallet exists for this user
      const walletResult = await client.query(
        `SELECT id FROM wallets WHERE "userId" = $1`,
        [userId]
      );

      if (walletResult.rows.length === 0) {
        // Create wallet if it doesn't exist
        console.log(
          `Creating wallet for user: ${account.email} with balance: $${account.balance}`
        );
        await client.query(
          `INSERT INTO wallets ("userId", balance, currency, "createdAt", "updatedAt") 
           VALUES ($1, $2, 'USD', NOW(), NOW())`,
          [userId, account.balance]
        );
      } else {
        // Update existing wallet
        const walletId = walletResult.rows[0].id;
        console.log(
          `Updating wallet for user: ${account.email} with balance: $${account.balance}`
        );
        await client.query(
          `UPDATE wallets SET balance = $1, "updatedAt" = NOW() WHERE id = $2`,
          [account.balance, walletId]
        );
      }

      console.log(
        `Successfully set up ${account.role} account: ${account.email}\n`
      );
    }

    console.log("All development accounts updated successfully");
  } catch (error) {
    console.error("Error setting up dev accounts:", error);
  } finally {
    await client.end();
    console.log("Disconnected from database");
  }
}

main();
