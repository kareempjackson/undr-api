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
exports.Escrow = exports.EscrowMilestone = exports.MilestoneStatus = exports.EscrowStatus = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const payment_entity_1 = require("./payment.entity");
var EscrowStatus;
(function (EscrowStatus) {
    EscrowStatus["PENDING"] = "PENDING";
    EscrowStatus["FUNDED"] = "FUNDED";
    EscrowStatus["RELEASED"] = "RELEASED";
    EscrowStatus["REFUNDED"] = "REFUNDED";
    EscrowStatus["DISPUTED"] = "DISPUTED";
    EscrowStatus["COMPLETED"] = "COMPLETED";
    EscrowStatus["CANCELLED"] = "CANCELLED";
})(EscrowStatus = exports.EscrowStatus || (exports.EscrowStatus = {}));
var MilestoneStatus;
(function (MilestoneStatus) {
    MilestoneStatus["PENDING"] = "PENDING";
    MilestoneStatus["COMPLETED"] = "COMPLETED";
    MilestoneStatus["DISPUTED"] = "DISPUTED";
})(MilestoneStatus = exports.MilestoneStatus || (exports.MilestoneStatus = {}));
let EscrowMilestone = class EscrowMilestone {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], EscrowMilestone.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], EscrowMilestone.prototype, "escrowId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], EscrowMilestone.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], EscrowMilestone.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: MilestoneStatus,
        default: MilestoneStatus.PENDING,
    }),
    __metadata("design:type", String)
], EscrowMilestone.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "int" }),
    __metadata("design:type", Number)
], EscrowMilestone.prototype, "sequence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], EscrowMilestone.prototype, "completedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EscrowMilestone.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EscrowMilestone.prototype, "updatedAt", void 0);
EscrowMilestone = __decorate([
    (0, typeorm_1.Entity)("escrow_milestones")
], EscrowMilestone);
exports.EscrowMilestone = EscrowMilestone;
let Escrow = class Escrow {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Escrow.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], Escrow.prototype, "totalAmount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: EscrowStatus,
        default: EscrowStatus.PENDING,
    }),
    __metadata("design:type", String)
], Escrow.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], Escrow.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], Escrow.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp" }),
    __metadata("design:type", Date)
], Escrow.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Escrow.prototype, "buyerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "buyerId" }),
    __metadata("design:type", user_entity_1.User)
], Escrow.prototype, "buyer", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Escrow.prototype, "sellerId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "sellerId" }),
    __metadata("design:type", user_entity_1.User)
], Escrow.prototype, "seller", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Escrow.prototype, "paymentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => payment_entity_1.Payment, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "paymentId" }),
    __metadata("design:type", payment_entity_1.Payment)
], Escrow.prototype, "payment", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => EscrowMilestone, (milestone) => milestone.escrowId, {
        cascade: true,
    }),
    __metadata("design:type", Array)
], Escrow.prototype, "milestones", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], Escrow.prototype, "terms", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Array)
], Escrow.prototype, "evidenceFiles", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Escrow.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Escrow.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], Escrow.prototype, "completedAt", void 0);
Escrow = __decorate([
    (0, typeorm_1.Entity)("escrows")
], Escrow);
exports.Escrow = Escrow;
//# sourceMappingURL=escrow.entity.js.map