"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const dotenv = require("dotenv");
dotenv.config();
let dataSourceOptions;
if (process.env.DATABASE_URL) {
    console.log("Using DATABASE_URL for database connection");
    const useSSL = process.env.USE_SSL === "true" || process.env.NODE_ENV === "production";
    console.log(`SSL connections: ${useSSL ? "enabled" : "disabled"}`);
    dataSourceOptions = {
        type: "postgres",
        url: process.env.DATABASE_URL,
        entities: ["dist/**/*.entity{.ts,.js}", "src/**/*.entity{.ts,.js}"],
        migrations: ["dist/migrations/*.js", "src/migrations/*.ts"],
        synchronize: false,
        logging: process.env.NODE_ENV === "development",
        ssl: useSSL ? { rejectUnauthorized: false } : false,
    };
}
else {
    console.log("Using individual connection parameters for database");
    dataSourceOptions = {
        type: "postgres",
        host: process.env.DB_HOST || "localhost",
        port: parseInt(process.env.DB_PORT || "5432", 10),
        username: process.env.POSTGRES_USER || "postgres",
        password: process.env.POSTGRES_PASSWORD || "F@stskin101",
        database: process.env.POSTGRES_DB || "ghostpay",
        entities: ["dist/**/*.entity{.ts,.js}", "src/**/*.entity{.ts,.js}"],
        migrations: ["dist/migrations/*.js", "src/migrations/*.ts"],
        synchronize: false,
        logging: process.env.NODE_ENV === "development",
    };
}
exports.AppDataSource = new typeorm_1.DataSource(dataSourceOptions);
//# sourceMappingURL=data-source.js.map