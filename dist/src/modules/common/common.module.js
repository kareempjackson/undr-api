"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommonModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const ip_masking_middleware_1 = require("./middleware/ip-masking.middleware");
const logging_interceptor_1 = require("./interceptors/logging.interceptor");
const privacy_critical_guard_1 = require("./guards/privacy-critical.guard");
const security_module_1 = require("../security/security.module");
let CommonModule = class CommonModule {
    configure(consumer) {
        consumer
            .apply(ip_masking_middleware_1.IpMaskingMiddleware)
            .forRoutes({ path: "*", method: common_1.RequestMethod.ALL });
    }
};
CommonModule = __decorate([
    (0, common_1.Module)({
        imports: [
            security_module_1.SecurityModule,
        ],
        providers: [
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: logging_interceptor_1.LoggingInterceptor,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: privacy_critical_guard_1.PrivacyCriticalGuard,
            },
            ip_masking_middleware_1.IpMaskingMiddleware,
        ],
        exports: [ip_masking_middleware_1.IpMaskingMiddleware],
    })
], CommonModule);
exports.CommonModule = CommonModule;
//# sourceMappingURL=common.module.js.map