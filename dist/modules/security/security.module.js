"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
const entities_1 = require("../../entities");
const risk_assessment_service_1 = require("./risk-assessment.service");
const three_ds_service_1 = require("./three-ds.service");
const dispute_service_1 = require("./dispute.service");
const escrow_service_1 = require("./escrow.service");
const security_controller_1 = require("./security.controller");
const proxy_detection_service_1 = require("./proxy-detection.service");
let SecurityModule = class SecurityModule {
};
SecurityModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            typeorm_1.TypeOrmModule.forFeature([
                entities_1.User,
                entities_1.Payment,
                entities_1.Wallet,
                entities_1.Dispute,
                entities_1.RiskAssessment,
                entities_1.Escrow,
                entities_1.EscrowMilestone,
            ]),
        ],
        providers: [
            risk_assessment_service_1.RiskAssessmentService,
            three_ds_service_1.ThreeDsService,
            dispute_service_1.DisputeService,
            escrow_service_1.EscrowService,
            proxy_detection_service_1.ProxyDetectionService,
        ],
        controllers: [security_controller_1.SecurityController],
        exports: [
            risk_assessment_service_1.RiskAssessmentService,
            three_ds_service_1.ThreeDsService,
            dispute_service_1.DisputeService,
            escrow_service_1.EscrowService,
            proxy_detection_service_1.ProxyDetectionService,
        ],
    })
], SecurityModule);
exports.SecurityModule = SecurityModule;
//# sourceMappingURL=security.module.js.map