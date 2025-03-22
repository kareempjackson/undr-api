import { ConfigService } from "@nestjs/config";
export declare enum ProxyAction {
    ALLOW = "allow",
    FLAG = "flag",
    CHALLENGE = "challenge",
    BLOCK = "block"
}
export interface ProxyDetectionResult {
    isProxy: boolean;
    confidence: number;
    action: ProxyAction;
    region: string;
    details?: any;
}
export declare class ProxyDetectionService {
    private configService;
    private readonly logger;
    private readonly apiKey;
    private readonly defaultAction;
    private readonly proxyThreshold;
    constructor(configService: ConfigService);
    detectProxy(ipAddress: string, endpoint: string): Promise<ProxyDetectionResult>;
    private determineAction;
    private mockProxyCheck;
    private createDefaultResult;
    private parseProxyAction;
    private extractRegionFromIp;
}
