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
exports.EscrowFilterDTO = exports.ReviewProofDTO = exports.DeliveryProofSubmitDTO = exports.EscrowDetailedCreateDTO = exports.MilestoneDTO = exports.EscrowCreateDTO = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const delivery_proof_entity_1 = require("../entities/delivery-proof.entity");
const escrow_entity_1 = require("../entities/escrow.entity");
class EscrowCreateDTO {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: "User ID of the buyer/sender" }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], EscrowCreateDTO.prototype, "fromUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "User ID of the seller/recipient" }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], EscrowCreateDTO.prototype, "toUserId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Amount to be held in escrow" }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], EscrowCreateDTO.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Payment ID for the escrow funding",
        required: false,
    }),
    (0, class_validator_1.IsUUID)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EscrowCreateDTO.prototype, "paymentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Stripe Payment Intent ID if applicable",
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EscrowCreateDTO.prototype, "stripePaymentIntentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Additional metadata", required: false }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], EscrowCreateDTO.prototype, "metadata", void 0);
exports.EscrowCreateDTO = EscrowCreateDTO;
class MilestoneDTO {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Amount for this milestone" }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0.01),
    __metadata("design:type", Number)
], MilestoneDTO.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Description of the milestone" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MilestoneDTO.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Sequence number of the milestone" }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], MilestoneDTO.prototype, "sequence", void 0);
exports.MilestoneDTO = MilestoneDTO;
class EscrowDetailedCreateDTO {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Title of the escrow agreement" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], EscrowDetailedCreateDTO.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Description of the escrow agreement",
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EscrowDetailedCreateDTO.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Total amount to be escrowed" }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], EscrowDetailedCreateDTO.prototype, "totalAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "User ID of the seller" }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], EscrowDetailedCreateDTO.prototype, "sellerId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Number of days until the escrow expires" }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], EscrowDetailedCreateDTO.prototype, "expirationDays", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Milestones for the escrow",
        type: [MilestoneDTO],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_transformer_1.Type)(() => MilestoneDTO),
    __metadata("design:type", Array)
], EscrowDetailedCreateDTO.prototype, "milestones", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Legal terms and conditions", required: false }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], EscrowDetailedCreateDTO.prototype, "terms", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Document URLs for the agreement",
        required: false,
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUrl)({}, { each: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], EscrowDetailedCreateDTO.prototype, "documents", void 0);
exports.EscrowDetailedCreateDTO = EscrowDetailedCreateDTO;
class DeliveryProofSubmitDTO {
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Type of proof being submitted",
        enum: delivery_proof_entity_1.ProofType,
    }),
    (0, class_validator_1.IsEnum)(delivery_proof_entity_1.ProofType),
    __metadata("design:type", String)
], DeliveryProofSubmitDTO.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Description of the proof", required: false }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], DeliveryProofSubmitDTO.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "File URLs for the proof" }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], DeliveryProofSubmitDTO.prototype, "files", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Additional metadata", required: false }),
    (0, class_validator_1.IsObject)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], DeliveryProofSubmitDTO.prototype, "metadata", void 0);
exports.DeliveryProofSubmitDTO = DeliveryProofSubmitDTO;
class ReviewProofDTO {
}
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Whether to accept the proof" }),
    (0, class_validator_1.IsEnum)(["accept", "reject"]),
    __metadata("design:type", String)
], ReviewProofDTO.prototype, "decision", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Reason for rejection if applicable",
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], ReviewProofDTO.prototype, "rejectionReason", void 0);
exports.ReviewProofDTO = ReviewProofDTO;
class EscrowFilterDTO {
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Filter by escrow status",
        enum: escrow_entity_1.EscrowStatus,
        required: false,
    }),
    (0, class_validator_1.IsEnum)(escrow_entity_1.EscrowStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], EscrowFilterDTO.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Maximum number of results to return",
        required: false,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], EscrowFilterDTO.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Number of results to skip for pagination",
        required: false,
    }),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], EscrowFilterDTO.prototype, "offset", void 0);
exports.EscrowFilterDTO = EscrowFilterDTO;
//# sourceMappingURL=escrow.dto.js.map