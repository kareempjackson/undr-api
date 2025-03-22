"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayCreatorDto = exports.DepositDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const payment_entity_1 = require("../../../entities/payment.entity");
class DepositDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: 100, description: "Amount to deposit" }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], DepositDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        enum: payment_entity_1.PaymentMethod,
        example: payment_entity_1.PaymentMethod.CREDIT_CARD,
        description: "Payment method for deposit",
    }),
    (0, class_validator_1.IsEnum)(payment_entity_1.PaymentMethod),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], DepositDto.prototype, "paymentMethod", void 0);
exports.DepositDto = DepositDto;
class PayCreatorDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({ example: "creator-uuid", description: "Creator ID to pay" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PayCreatorDto.prototype, "creatorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 20, description: "Amount to pay" }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], PayCreatorDto.prototype, "amount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: "Monthly subscription payment",
        description: "Payment description",
        required: false,
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], PayCreatorDto.prototype, "description", void 0);
exports.PayCreatorDto = PayCreatorDto;
__exportStar(require("./deposit.dto"), exports);
__exportStar(require("./pay-creator.dto"), exports);
__exportStar(require("./complete-deposit.dto"), exports);
//# sourceMappingURL=index.js.map