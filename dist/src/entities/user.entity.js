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
exports.User = exports.MfaMethod = exports.UserStatus = exports.UserRole = void 0;
const typeorm_1 = require("typeorm");
const wallet_entity_1 = require("./wallet.entity");
const payment_entity_1 = require("./payment.entity");
const deposit_entity_1 = require("./deposit.entity");
const withdrawal_entity_1 = require("./withdrawal.entity");
const magic_link_entity_1 = require("./magic-link.entity");
const encrypted_column_factory_1 = require("../modules/common/transformers/encrypted-column.factory");
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["CREATOR"] = "CREATOR";
    UserRole["FAN"] = "FAN";
    UserRole["AGENCY"] = "AGENCY";
})(UserRole = exports.UserRole || (exports.UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["PENDING"] = "PENDING";
    UserStatus["SUSPENDED"] = "SUSPENDED";
    UserStatus["DELETED"] = "DELETED";
})(UserStatus = exports.UserStatus || (exports.UserStatus = {}));
var MfaMethod;
(function (MfaMethod) {
    MfaMethod["NONE"] = "NONE";
    MfaMethod["EMAIL"] = "EMAIL";
    MfaMethod["SMS"] = "SMS";
    MfaMethod["AUTHENTICATOR"] = "AUTHENTICATOR";
    MfaMethod["BIOMETRIC"] = "BIOMETRIC";
})(MfaMethod = exports.MfaMethod || (exports.MfaMethod = {}));
let User = class User {
};
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        unique: true,
        transformer: (0, encrypted_column_factory_1.encryptedColumn)(),
    }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({
        nullable: true,
        transformer: (0, encrypted_column_factory_1.encryptedColumn)(),
    }),
    __metadata("design:type", String)
], User.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        unique: true,
        nullable: true,
    }),
    (0, typeorm_1.Index)(),
    __metadata("design:type", String)
], User.prototype, "alias", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: UserRole,
        default: UserRole.FAN,
    }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: UserStatus,
        default: UserStatus.PENDING,
    }),
    __metadata("design:type", String)
], User.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "profileImage", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "bio", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "location", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "emailVerified", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "featured", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "enum",
        enum: MfaMethod,
        default: MfaMethod.NONE,
    }),
    __metadata("design:type", String)
], User.prototype, "mfaMethod", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], User.prototype, "mfaSecret", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "mfaEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "highSecurityMode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", default: [] }),
    __metadata("design:type", Array)
], User.prototype, "trustedDevices", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "jsonb", default: [] }),
    __metadata("design:type", Array)
], User.prototype, "loginHistory", void 0);
__decorate([
    (0, typeorm_1.Column)({
        nullable: true,
        transformer: (0, encrypted_column_factory_1.encryptedColumn)(),
    }),
    __metadata("design:type", String)
], User.prototype, "phoneNumber", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "phoneVerified", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => wallet_entity_1.Wallet, (wallet) => wallet.user, { cascade: true }),
    __metadata("design:type", wallet_entity_1.Wallet)
], User.prototype, "wallet", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => payment_entity_1.Payment, (payment) => payment.fromUser),
    __metadata("design:type", Array)
], User.prototype, "paymentsSent", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => payment_entity_1.Payment, (payment) => payment.toUser),
    __metadata("design:type", Array)
], User.prototype, "paymentsReceived", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => deposit_entity_1.Deposit, (deposit) => deposit.user),
    __metadata("design:type", Array)
], User.prototype, "deposits", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => withdrawal_entity_1.Withdrawal, (withdrawal) => withdrawal.user),
    __metadata("design:type", Array)
], User.prototype, "withdrawals", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => magic_link_entity_1.MagicLink, (magicLink) => magicLink.user),
    __metadata("design:type", Array)
], User.prototype, "magicLinks", void 0);
User = __decorate([
    (0, typeorm_1.Entity)("users")
], User);
exports.User = User;
//# sourceMappingURL=user.entity.js.map