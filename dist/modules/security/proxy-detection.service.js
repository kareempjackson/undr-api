"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ProxyDetectionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxyDetectionService = exports.ProxyAction = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
var ProxyAction;
(function (ProxyAction) {
    ProxyAction["ALLOW"] = "allow";
    ProxyAction["FLAG"] = "flag";
    ProxyAction["CHALLENGE"] = "challenge";
    ProxyAction["BLOCK"] = "block";
})(ProxyAction = exports.ProxyAction || (exports.ProxyAction = {}));
let ProxyDetectionService = ProxyDetectionService_1 = class ProxyDetectionService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(ProxyDetectionService_1.name);
        this.apiKey = this.configService.get("PROXY_DETECTION_API_KEY", "");
        this.defaultAction = this.parseProxyAction(this.configService.get("PROXY_DEFAULT_ACTION", "flag"));
        this.proxyThreshold = Number(this.configService.get("PROXY_THRESHOLD", "75"));
    }
    async detectProxy(ipAddress, endpoint) {
        try {
            if (!this.apiKey) {
                this.logger.warn("Proxy detection skipped: No API key configured");
                return this.createDefaultResult(ipAddress);
            }
            const result = await this.mockProxyCheck(ipAddress, endpoint);
            const action = this.determineAction(result.isProxy, result.confidence, endpoint);
            return Object.assign(Object.assign({}, result), { action });
        }
        catch (error) {
            this.logger.error(`Proxy detection error: ${error.message}`);
            return {
                isProxy: false,
                confidence: 0,
                action: ProxyAction.FLAG,
                region: "unknown",
                details: { error: error.message },
            };
        }
    }
    determineAction(isProxy, confidence, endpoint) {
        if (!isProxy || confidence < this.proxyThreshold) {
            return ProxyAction.ALLOW;
        }
        const criticalEndpoints = [
            "/payments",
            "/security/verification",
            "/auth/admin",
        ];
        const isCriticalEndpoint = criticalEndpoints.some((e) => endpoint.startsWith(e));
        if (isCriticalEndpoint) {
            return confidence > 90 ? ProxyAction.CHALLENGE : ProxyAction.FLAG;
        }
        return this.defaultAction;
    }
    mockProxyCheck(ipAddress, endpoint) {
        return new Promise((resolve) => {
            setTimeout(() => {
                const result = {
                    isProxy: false,
                    confidence: 0,
                    action: ProxyAction.ALLOW,
                    region: "US",
                    details: {},
                };
                if (ipAddress.startsWith("192.168.") || ipAddress === "127.0.0.1") {
                    result.isProxy = false;
                    result.confidence = 0;
                }
                else if (ipAddress.startsWith("10.") || ipAddress.includes("tor")) {
                    result.isProxy = true;
                    result.confidence = 85;
                }
                resolve(result);
            }, 50);
        });
    }
    createDefaultResult(ipAddress) {
        return {
            isProxy: false,
            confidence: 0,
            action: ProxyAction.ALLOW,
            region: this.extractRegionFromIp(ipAddress),
            details: { note: "Proxy detection not configured" },
        };
    }
    parseProxyAction(action) {
        switch (action.toLowerCase()) {
            case "allow":
                return ProxyAction.ALLOW;
            case "flag":
                return ProxyAction.FLAG;
            case "challenge":
                return ProxyAction.CHALLENGE;
            case "block":
                return ProxyAction.BLOCK;
            default:
                return ProxyAction.FLAG;
        }
    }
    extractRegionFromIp(ip) {
        return "UNKNOWN";
    }
};
ProxyDetectionService = ProxyDetectionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ProxyDetectionService);
exports.ProxyDetectionService = ProxyDetectionService;
//# sourceMappingURL=proxy-detection.service.js.map