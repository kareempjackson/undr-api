"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptedColumnTransformer = void 0;
const common_1 = require("@nestjs/common");
class EncryptedColumnTransformer {
    constructor(encryptionService) {
        this.encryptionService = encryptionService;
        this.logger = new common_1.Logger(EncryptedColumnTransformer.name);
    }
    to(value) {
        if (value === null || value === undefined) {
            return null;
        }
        try {
            const stringValue = typeof value === "string" ? value : JSON.stringify(value);
            return this.encryptionService.encrypt(stringValue);
        }
        catch (error) {
            this.logger.error(`Error encrypting value: ${error.message}`, {
                valueType: typeof value,
                valuePreview: typeof value === "string"
                    ? value.substring(0, 20) + "..."
                    : String(value).substring(0, 20) + "...",
                error: error.stack,
            });
            return null;
        }
    }
    from(value) {
        if (value === null || value === undefined) {
            return null;
        }
        try {
            const decrypted = this.encryptionService.decrypt(value);
            if (decrypted === null) {
                return null;
            }
            try {
                return JSON.parse(decrypted);
            }
            catch (jsonError) {
                return decrypted;
            }
        }
        catch (error) {
            this.logger.error(`Error decrypting value: ${error.message}`, {
                valuePreview: typeof value === "string"
                    ? value.substring(0, 30) + "..."
                    : String(value).substring(0, 30) + "...",
                error: error.stack,
            });
            return `[DECRYPTION_ERROR: ${error.message}]`;
        }
    }
}
exports.EncryptedColumnTransformer = EncryptedColumnTransformer;
//# sourceMappingURL=encrypted-column.transformer.js.map