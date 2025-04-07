const { resolve } = require("path");
const dotenv = require("dotenv");

// Load test environment variables
dotenv.config({ path: resolve(__dirname, "../.env.test") });

// Extend Jest timeout for API tests
jest.setTimeout(30000);

// Suppress console output during tests to keep the output clean
// Comment this out if you want to see console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global beforeAll and afterAll hooks
beforeAll(async () => {
  // Global setup before all tests if needed
  console.log("Starting API test suite");
});

afterAll(async () => {
  // Global cleanup after all tests
  console.log("Completed API test suite");
});
