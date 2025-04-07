import { Controller, Get, HttpCode } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";

@ApiTags("Health")
@Controller()
export class HealthController {
  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: "Root health check endpoint" })
  @ApiResponse({ status: 200, description: "API is reachable" })
  root() {
    // Super simple response for Railway healthcheck
    return "OK";
  }

  @Get("health")
  @HttpCode(200)
  @ApiOperation({ summary: "Detailed health check endpoint" })
  @ApiResponse({ status: 200, description: "API is healthy" })
  healthCheck() {
    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "undr-api",
      environment: process.env.NODE_ENV || "development",
    };
  }
}
