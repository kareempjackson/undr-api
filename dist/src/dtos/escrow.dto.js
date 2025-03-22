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
exports.RefundRequestDTO = exports.EscrowResponseDTO = exports.EscrowQueryDTO = exports.DeliveryProofSubmitDTO = exports.EscrowCreateDTO = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const delivery_proof_entity_1 = require("../entities/delivery-proof.entity");
const escrow_entity_1 = require("../entities/escrow.entity");
class EscrowCreateDTO {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: "User ID of the sender" }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], EscrowCreateDTO.prototype, "fromUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "User ID of the recipient" }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], EscrowCreateDTO.prototype, "toUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "The amount to escrow" }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], EscrowCreateDTO.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Payment ID associated with this escrow" }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], EscrowCreateDTO.prototype, "paymentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Stripe payment intent ID (if applicable)" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EscrowCreateDTO.prototype, "stripePaymentIntentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Additional metadata for the escrow",
        required: false,
    }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], EscrowCreateDTO.prototype, "metadata", void 0);
exports.EscrowCreateDTO = EscrowCreateDTO;
class DeliveryProofSubmitDTO {
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Type of proof being submitted",
        enum: delivery_proof_entity_1.ProofType,
    }),
    (0, class_validator_1.IsEnum)(delivery_proof_entity_1.ProofType),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DeliveryProofSubmitDTO.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Evidence data for the proof" }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], DeliveryProofSubmitDTO.prototype, "evidence", void 0);
exports.DeliveryProofSubmitDTO = DeliveryProofSubmitDTO;
class EscrowQueryDTO {
}
__decorate([
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EscrowQueryDTO.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(escrow_entity_1.EscrowStatus, { each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], EscrowQueryDTO.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Number of items to return", required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], EscrowQueryDTO.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Number of items to skip", required: false }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], EscrowQueryDTO.prototype, "offset", void 0);
exports.EscrowQueryDTO = EscrowQueryDTO;
class EscrowResponseDTO {
}
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], EscrowResponseDTO.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], EscrowResponseDTO.prototype, "paymentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], EscrowResponseDTO.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", String)
], EscrowResponseDTO.prototype, "stripePaymentIntentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], EscrowResponseDTO.prototype, "fromUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], EscrowResponseDTO.prototype, "toUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], EscrowResponseDTO.prototype, "fromAlias", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", String)
], EscrowResponseDTO.prototype, "toAlias", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: escrow_entity_1.EscrowStatus }),
    __metadata("design:type", String)
], EscrowResponseDTO.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], EscrowResponseDTO.prototype, "scheduleReleaseAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", Date)
], EscrowResponseDTO.prototype, "releasedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    __metadata("design:type", Date)
], EscrowResponseDTO.prototype, "refundedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Boolean)
], EscrowResponseDTO.prototype, "isHighRisk", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], EscrowResponseDTO.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Date)
], EscrowResponseDTO.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Additional metadata for the escrow",
        required: false,
    }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], EscrowResponseDTO.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [Object], required: false }),
    __metadata("design:type", Array)
], EscrowResponseDTO.prototype, "deliveryProofs", void 0);
exports.EscrowResponseDTO = EscrowResponseDTO;
class RefundRequestDTO {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Reason for the refund request" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RefundRequestDTO.prototype, "reason", void 0);
exports.RefundRequestDTO = RefundRequestDTO;
//# sourceMappingURL=escrow.dto.js.map