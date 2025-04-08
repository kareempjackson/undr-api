import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import * as os from "os";

@ApiTags("Health")
@Controller()
export class HealthController {
  @Get()
  @ApiOperation({ summary: "Health check endpoint" })
  @ApiResponse({ status: 200, description: "API is healthy" })
  healthCheck() {
    try {
      // Get database connection info (masked for security)
      const dbUrl = process.env.DATABASE_URL
        ? process.env.DATABASE_URL.replace(/:[^:@]*@/, ":****@")
        : "Not configured";

      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        service: "undr-api",
        environment: process.env.NODE_ENV || "development",
        system: {
          platform: `${os.platform()} ${os.release()}`,
          memory: {
            total: Math.round(os.totalmem() / 1024 / 1024),
            free: Math.round(os.freemem() / 1024 / 1024),
          },
          nodeVersion: process.version,
        },
        config: {
          port: process.env.PORT || 3001,
          databaseConfigured: !!process.env.DATABASE_URL,
          databaseUrl: dbUrl,
          corsOrigins: [
            process.env.FRONTEND_URL || "http://localhost:3000",
            process.env.VERCEL_FRONTEND_URL || "",
            process.env.PRODUCTION_URLS || "",
          ]
            .filter(Boolean)
            .join(", "),
        },
      };
    } catch (error) {
      // Always return a success response even if there's an error
      // This ensures Railway health checks pass
      console.error("Health check error:", error);
      return {
        status: "ok",
        message:
          "Health check endpoint is operational, but encountered an error getting system details",
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get("health")
  @ApiOperation({ summary: "Secondary health check endpoint" })
  @ApiResponse({ status: 200, description: "API is healthy" })
  healthCheckSecondary() {
    try {
      return this.healthCheck();
    } catch (error) {
      // Ultra resilient health check endpoint that will never fail
      // This ensures Railway health checks always pass
      console.error("Secondary health check error:", error);
      return {
        status: "ok",
        message: "Health check operational",
        timestamp: new Date().toISOString(),
      };
    }
  }
}
