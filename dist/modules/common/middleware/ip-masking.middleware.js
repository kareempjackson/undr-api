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
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpMaskingMiddleware = void 0;
const common_1 = require("@nestjs/common");
const crypto = require("crypto");
const config_1 = require("@nestjs/config");
let IpMaskingMiddleware = class IpMaskingMiddleware {
    constructor(configService) {
        this.configService = configService;
        this.salt =
            this.configService.get("IP_MASK_SALT") ||
                crypto.randomBytes(16).toString("hex");
        this.storeFullIpForAdmins =
            this.configService.get("STORE_FULL_IP_FOR_ADMINS") === "true";
    }
    use(req, res, next) {
        const ip = req.ip || req.socket.remoteAddress || "unknown";
        req.rawIp = ip;
        const maskedIp = this.hashIp(ip);
        req.maskedIp = maskedIp;
        req.clientRegion = this.extractRegion(ip);
        const isAdminRoute = req.path.startsWith("/admin");
        if (!isAdminRoute || !this.storeFullIpForAdmins) {
            delete req.rawIp;
        }
        next();
    }
    hashIp(ip) {
        return crypto
            .createHash("sha256")
            .update(`${ip}${this.salt}`)
            .digest("hex");
    }
    extractRegion(ip) {
        return "UNKNOWN_REGION";
    }
};
IpMaskingMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], IpMaskingMiddleware);
exports.IpMaskingMiddleware = IpMaskingMiddleware;
//# sourceMappingURL=ip-masking.middleware.js.map