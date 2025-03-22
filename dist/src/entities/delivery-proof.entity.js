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
exports.DeliveryProof = exports.ProofType = void 0;
const typeorm_1 = require("typeorm");
const escrow_entity_1 = require("./escrow.entity");
var ProofType;
(function (ProofType) {
    ProofType["SCREENSHOT"] = "SCREENSHOT";
    ProofType["TRACKING_NUMBER"] = "TRACKING_NUMBER";
    ProofType["DIGITAL_DELIVERY"] = "DIGITAL_DELIVERY";
    ProofType["CREATOR_CONFIRMATION"] = "CREATOR_CONFIRMATION";
    ProofType["FAN_CONFIRMATION"] = "FAN_CONFIRMATION";
    ProofType["SYSTEM_VERIFICATION"] = "SYSTEM_VERIFICATION";
    ProofType["ADMIN_OVERRIDE"] = "ADMIN_OVERRIDE";
})(ProofType = exports.ProofType || (exports.ProofType = {}));
let DeliveryProof = class DeliveryProof {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], DeliveryProof.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid" }),
    __metadata("design:type", String)
], DeliveryProof.prototype, "escrowId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => escrow_entity_1.Escrow, (escrow) => escrow.deliveryProofs),
    (0, typeorm_1.JoinColumn)({ name: "escrowId" }),
    __metadata("design:type", escrow_entity_1.Escrow)
], DeliveryProof.prototype, "escrow", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ProofType,
    }),
    __metadata("design:type", String)
], DeliveryProof.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "json" }),
    __metadata("design:type", Object)
], DeliveryProof.prototype, "evidence", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], DeliveryProof.prototype, "verified", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "timestamp", nullable: true }),
    __metadata("design:type", Date)
], DeliveryProof.prototype, "verifiedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "uuid", nullable: true }),
    __metadata("design:type", String)
], DeliveryProof.prototype, "verifiedBy", void 0);
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