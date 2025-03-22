"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
let LoggingInterceptor = class LoggingInterceptor {
    constructor() {
        this.logger = new common_1.Logger("HTTP");
    }
    intercept(context, next) {
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const method = request.method;
        const url = request.url;
        const now = Date.now();
        const maskedIp = request.maskedIp || "no-masked-ip";
        const clientRegion = request.clientRegion || "unknown-region";
        const rawIp = request.rawIp ? `(${request.rawIp})` : "";
        return next.handle().pipe((0, operators_1.tap)(() => {
            const response = ctx.getResponse();
            const statusCode = response.statusCode;
            const responseTime = Date.now() - now;
            this.logger.log(`${method} ${url} ${statusCode} ${responseTime}ms - Region: ${clientRegion} - MaskedIP: ${maskedIp} ${rawIp}`);
        }));
    }
};
LoggingInterceptor = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
exports.LoggingInterceptor = LoggingInterceptor;
//# sourceMappingURL=logging.interceptor.js.map