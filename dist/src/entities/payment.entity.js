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
exports.Payment = exports.ThreeDsStatus = exports.PaymentStatus = exports.PaymentMethod = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const encrypted_column_factory_1 = require("../modules/common/transformers/encrypted-column.factory");
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["WALLET"] = "WALLET";
    PaymentMethod["CREDIT_CARD"] = "CREDIT_CARD";
    PaymentMethod["CRYPTO_BTC"] = "CRYPTO_BTC";
    PaymentMethod["CRYPTO_ETH"] = "CRYPTO_ETH";
    PaymentMethod["CRYPTO_USDT"] = "CRYPTO_USDT";
})(PaymentMethod = exports.PaymentMethod || (exports.PaymentMethod = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["COMPLETED"] = "COMPLETED";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
    PaymentStatus["DISPUTED"] = "DISPUTED";
    PaymentStatus["HELD"] = "HELD";
    PaymentStatus["ESCROW"] = "ESCROW";
})(PaymentStatus = exports.PaymentStatus || (exports.PaymentStatus = {}));
var ThreeDsStatus;
(function (ThreeDsStatus) {
    ThreeDsStatus["NOT_REQUIRED"] = "NOT_REQUIRED";
    ThreeDsStatus["REQUIRED"] = "REQUIRED";
    ThreeDsStatus["AUTHENTICATED"] = "AUTHENTICATED";
    ThreeDsStatus["FAILED"] = "FAILED";
    ThreeDsStatus["REJECTED"] = "REJECTED";
})(ThreeDsStatus = exports.ThreeDsStatus || (exports.ThreeDsStatus = {}));
let Payment = class Payment {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Payment.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "decimal",
        precision: 10,
        scale: 2,
        transformer: (0, encrypted_column_factory_1.encryptedColumn)(),
    }),
    __metadata("design:type", Number)
], Payment.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: PaymentStatus,
        default: PaymentStatus.PENDING,
    }),
    __metadata("design:type", String)
], Payment.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: PaymentMethod,
    }),
    __metadata("design:type", String)
], Payment.prototype, "method", void 0);
__decorate([
    (0, typeorm_1.Column)({
        nullable: true,
        transformer: (0, encrypted_column_factory_1.encryptedColumn)(),
    }),
    __metadata("design:type", String)
], Payment.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({
        nullable: true,
        transformer: (0, encrypted_column_factory_1.encryptedColumn)(),
    }),
    __metadata("design:type", String)
], Payment.prototype, "externalId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: ThreeDsStatus,
        default: ThreeDsStatus.NOT_REQUIRED,
        nullable: true,
    }),
    __metadata("design:type", String)
], Payment.prototype, "threeDsStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Payment.prototype, "threeDsUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "threeDsResult", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "decimal", precision: 5, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], Payment.prototype, "riskScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Payment.prototype, "hasDispute", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Payment.prototype, "isHighRisk", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Payment.prototype, "ipAddress", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", nullable: true }),
    __metadata("design:type", Object)
], Payment.prototype, "deviceInfo", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Payment.prototype, "browserInfo", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Payment.prototype, "isInternational", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "jsonb",
        nullable: true,
        transformer: (0, encrypted_column_factory_1.encryptedColumn)(),
    }),
    __metadata("design:type", Object)
], Payment.prototype, "invoiceDetails", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "jsonb",
        nullable: true,
        transformer: (0, encrypted_column_factory_1.encryptedColumn)(),
    }),
    __metadata("design:type", Object)
], Payment.prototype, "receiptData", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Payment.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Payment.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Payment.prototype, "fromUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.paymentsSent),
    (0, typeorm_1.JoinColumn)({ name: "fromUserId" }),
    __metadata("design:type", user_entity_1.User)
], Payment.prototype, "fromUser", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Payment.prototype, "toUserId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.paymentsReceived),
    (0, typeorm_1.JoinColumn)({ name: "toUserId" }),
    __metadata("design:type", user_entity_1.User)
], Payment.prototype, "toUser", void 0);
Payment = __decorate([
    (0, typeorm_1.Entity)("payments")
], Payment);
exports.Payment = Payment;
//# sourceMappingURL=payment.entity.js.map