/**
 * Simple Express server for testing CORS configuration
 * This server responds to ALL origins and can be used for debugging CORS issues
 *
 * Usage: node scripts/cors-test-server.js
 */

const http = require("http");

const server = http.createServer((req, res) => {
  // Log request details
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log("Headers:", JSON.stringify(req.headers, null, 2));

  // Set CORS headers to allow all origins
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Root endpoint for health checks
  if (req.url === "/" && req.method === "GET") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("OK");
    return;
  }

  // Auth login endpoint
  if (req.url === "/auth/login" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      console.log("Received login request with body:", body);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          message: "Mock login successful",
          token: "mock-token-for-testing",
        })
      );
    });
    return;
  }

  // Auth signup endpoint
  if (req.url === "/auth/signup" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      console.log("Received signup request with body:", body);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          message: "Mock signup successful",
          user: { id: "mock-user-id" },
        })
      );
    });
    return;
  }

  // Unknown endpoint
  res.statusCode = 404;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ error: "Not Found" }));
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`CORS test server running on port ${PORT}`);
  console.log(
    "This server accepts connections from all origins for testing purposes"
  );
  console.log("Available endpoints:");
  console.log("- GET / - Health check");
  console.log("- POST /auth/login - Mock login endpoint");
  console.log("- POST /auth/signup - Mock signup endpoint");
});

server.on("error", (err) => {
  console.error("Server error:", err);
});
