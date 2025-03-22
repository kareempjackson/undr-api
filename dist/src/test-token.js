"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt = require("jsonwebtoken");
const generateToken = () => {
    const payload = {
        userId: "1234-5678-9012-3456",
        email: "test@example.com",
        role: "CREATOR",
        sub: "1234-5678-9012-3456",
    };
    const secret = process.env.JWT_SECRET || "test-secret-for-development";
    return jwt.sign(payload, secret, { expiresIn: "1h" });
};
const token = generateToken();
console.log("Test token:");
console.log(token);
//# sourceMappingURL=test-token.js.map