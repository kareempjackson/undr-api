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
exports.DeliveryProof = exports.ProofStatus = exports.ProofType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const escrow_entity_1 = require("./escrow.entity");
var ProofType;
(function (ProofType) {
    ProofType["IMAGE"] = "IMAGE";
    ProofType["DOCUMENT"] = "DOCUMENT";
    ProofType["VIDEO"] = "VIDEO";
    ProofType["LINK"] = "LINK";
    ProofType["TEXT"] = "TEXT";
})(ProofType = exports.ProofType || (exports.ProofType = {}));
var ProofStatus;
(function (ProofStatus) {
    ProofStatus["PENDING"] = "PENDING";
    ProofStatus["ACCEPTED"] = "ACCEPTED";
    ProofStatus["REJECTED"] = "REJECTED";
})(ProofStatus = exports.ProofStatus || (exports.ProofStatus = {}));
let DeliveryProof = class DeliveryProof {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], DeliveryProof.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DeliveryProof.prototype, "escrowId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => escrow_entity_1.Escrow),
    (0, typeorm_1.JoinColumn)({ name: "escrowId" }),
    __metadata("design:type", escrow_entity_1.Escrow)
], DeliveryProof.prototype, "escrow", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], DeliveryProof.prototype, "submittedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User),
    (0, typeorm_1.JoinColumn)({ name: "submittedById" }),
    __metadata("design:type", user_entity_1.User)
], DeliveryProof.prototype, "submittedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: ProofType }),
    __metadata("design:type", String)
], DeliveryProof.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], DeliveryProof.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb" }),
    __metadata("design:type", Array)
], DeliveryProof.prototype, "files", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "enum", enum: ProofStatus, default: ProofStatus.PENDING }),
    __metadata("design:type", String)
], DeliveryProof.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], DeliveryProof.prototype, "reviewedById", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: "reviewedById" }),
    __metadata("design:type", user_entity_1.User)
], DeliveryProof.prototype, "reviewedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", nullable: true }),
    __metadata("design:type", String)
], DeliveryProof.prototype, "rejectionReason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], DeliveryProof.prototype, "reviewedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], DeliveryProof.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DeliveryProof.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], DeliveryProof.prototype, "updatedAt", void 0);
DeliveryProof = __decorate([
    (0, typeorm_1.Entity)("delivery_proofs")
], DeliveryProof);
exports.DeliveryProof = DeliveryProof;
//# sourceMappingURL=delivery-proof.entity.js.map