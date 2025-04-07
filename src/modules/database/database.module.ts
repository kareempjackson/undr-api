import { Module, Global } from "@nestjs/common";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        // Check environment variables
        const nodeEnv = configService.get<string>("NODE_ENV");
        const databaseUrl = configService.get<string>("DATABASE_URL");
        const isProduction = nodeEnv === "production";

        console.log(`[DatabaseModule] NODE_ENV: ${nodeEnv}`);
        console.log(
          `[DatabaseModule] DATABASE_URL is ${databaseUrl ? "set" : "NOT set"}`
        );

        // First check if DATABASE_URL is provided
        if (databaseUrl) {
          // Mask password for logging
          const dbUrlForLogs = databaseUrl.replace(
            /postgresql:\/\/([^:]+):([^@]+)@/,
            "postgresql://$1:******@"
          );
          console.log(`[DatabaseModule] Using DATABASE_URL: ${dbUrlForLogs}`);

          try {
            // Validate URL format
            new URL(databaseUrl);

            return {
              type: "postgres",
              url: databaseUrl,
              entities: [__dirname + "/../../**/*.entity{.ts,.js}"],
              synchronize: false,
              migrationsRun: isProduction,
              migrations: [__dirname + "/../../migrations/*{.ts,.js}"],
              logging: nodeEnv === "development",
              ssl: isProduction ? { rejectUnauthorized: false } : false,
              connectTimeoutMS: 30000, // 30 seconds timeout
            };
          } catch (error) {
            console.error(
              `[DatabaseModule] Invalid DATABASE_URL format: ${error.message}`
            );
            // Continue to fallback configuration
          }
        }

        // Fallback to individual parameters - only for development
        console.log("[DatabaseModule] Using individual connection parameters");
        return {
          type: "postgres",
          host: configService.get("DATABASE_HOST", "localhost"),
          port: configService.get<number>("DATABASE_PORT", 5432),
          username: configService.get("POSTGRES_USER", "postgres"),
          password: configService.get("POSTGRES_PASSWORD", "postgres"),
          database: configService.get("POSTGRES_DB", "ghostpay"),
          entities: [__dirname + "/../../**/*.entity{.ts,.js}"],
          synchronize: false,
          migrationsRun: isProduction,
          migrations: [__dirname + "/../../migrations/*{.ts,.js}"],
          logging: nodeEnv === "development",
          connectTimeoutMS: 30000, // 30 seconds timeout
        };
      },
    }),
  ],
})
export class DatabaseModule {}
