import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import * as crypto from "crypto";
import { ConfigService } from "@nestjs/config";

// Add an interface to extend Express Request to include our custom properties
declare global {
  namespace Express {
    interface Request {
      clientRegion?: string;
      maskedIp?: string;
      rawIp?: string;
    }
  }
}

@Injectable()
export class IpMaskingMiddleware implements NestMiddleware {
  private readonly salt: string;
  private readonly storeFullIpForAdmins: boolean;

  constructor(private configService: ConfigService) {
    // Retrieve salt from environment variables or generate a random one
    this.salt =
      this.configService.get<string>("IP_MASK_SALT") ||
      crypto.randomBytes(16).toString("hex");

    // Determine if we should store full IPs for admin routes
    this.storeFullIpForAdmins =
      this.configService.get<string>("STORE_FULL_IP_FOR_ADMINS") === "true";
  }

  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.socket.remoteAddress || "unknown";

    // Store the original IP temporarily for potential admin use
    req.rawIp = ip;

    // Hash the IP with salt for privacy
    const maskedIp = this.hashIp(ip);
    req.maskedIp = maskedIp;

    // Extract region information (in a real implementation,
    // you might want to use a geolocation service here)
    req.clientRegion = this.extractRegion(ip);

    // For non-admin routes, completely remove the raw IP
    const isAdminRoute = req.path.startsWith("/admin");
    if (!isAdminRoute || !this.storeFullIpForAdmins) {
      delete req.rawIp;
    }

    next();
  }

  private hashIp(ip: string): string {
    return crypto
      .createHash("sha256")
      .update(`${ip}${this.salt}`)
      .digest("hex");
  }

  private extractRegion(ip: string): string {
    // This is a placeholder - in a real implementation,
    // you would use a geolocation service (MaxMind, ipinfo.io, etc.)
    // to convert the IP to a region code

    // For example:
    // const region = geoipService.getRegion(ip);

    // For now, returning a placeholder
    return "UNKNOWN_REGION";
  }
}
