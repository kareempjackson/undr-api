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
exports.CompleteDepositDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CompleteDepositDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "ID of the deposit to complete",
        example: "5f8d0d55b54764421b71958a",
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteDepositDto.prototype, "depositId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "ID of the payment intent from Stripe",
        example: "pi_3Nt3GiHsXFwQYV9G1rJxRFYS",
    }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteDepositDto.prototype, "paymentIntentId", void 0);
exports.CompleteDepositDto = CompleteDepositDto;
//# sourceMappingURL=complete-deposit.dto.js.map