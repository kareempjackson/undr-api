/**
 * Health Check Validation Script
 *
 * This script tests the health endpoints of the API to verify they're
 * functioning correctly. It's designed to help diagnose health check
 * failures in Railway deployments.
 *
 * Usage: node scripts/startup-health-test.js [port]
 */

const http = require("http");

// Default to port 3001 if not specified
const port = process.argv[2] || process.env.PORT || 3001;
const host = "localhost";

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
};

console.log(`${colors.blue}=== API HEALTH CHECK VALIDATION ===${colors.reset}`);
console.log(`Testing health endpoints on ${host}:${port}`);

// Function to make a GET request to a specific path
function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: "GET",
      timeout: 5000, // 5 second timeout
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        let parsedData;
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          parsedData = { rawResponse: data.substring(0, 500) }; // Truncate long responses
        }

        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsedData,
        });
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timed out"));
    });

    req.end();
  });
}

// Test the endpoints
async function runTests() {
  const endpoints = [
    "/", // Root path
    "/health", // Dedicated health endpoint
    "/api", // Swagger UI
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\n${colors.yellow}Testing ${endpoint}...${colors.reset}`);
      const response = await testEndpoint(endpoint);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        console.log(
          `${colors.green}✓ Success! Status code: ${response.statusCode}${colors.reset}`
        );
        console.log(`${colors.blue}Headers: ${colors.reset}`, response.headers);
        console.log(
          `${colors.blue}Response data: ${colors.reset}`,
          JSON.stringify(response.data, null, 2)
        );
      } else {
        console.log(
          `${colors.red}✗ Error! Status code: ${response.statusCode}${colors.reset}`
        );
        console.log(`${colors.blue}Headers: ${colors.reset}`, response.headers);
        console.log(
          `${colors.blue}Response data: ${colors.reset}`,
          JSON.stringify(response.data, null, 2)
        );
      }
    } catch (error) {
      console.log(
        `${colors.red}✗ Failed to connect: ${error.message}${colors.reset}`
      );
      if (error.code === "ECONNREFUSED") {
        console.log(
          `${colors.yellow}This likely means the API server is not running on port ${port}${colors.reset}`
        );
      }
    }
  }

  console.log(`\n${colors.blue}=== TEST COMPLETE ===${colors.reset}`);
}

// Execute the tests
runTests().catch((error) => {
  console.error(
    `${colors.red}Unhandled error: ${error.message}${colors.reset}`
  );
  process.exit(1);
});
