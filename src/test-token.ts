import * as jwt from "jsonwebtoken";

// This is for testing purposes only
const generateToken = () => {
  // Create a payload for a test user
  const payload = {
    userId: "1234-5678-9012-3456", // Replace with an actual user ID from your database
    email: "test@example.com",
    role: "CREATOR", // Change to test different roles
    sub: "1234-5678-9012-3456",
  };

  // Use the same secret as in your JWT strategy
  const secret = process.env.JWT_SECRET || "test-secret-for-development";

  // Generate and return the token
  return jwt.sign(payload, secret, { expiresIn: "1h" });
};

const token = generateToken();
console.log("Test token:");
console.log(token);
