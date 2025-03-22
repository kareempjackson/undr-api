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
exports.TransactionLog = exports.LogType = void 0;
const typeorm_1 = require("typeorm");
var LogType;
(function (LogType) {
    LogType["ESCROW_CREATED"] = "ESCROW_CREATED";
    LogType["ESCROW_STATUS_CHANGED"] = "ESCROW_STATUS_CHANGED";
    LogType["PROOF_SUBMITTED"] = "PROOF_SUBMITTED";
    LogType["FUNDS_RELEASED"] = "FUNDS_RELEASED";
    LogType["REFUND_ISSUED"] = "REFUND_ISSUED";
    LogType["DISPUTE_CREATED"] = "DISPUTE_CREATED";
    LogType["DISPUTE_RESOLVED"] = "DISPUTE_RESOLVED";
    LogType["CHARGEBACK_RECEIVED"] = "CHARGEBACK_RECEIVED";
    LogType["CHARGEBACK_CHALLENGED"] = "CHARGEBACK_CHALLENGED";
    LogType["CHARGEBACK_RESOLVED"] = "CHARGEBACK_RESOLVED";
})(LogType = exports.LogType || (exports.LogType = {}));
let TransactionLog = class TransactionLog {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TransactionLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: LogType,
    }),
    __metadata("design:type", String)
], TransactionLog.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TransactionLog.prototype, "escrowId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TransactionLog.prototype, "paymentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], TransactionLog.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 100, nullable: true }),
    __metadata("design:type", String)
], TransactionLog.prototype, "alias", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp" }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", Date)
], TransactionLog.prototype, "timestamp", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], TransactionLog.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "json" }),
    __metadata("design:type", Object)
], TransactionLog.prototype, "data", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], TransactionLog.prototype, "ipHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], TransactionLog.prototype, "deviceFingerprint", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], TransactionLog.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], TransactionLog.prototype, "stripePaymentIntentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 255, nullable: true }),
    __metadata("design:type", String)
], TransactionLog.prototype, "stripeDisputeId", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TransactionLog.prototype, "createdAt", void 0);
TransactionLog = __decorate([
    (0, typeorm_1.Entity)("transaction_logs")
], TransactionLog);
exports.TransactionLog = TransactionLog;
//# sourceMappingURL=transaction-log.entity.js.map