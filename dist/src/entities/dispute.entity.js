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
exports.Dispute = exports.DisputeReason = exports.DisputeStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const payment_entity_1 = require("./payment.entity");
var DisputeStatus;
(function (DisputeStatus) {
    DisputeStatus["OPEN"] = "OPEN";
    DisputeStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    DisputeStatus["RESOLVED_FOR_MERCHANT"] = "RESOLVED_FOR_MERCHANT";
    DisputeStatus["RESOLVED_FOR_CUSTOMER"] = "RESOLVED_FOR_CUSTOMER";
    DisputeStatus["ESCALATED"] = "ESCALATED";
    DisputeStatus["CLOSED"] = "CLOSED";
})(DisputeStatus = exports.DisputeStatus || (exports.DisputeStatus = {}));
var DisputeReason;
(function (DisputeReason) {
    DisputeReason["PRODUCT_NOT_RECEIVED"] = "PRODUCT_NOT_RECEIVED";
    DisputeReason["PRODUCT_NOT_AS_DESCRIBED"] = "PRODUCT_NOT_AS_DESCRIBED";
    DisputeReason["UNAUTHORIZED_TRANSACTION"] = "UNAUTHORIZED_TRANSACTION";
    DisputeReason["DUPLICATE_TRANSACTION"] = "DUPLICATE_TRANSACTION";
    DisputeReason["SUBSCRIPTION_CANCELED"] = "SUBSCRIPTION_CANCELED";
    DisputeReason["OTHER"] = "OTHER";
})(DisputeReason = exports.DisputeReason || (exports.DisputeReason = {}));
let Dispute = class Dispute {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Dispute.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Dispute.prototype, "paymentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => payment_entity_1.Payment),
    (0, typeorm_1.JoinColumn)({ name: "paymentId" }),
    __metadata("design:type", payment_entity_1.Payment)
], Dispute.prototype, "payment", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Dispute.prototype, "filedByUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "filedByUserId" }),
    __metadata("design:type", user_entity_1.User)
], Dispute.prototype, "filedByUser", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: DisputeStatus,
        default: DisputeStatus.OPEN,
    }),
    __metadata("design:type", String)
], Dispute.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: DisputeReason,
    }),
    __metadata("design:type", String)
], Dispute.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Dispute.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Array)
], Dispute.prototype, "evidenceFiles", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], Dispute.prototype, "responsePacket", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Dispute.prototype, "resolutionNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Dispute.prototype, "resolvedByUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "resolvedByUserId" }),
    __metadata("design:type", user_entity_1.User)
], Dispute.prototype, "resolvedByUser", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Dispute.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Dispute.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], Dispute.prototype, "resolvedAt", void 0);
Dispute = __decorate([
    (0, typeorm_1.Entity)("disputes")
], Dispute);
exports.Dispute = Dispute;
//# sourceMappingURL=dispute.entity.js.map