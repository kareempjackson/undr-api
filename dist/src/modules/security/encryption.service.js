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
var EncryptionService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = require("crypto");
let EncryptionService = EncryptionService_1 = class EncryptionService {
    constructor(configService) {
        this.configService = configService;
        this.algorithm = "aes-256-gcm";
        this.logger = new common_1.Logger(EncryptionService_1.name);
        const key = this.configService.get("ENCRYPTION_KEY");
        if (!key) {
            this.logger.error("ENCRYPTION_KEY is not set in environment variables!");
            throw new Error("Encryption key is not configured");
        }
        this.encryptionKey = Buffer.from(key, "hex");
        if (this.encryptionKey.length !== 32) {
            this.logger.error(`Invalid encryption key length: ${this.encryptionKey.length} bytes. Expected 32 bytes for AES-256.`);
            throw new Error("Invalid encryption key length");
        }
    }
    encrypt(text) {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
            let encrypted = cipher.update(text, "utf8", "base64");
            encrypted += cipher.final("base64");
            const authTag = cipher.getAuthTag().toString("base64");
            return JSON.stringify({
                iv: iv.toString("base64"),
                encrypted,
                authTag,
            });
        }
        catch (error) {
            this.logger.error(`Encryption error: ${error.message}`);
            throw new Error("Encryption failed");
        }
    }
    decrypt(encryptedJson) {
        try {
            const { iv, encrypted, authTag } = JSON.parse(encryptedJson);
            const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, Buffer.from(iv, "base64"));
            decipher.setAuthTag(Buffer.from(authTag, "base64"));
            let decrypted = decipher.update(encrypted, "base64", "utf8");
            decrypted += decipher.final("utf8");
            return decrypted;
        }
        catch (error) {
            this.logger.error(`Decryption error: ${error.message}`);
            throw new Error("Decryption failed");
        }
    }
    static generateEncryptionKey() {
        return crypto.randomBytes(32).toString("hex");
    }
};
EncryptionService = EncryptionService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EncryptionService);
exports.EncryptionService = EncryptionService;
//# sourceMappingURL=encryption.service.js.map