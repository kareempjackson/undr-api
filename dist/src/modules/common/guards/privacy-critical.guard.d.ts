import { CanActivate, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ProxyDetectionService } from "../../security/proxy-detection.service";
export declare class PrivacyCriticalGuard implements CanActivate {
    private reflector;
    private proxyDetectionService;
    private readonly logger;
    constructor(reflector: Reflector, proxyDetectionService: ProxyDetectionService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
