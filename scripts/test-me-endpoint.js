/**
 * Script to test the /auth/me endpoint and log response structure
 *
 * Run with: node scripts/test-me-endpoint.js
 */

const axios = require("axios");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");

// Load environment variables
dotenv.config();

// Create a test JWT token
const createTestToken = () => {
  // Create a test user ID
  const userId = "test-user-id";

  // Sign with the JWT_SECRET from .env
  const secret =
    process.env.JWT_SECRET || "superlongrandomsecretforgeneratingjwttokens";

  // Create token with userId in payload
  return jwt.sign({ userId }, secret, { expiresIn: "1h" });
};

// Make a request to the /auth/me endpoint
async function testMeEndpoint() {
  try {
    // Generate a test token
    const token = createTestToken();
    console.log("Test token generated:", token.substring(0, 20) + "...");

    // Make the request
    console.log("Making request to /auth/me...");
    const response = await axios.get("http://localhost:3001/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Log the response
    console.log("\nResponse status:", response.status);
    console.log("\nResponse data structure:");
    console.log(JSON.stringify(response.data, null, 2));

    // Check for wallet structure specifically
    console.log("\nWallet structure:");
    if (response.data.wallet) {
      console.log("wallet property exists at root level:");
      console.log(JSON.stringify(response.data.wallet, null, 2));
    } else if (response.data.balance !== undefined) {
      console.log(
        "balance property exists at root level:",
        response.data.balance
      );
    } else {
      console.log("Neither wallet nor balance properties found at root level");
    }

    // Verify what the frontend expects vs what the backend provides
    console.log("\nFrontend expectation check:");
    console.log(
      `user?.wallet?.balance exists: ${
        response.data?.wallet?.balance !== undefined
      }`
    );
    console.log(
      `direct balance exists: ${response.data?.balance !== undefined}`
    );
  } catch (error) {
    console.error("Error testing /auth/me endpoint:");
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

// Run the test
testMeEndpoint();
