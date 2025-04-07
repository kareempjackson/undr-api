/**
 * Simple Express server for health checks
 * Railway will use this to verify the application is running
 */

const http = require("http");

const server = http.createServer((req, res) => {
  // Only respond to GET requests
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  // Health check endpoint
  if (req.url === "/") {
    console.log("[Healthcheck] Health check request received");
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("OK");
    return;
  }

  // Route not found
  res.statusCode = 404;
  res.end("Not Found");
});

// Listen on a different port to avoid conflicts
const HEALTH_PORT = 3001;
server.listen(HEALTH_PORT, "0.0.0.0", () => {
  console.log(`[Healthcheck] Server running on port ${HEALTH_PORT}`);
});

// Handle server errors
server.on("error", (err) => {
  console.error("[Healthcheck] Server error:", err);
});
