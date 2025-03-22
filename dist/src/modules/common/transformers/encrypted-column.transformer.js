"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptedColumnTransformer = void 0;
class EncryptedColumnTransformer {
    constructor(encryptionService) {
        this.encryptionService = encryptionService;
    }
    to(value) {
        if (value === null || value === undefined) {
            return null;
        }
        const stringValue = typeof value === "string" ? value : JSON.stringify(value);
        return this.encryptionService.encrypt(stringValue);
    }
    from(value) {
        if (value === null || value === undefined) {
            return null;
        }
        const decrypted = this.encryptionService.decrypt(value);
        try {
            return JSON.parse(decrypted);
        }
        catch (_a) {
            return decrypted;
        }
    }
}
exports.EncryptedColumnTransformer = EncryptedColumnTransformer;
//# sourceMappingURL=encrypted-column.transformer.js.map