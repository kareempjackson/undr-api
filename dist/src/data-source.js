"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const dotenv = require("dotenv");
dotenv.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "F@stskin101",
    database: "ghostpay",
    entities: ["src/**/*.entity{.ts,.js}"],
    migrations: ["src/migrations/*.ts"],
    synchronize: process.env.NODE_ENV !== "production",
    logging: process.env.NODE_ENV === "development",
});
//# sourceMappingURL=data-source.js.map