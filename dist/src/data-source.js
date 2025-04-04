"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const dotenv = require("dotenv");
dotenv.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    username: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "F@stskin101",
    database: process.env.POSTGRES_DB || "ghostpay",
    entities: ["src/**/*.entity{.ts,.js}"],
    migrations: ["src/migrations/*.ts"],
    synchronize: false,
    logging: process.env.NODE_ENV === "development",
});
//# sourceMappingURL=data-source.js.map