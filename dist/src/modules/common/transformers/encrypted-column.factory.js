"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptedColumn = exports.setEncryptionService = void 0;
const encrypted_column_transformer_1 = require("./encrypted-column.transformer");
let encryptionServiceInstance;
function setEncryptionService(encryptionService) {
    encryptionServiceInstance = encryptionService;
}
exports.setEncryptionService = setEncryptionService;
function encryptedColumn() {
    return new LazyEncryptedColumnTransformer(() => {
        if (!encryptionServiceInstance) {
            throw new Error("Encryption service not initialized. Call setEncryptionService first.");
        }
        return encryptionServiceInstance;
    });
}
exports.encryptedColumn = encryptedColumn;
class LazyEncryptedColumnTransformer {
    constructor(getEncryptionService) {
        this.getEncryptionService = getEncryptionService;
        this.transformer = null;
    }
    getTransformer() {
        if (!this.transformer) {
            const encryptionService = this.getEncryptionService();
            this.transformer = new encrypted_column_transformer_1.EncryptedColumnTransformer(encryptionService);
        }
        return this.transformer;
    }
    to(value) {
        return this.getTransformer().to(value);
    }
    from(value) {
        return this.getTransformer().from(value);
    }
}
//# sourceMappingURL=encrypted-column.factory.js.map