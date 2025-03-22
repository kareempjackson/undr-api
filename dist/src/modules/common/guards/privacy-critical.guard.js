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
var PrivacyCriticalGuard_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivacyCriticalGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const proxy_detection_service_1 = require("../../security/proxy-detection.service");
let PrivacyCriticalGuard = PrivacyCriticalGuard_1 = class PrivacyCriticalGuard {
    constructor(reflector, proxyDetectionService) {
        this.reflector = reflector;
        this.proxyDetectionService = proxyDetectionService;
        this.logger = new common_1.Logger(PrivacyCriticalGuard_1.name);
    }
    async canActivate(context) {
        const privacyOptions = this.reflector.get("privacy-critical", context.getHandler());
        if (!privacyOptions) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const endpoint = request.url;
        if (privacyOptions.storeNoIpData) {
            delete request.rawIp;
            delete request.maskedIp;
            request.clientRegion = "REDACTED";
        }
        else if (privacyOptions.regionOnly) {
            delete request.maskedIp;
            delete request.rawIp;
        }
        if (privacyOptions.detectProxy) {
            const ip = request.rawIp ||
                request.ip ||
                request.socket.remoteAddress ||
                "unknown";
            try {
                const proxyResult = await this.proxyDetectionService.detectProxy(ip, endpoint);
                request.proxyDetection = proxyResult;
                const proxyHandling = privacyOptions.proxyHandling || "flag";
                if (proxyResult.isProxy && proxyResult.confidence > 75) {
                    switch (proxyHandling) {
                        case "block":
                            this.logger.warn(`Blocked proxy access to ${endpoint} from ${proxyResult.region}`);
                            return false;
                        case "challenge":
                            this.logger.warn(`Proxy access to ${endpoint} requires verification`);
                            break;
                        case "flag":
                            this.logger.warn(`Flagged proxy access to ${endpoint} from ${proxyResult.region}`);
                            break;
                        case "allow":
                        default:
                            break;
                    }
                }
            }
            catch (error) {
                this.logger.error(`Error in proxy detection: ${error.message}`);
            }
        }
        return true;
    }
};
PrivacyCriticalGuard = PrivacyCriticalGuard_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        proxy_detection_service_1.ProxyDetectionService])
], PrivacyCriticalGuard);
exports.PrivacyCriticalGuard = PrivacyCriticalGuard;
//# sourceMappingURL=privacy-critical.guard.js.map