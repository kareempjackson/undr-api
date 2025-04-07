import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("Health")
@Controller()
export class HealthController {
  @Get()
  @ApiOperation({ summary: "Health check endpoint" })
  @ApiResponse({ status: 200, description: "API is healthy" })
  healthCheck() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "undr-api",
      environment: process.env.NODE_ENV || "development",
    };
  }

  @Get("health")
  @ApiOperation({ summary: "Secondary health check endpoint" })
  @ApiResponse({ status: 200, description: "API is healthy" })
  healthCheckSecondary() {
    return this.healthCheck();
  }
}
