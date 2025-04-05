import { DataSource, DataSourceOptions } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

let dataSourceOptions: DataSourceOptions;

// Check if DATABASE_URL is provided (Railway or other PaaS)
if (process.env.DATABASE_URL) {
  dataSourceOptions = {
    type: "postgres",
    url: process.env.DATABASE_URL,
    entities: ["src/**/*.entity{.ts,.js}"],
    migrations: ["src/migrations/*.ts"],
    synchronize: false,
    logging: process.env.NODE_ENV === "development",
    ssl:
      process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  } as DataSourceOptions;
} else {
  dataSourceOptions = {
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
  } as DataSourceOptions;
}

export const AppDataSource = new DataSource(dataSourceOptions);
