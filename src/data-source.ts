import { DataSource, DataSourceOptions } from "typeorm";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();

let dataSourceOptions: DataSourceOptions;
const isProduction = process.env.NODE_ENV === "production";

// In production, only use compiled JS files - using absolute paths to avoid confusion
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

// Log the paths for debugging
console.log(`Entities paths: ${entitiesPath.join(", ")}`);
console.log(`Migrations paths: ${migrationsPath.join(", ")}`);

// Check if DATABASE_URL is provided (Railway or other PaaS)
if (process.env.DATABASE_URL) {
  console.log("Using DATABASE_URL for database connection");
  console.log(
    `DATABASE_URL: ${process.env.DATABASE_URL.replace(/:[^:@]*@/, ":****@")}`
  ); // Log the URL with password masked

  // Only use SSL in production environment or if explicitly set
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
    connectTimeoutMS: 20000, // 20 seconds connection timeout
    extra: {
      // Add connection pool settings
      max: 20,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
      // Handle retries at the driver level
      retry: {
        maxRetries: 10,
        initialDelayMs: 1000,
        maxDelayMs: 5000,
      },
    },
  } as DataSourceOptions;
} else {
  console.log("Using individual connection parameters for database");
  // NOTE: This is a development-only fallback.
  // In production, we always use DATABASE_URL which is set in the environment.
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
    connectTimeoutMS: 20000, // 20 seconds connection timeout
    extra: {
      // Add connection pool settings
      max: 20,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 10000,
    },
  } as DataSourceOptions;
}

// Create and export the data source
export const AppDataSource = new DataSource(dataSourceOptions);

// NOTE: Error handling for database connections is managed by NestJS's TypeOrmModule
// which already has built-in retry mechanisms
