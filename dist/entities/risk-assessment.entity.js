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
exports.RiskAssessment = exports.RiskFlag = exports.RiskLevel = void 0;
const typeorm_1 = require("typeorm");
const payment_entity_1 = require("./payment.entity");
const user_entity_1 = require("./user.entity");
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["LOW"] = "LOW";
    RiskLevel["MEDIUM"] = "MEDIUM";
    RiskLevel["HIGH"] = "HIGH";
    RiskLevel["CRITICAL"] = "CRITICAL";
})(RiskLevel = exports.RiskLevel || (exports.RiskLevel = {}));
var RiskFlag;
(function (RiskFlag) {
    RiskFlag["UNUSUAL_LOCATION"] = "UNUSUAL_LOCATION";
    RiskFlag["MULTIPLE_FAILED_ATTEMPTS"] = "MULTIPLE_FAILED_ATTEMPTS";
    RiskFlag["RAPID_SUCCESSION_PAYMENTS"] = "RAPID_SUCCESSION_PAYMENTS";
    RiskFlag["LARGE_TRANSACTION"] = "LARGE_TRANSACTION";
    RiskFlag["NEW_PAYMENT_METHOD"] = "NEW_PAYMENT_METHOD";
    RiskFlag["UNUSUAL_TIME"] = "UNUSUAL_TIME";
    RiskFlag["IP_MISMATCH"] = "IP_MISMATCH";
    RiskFlag["DEVICE_CHANGE"] = "DEVICE_CHANGE";
    RiskFlag["BEHAVIORAL_ANOMALY"] = "BEHAVIORAL_ANOMALY";
})(RiskFlag = exports.RiskFlag || (exports.RiskFlag = {}));
let RiskAssessment = class RiskAssessment {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], RiskAssessment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], RiskAssessment.prototype, "paymentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => payment_entity_1.Payment, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "paymentId" }),
    __metadata("design:type", payment_entity_1.Payment)
], RiskAssessment.prototype, "payment", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], RiskAssessment.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "userId" }),
    __metadata("design:type", user_entity_1.User)
], RiskAssessment.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: RiskLevel,
        default: RiskLevel.LOW,
    }),
    __metadata("design:type", String)
], RiskAssessment.prototype, "riskLevel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", default: [] }),
    __metadata("design:type", Array)
], RiskAssessment.prototype, "riskFlags", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], RiskAssessment.prototype, "riskScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], RiskAssessment.prototype, "riskDetails", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], RiskAssessment.prototype, "deviceInfo", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], RiskAssessment.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], RiskAssessment.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], RiskAssessment.prototype, "requires3ds", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], RiskAssessment.prototype, "requiresMfa", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], RiskAssessment.prototype, "blocked", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], RiskAssessment.prototype, "reviewRequired", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], RiskAssessment.prototype, "reviewedByUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "reviewedByUserId" }),
    __metadata("design:type", user_entity_1.User)
], RiskAssessment.prototype, "reviewedByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], RiskAssessment.prototype, "reviewNotes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RiskAssessment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], RiskAssessment.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], RiskAssessment.prototype, "reviewedAt", void 0);
RiskAssessment = __decorate([
    (0, typeorm_1.Entity)("risk_assessments")
], RiskAssessment);
exports.RiskAssessment = RiskAssessment;
//# sourceMappingURL=risk-assessment.entity.js.map