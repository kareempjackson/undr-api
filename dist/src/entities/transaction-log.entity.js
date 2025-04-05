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
exports.TransactionLog = exports.TransactionType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
var TransactionType;
(function (TransactionType) {
    TransactionType["ESCROW_CREATED"] = "ESCROW_CREATED";
    TransactionType["ESCROW_FUNDED"] = "ESCROW_FUNDED";
    TransactionType["ESCROW_PROOF_SUBMITTED"] = "ESCROW_PROOF_SUBMITTED";
    TransactionType["ESCROW_PROOF_REVIEWED"] = "ESCROW_PROOF_REVIEWED";
    TransactionType["ESCROW_COMPLETED"] = "ESCROW_COMPLETED";
    TransactionType["ESCROW_CANCELLED"] = "ESCROW_CANCELLED";
    TransactionType["ESCROW_REFUNDED"] = "ESCROW_REFUNDED";
    TransactionType["ESCROW_DISPUTED"] = "ESCROW_DISPUTED";
    TransactionType["ESCROW_TERMS_UPDATED"] = "ESCROW_TERMS_UPDATED";
    TransactionType["MILESTONE_UPDATED"] = "MILESTONE_UPDATED";
    TransactionType["CHARGEBACK_BUFFER_ALLOCATION"] = "CHARGEBACK_BUFFER_ALLOCATION";
    TransactionType["CHARGEBACK_BUFFER_DEDUCTION"] = "CHARGEBACK_BUFFER_DEDUCTION";
})(TransactionType = exports.TransactionType || (exports.TransactionType = {}));
let TransactionLog = class TransactionLog {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], TransactionLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: TransactionType }),
    __metadata("design:type", String)
], TransactionLog.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TransactionLog.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "userId" }),
    __metadata("design:type", user_entity_1.User)
], TransactionLog.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", String)
], TransactionLog.prototype, "entityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], TransactionLog.prototype, "entityType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb" }),
    __metadata("design:type", Object)
], TransactionLog.prototype, "data", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "inet", nullable: true }),
    __metadata("design:type", String)
], TransactionLog.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], TransactionLog.prototype, "userAgent", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], TransactionLog.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], TransactionLog.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], TransactionLog.prototype, "action", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], TransactionLog.prototype, "details", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 20, scale: 8, nullable: true }),
    __metadata("design:type", Number)
], TransactionLog.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "info", nullable: true }),
    __metadata("design:type", String)
], TransactionLog.prototype, "level", void 0);
TransactionLog = __decorate([
    (0, typeorm_1.Entity)("transaction_logs")
], TransactionLog);
exports.TransactionLog = TransactionLog;
//# sourceMappingURL=transaction-log.entity.js.map