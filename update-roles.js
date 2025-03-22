/**
 * Script to update the roles of development accounts
 * Run with: node update-roles.js
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

    // Update devcreator@example.com to CREATOR role
    const updateCreator = await client.query(
      `UPDATE users SET role = 'CREATOR', name = 'Dev Creator', status = 'ACTIVE' WHERE email = 'devcreator@example.com'`
    );
    console.log(`Updated creator: ${updateCreator.rowCount} row(s)`);

    // Update devagency@example.com to AGENCY role
    const updateAgency = await client.query(
      `UPDATE users SET role = 'AGENCY', name = 'Dev Agency', status = 'ACTIVE' WHERE email = 'devagency@example.com'`
    );
    console.log(`Updated agency: ${updateAgency.rowCount} row(s)`);

    // Update devadmin@example.com to ADMIN role
    const updateAdmin = await client.query(
      `UPDATE users SET role = 'ADMIN', name = 'Dev Admin', status = 'ACTIVE' WHERE email = 'devadmin@example.com'`
    );
    console.log(`Updated admin: ${updateAdmin.rowCount} row(s)`);

    // Update devfan@example.com to have a name and be active
    const updateFan = await client.query(
      `UPDATE users SET name = 'Dev Fan', status = 'ACTIVE', "emailVerified" = true WHERE email = 'devfan@example.com'`
    );
    console.log(`Updated fan: ${updateFan.rowCount} row(s)`);

    // Also set emailVerified for all accounts
    const updateEmailVerified = await client.query(
      `UPDATE users SET "emailVerified" = true WHERE email IN ('devcreator@example.com', 'devagency@example.com', 'devadmin@example.com')`
    );
    console.log(
      `Updated email verification: ${updateEmailVerified.rowCount} row(s)`
    );

    console.log("All development accounts updated successfully");
  } catch (error) {
    console.error("Error updating roles:", error);
  } finally {
    await client.end();
    console.log("Disconnected from database");
  }
}

main();
