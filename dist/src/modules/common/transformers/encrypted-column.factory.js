"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptedColumn = exports.setEncryptionService = void 0;
const encrypted_column_transformer_1 = require("./encrypted-column.transformer");
const common_1 = require("@nestjs/common");
let encryptionServiceInstance;
const logger = new common_1.Logger("EncryptedColumnFactory");
function setEncryptionService(encryptionService) {
    encryptionServiceInstance = encryptionService;
    logger.log("Encryption service successfully set for column transformers");
}
exports.setEncryptionService = setEncryptionService;
function encryptedColumn() {
    return new LazyEncryptedColumnTransformer(() => {
        if (!encryptionServiceInstance) {
            logger.error("Encryption service not initialized. This is a critical error.");
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
        this.logger = new common_1.Logger(LazyEncryptedColumnTransformer.name);
    }
    getTransformer() {
        if (!this.transformer) {
            try {
                const encryptionService = this.getEncryptionService();
                this.transformer = new encrypted_column_transformer_1.EncryptedColumnTransformer(encryptionService);
            }
            catch (error) {
                this.logger.error(`Failed to initialize transformer: ${error.message}`, error.stack);
                throw new Error(`Encryption transformer initialization failed: ${error.message}`);
            }
        }
        return this.transformer;
    }
    to(value) {
        try {
            return this.getTransformer().to(value);
        }
        catch (error) {
            this.logger.error(`Error in to() transformation: ${error.message}`, {
                valueType: typeof value,
                error: error.stack,
            });
            return null;
        }
    }
    from(value) {
        try {
            return this.getTransformer().from(value);
        }
        catch (error) {
            this.logger.error(`Error in from() transformation: ${error.message}`, {
                error: error.stack,
            });
            return `[DECRYPTION_ERROR: ${error.message}]`;
        }
    }
}
//# sourceMappingURL=encrypted-column.factory.js.map