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
exports.Dispute = exports.DisputeReason = exports.DisputeResolution = exports.DisputeStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const escrow_entity_1 = require("./escrow.entity");
const dispute_evidence_entity_1 = require("./dispute-evidence.entity");
const dispute_message_entity_1 = require("./dispute-message.entity");
var DisputeStatus;
(function (DisputeStatus) {
    DisputeStatus["EVIDENCE_SUBMISSION"] = "EVIDENCE_SUBMISSION";
    DisputeStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    DisputeStatus["MUTUALLY_RESOLVED"] = "MUTUALLY_RESOLVED";
    DisputeStatus["RESOLVED_BY_ADMIN"] = "RESOLVED_BY_ADMIN";
    DisputeStatus["CLOSED"] = "CLOSED";
    DisputeStatus["EXPIRED"] = "EXPIRED";
    DisputeStatus["OPEN"] = "OPEN";
    DisputeStatus["RESOLVED_FOR_CUSTOMER"] = "RESOLVED_FOR_CUSTOMER";
    DisputeStatus["RESOLVED_FOR_MERCHANT"] = "RESOLVED_FOR_MERCHANT";
    DisputeStatus["ESCALATED"] = "ESCALATED";
})(DisputeStatus = exports.DisputeStatus || (exports.DisputeStatus = {}));
var DisputeResolution;
(function (DisputeResolution) {
    DisputeResolution["BUYER_REFUND"] = "BUYER_REFUND";
    DisputeResolution["SELLER_RECEIVE"] = "SELLER_RECEIVE";
    DisputeResolution["SPLIT"] = "SPLIT";
    DisputeResolution["CUSTOM"] = "CUSTOM";
})(DisputeResolution = exports.DisputeResolution || (exports.DisputeResolution = {}));
var DisputeReason;
(function (DisputeReason) {
    DisputeReason["PRODUCT_NOT_RECEIVED"] = "PRODUCT_NOT_RECEIVED";
    DisputeReason["PRODUCT_NOT_AS_DESCRIBED"] = "PRODUCT_NOT_AS_DESCRIBED";
    DisputeReason["UNAUTHORIZED_CHARGE"] = "UNAUTHORIZED_CHARGE";
    DisputeReason["DUPLICATE_CHARGE"] = "DUPLICATE_CHARGE";
    DisputeReason["SERVICES_NOT_PROVIDED"] = "SERVICES_NOT_PROVIDED";
    DisputeReason["QUALITY_ISSUES"] = "QUALITY_ISSUES";
    DisputeReason["OTHER"] = "OTHER";
})(DisputeReason = exports.DisputeReason || (exports.DisputeReason = {}));
let Dispute = class Dispute {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Dispute.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], Dispute.prototype, "escrowId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => escrow_entity_1.Escrow, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)({ name: "escrowId" }),
    __metadata("design:type", escrow_entity_1.Escrow)
], Dispute.prototype, "escrow", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], Dispute.prototype, "createdById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "createdById" }),
    __metadata("design:type", user_entity_1.User)
], Dispute.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", String)
], Dispute.prototype, "reviewedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "reviewedById" }),
    __metadata("design:type", user_entity_1.User)
], Dispute.prototype, "reviewedBy", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Dispute.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", default: "{}" }),
    __metadata("design:type", Object)
], Dispute.prototype, "details", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: DisputeStatus,
        default: DisputeStatus.EVIDENCE_SUBMISSION,
    }),
    __metadata("design:type", String)
], Dispute.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: DisputeResolution,
        nullable: true,
    }),
    __metadata("design:type", String)
], Dispute.prototype, "resolution", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp with time zone", nullable: true }),
    __metadata("design:type", Date)
], Dispute.prototype, "evidenceDeadline", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp with time zone", nullable: true }),
    __metadata("design:type", Date)
], Dispute.prototype, "resolvedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "numeric", nullable: true }),
    __metadata("design:type", Number)
], Dispute.prototype, "buyerAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "numeric", nullable: true }),
    __metadata("design:type", Number)
], Dispute.prototype, "sellerAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", default: "{}" }),
    __metadata("design:type", Object)
], Dispute.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", String)
], Dispute.prototype, "paymentId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", String)
], Dispute.prototype, "filedByUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", String)
], Dispute.prototype, "resolvedByUserId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
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
    (0, typeorm_1.CreateDateColumn)({ type: "timestamp with time zone" }),
    __metadata("design:type", Date)
], Dispute.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: "timestamp with time zone" }),
    __metadata("design:type", Date)
], Dispute.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => dispute_evidence_entity_1.DisputeEvidence, (evidence) => evidence.dispute),
    __metadata("design:type", Array)
], Dispute.prototype, "evidence", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => dispute_message_entity_1.DisputeMessage, (message) => message.dispute),
    __metadata("design:type", Array)
], Dispute.prototype, "messages", void 0);
Dispute = __decorate([
    (0, typeorm_1.Entity)("disputes")
], Dispute);
exports.Dispute = Dispute;
//# sourceMappingURL=dispute.entity.js.map