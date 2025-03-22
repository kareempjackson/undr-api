import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import {
  ProxyDetectionService,
  ProxyAction,
} from "../../security/proxy-detection.service";

// Define the interface for privacy options
interface PrivacyOptions {
  storeNoIpData?: boolean;
  detectProxy?: boolean;
  proxyHandling?: "allow" | "flag" | "challenge" | "block";
  regionOnly?: boolean;
}

@Injectable()
export class PrivacyCriticalGuard implements CanActivate {
  private readonly logger = new Logger(PrivacyCriticalGuard.name);

  constructor(
    private reflector: Reflector,
    private proxyDetectionService: ProxyDetectionService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if the endpoint is marked as privacy-critical
    const privacyOptions = this.reflector.get<PrivacyOptions>(
      "privacy-critical",
      context.getHandler()
    );

    // If not marked, allow the request to proceed
    if (!privacyOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const endpoint = request.url;

    // Apply enhanced privacy settings for critical endpoints
    if (privacyOptions.storeNoIpData) {
      // Clear all IP-related data for maximum privacy
      delete request.rawIp;
      delete request.maskedIp;
      request.clientRegion = "REDACTED";
    } else if (privacyOptions.regionOnly) {
      // Store only region info, not even hashed IP
      delete request.maskedIp;
      delete request.rawIp;
    }

    // If proxy detection is enabled for this endpoint
    if (privacyOptions.detectProxy) {
      const ip =
        request.rawIp ||
        request.ip ||
        request.socket.remoteAddress ||
        "unknown";

      try {
        const proxyResult = await this.proxyDetectionService.detectProxy(
          ip,
          endpoint
        );

        // Attach proxy detection results to the request for logging/later use
        request.proxyDetection = proxyResult;

        // Handle the request based on the configured proxy handling option
        const proxyHandling = privacyOptions.proxyHandling || "flag";

        if (proxyResult.isProxy && proxyResult.confidence > 75) {
          switch (proxyHandling) {
            case "block":
              this.logger.warn(
                `Blocked proxy access to ${endpoint} from ${proxyResult.region}`
              );
              return false;

            case "challenge":
              // In a real implementation, you would redirect to a challenge page
              // or trigger additional verification
              this.logger.warn(
                `Proxy access to ${endpoint} requires verification`
              );
              // For now, we'll let it through but in a real app you might:
              // - Add verification steps
              // - Redirect to a challenge page
              // - Require additional authentication
              break;

            case "flag":
              // Allow but log for review
              this.logger.warn(
                `Flagged proxy access to ${endpoint} from ${proxyResult.region}`
              );
              break;

            case "allow":
            default:
              // Allow normally
              break;
          }
        }
      } catch (error) {
        this.logger.error(`Error in proxy detection: ${error.message}`);
        // On error, proceed with caution
      }
    }

    // Allow the request to proceed
    return true;
  }
}
