import { DataSource } from "typeorm";
import * as dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
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
