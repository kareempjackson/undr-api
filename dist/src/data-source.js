"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config();
let dataSourceOptions;
const isProduction = process.env.NODE_ENV === "production";
const entitiesPath = isProduction
    ? [path.join(process.cwd(), "dist", "src", "**", "*.entity.js")]
    : [
        path.join(process.cwd(), "dist", "src", "**", "*.entity.js"),
        path.join(process.cwd(), "src", "**", "*.entity.ts"),
    ];
const migrationsPath = isProduction
    ? [path.join(process.cwd(), "dist", "src", "migrations", "*.js")]
    : [
        path.join(process.cwd(), "dist", "src", "migrations", "*.js"),
        path.join(process.cwd(), "src", "migrations", "*.ts"),
    ];
console.log(`Entities paths: ${entitiesPath.join(", ")}`);
console.log(`Migrations paths: ${migrationsPath.join(", ")}`);
if (process.env.DATABASE_URL) {
    console.log("Using DATABASE_URL for database connection");
    console.log(`DATABASE_URL: ${process.env.DATABASE_URL.replace(/:[^:@]*@/, ":****@")}`);
    const conflictingVars = [
        "POSTGRES_USER",
        "POSTGRES_PASSWORD",
        "POSTGRES_DB",
        "POSTGRES_HOST",
        "POSTGRES_PORT",
    ];
    const foundConflicts = conflictingVars.filter((name) => !!process.env[name]);
    if (foundConflicts.length > 0) {
        console.log("\nWARNING: Found individual database credentials that will be ignored:");
        foundConflicts.forEach((name) => console.log(`- ${name}=${process.env[name]}`));
        console.log("When DATABASE_URL is present, it takes precedence over individual credentials.");
    }
    const useSSL = process.env.USE_SSL === "true" || isProduction;
    console.log(`SSL connections: ${useSSL ? "enabled" : "disabled"}`);
    dataSourceOptions = {
        type: "postgres",
        url: process.env.DATABASE_URL,
        entities: entitiesPath,
        migrations: migrationsPath,
        synchronize: false,
        logging: process.env.NODE_ENV === "development",
        ssl: useSSL ? { rejectUnauthorized: false } : false,
        connectTimeoutMS: 20000,
        extra: {
            max: 20,
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 10000,
            retry: {
                maxRetries: 10,
                initialDelayMs: 1000,
                maxDelayMs: 5000,
            },
        },
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
        entities: entitiesPath,
        migrations: migrationsPath,
        synchronize: false,
        logging: process.env.NODE_ENV === "development",
        connectTimeoutMS: 20000,
        extra: {
            max: 20,
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 10000,
        },
    };
}
exports.AppDataSource = new typeorm_1.DataSource(dataSourceOptions);
//# sourceMappingURL=data-source.js.map