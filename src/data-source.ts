import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "F@stskin101",
  database: process.env.POSTGRES_DB || "ghostpay",
  entities: ["src/**/*.entity{.ts,.js}"],
  migrations: ["src/migrations/*.ts"],
  //synchronize: process.env.NODE_ENV !== "production",
  synchronize: false,
  logging: process.env.NODE_ENV === "development",
});
