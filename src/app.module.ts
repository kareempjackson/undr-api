import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { AuthModule } from "./modules/auth/auth.module";
import { FansModule } from "./modules/fans/fans.module";
import { CreatorsModule } from "./modules/creators/creators.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { AdminModule } from "./modules/admin/admin.module";
import { CommonModule } from "./modules/common/common.module";
import { SecurityModule } from "./modules/security/security.module";
import { TasksModule } from "./tasks/tasks.module";
import { DisputeModule } from "./modules/dispute/dispute.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { WithdrawalsModule } from "./modules/withdrawals/withdrawals.module";
import { DatabaseModule } from "./modules/database/database.module";
import { HealthModule } from "./modules/health/health.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
      expandVariables: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService): TypeOrmModuleOptions => {
        // Check if we have DATABASE_URL (Railway provides this)
        const databaseUrl = configService.get<string>("DATABASE_URL");
        console.log(`Database URL configured: ${!!databaseUrl}`);

        if (databaseUrl) {
          // Production/Staging with DATABASE_URL
          console.log("Using DATABASE_URL for connection");
          const maskedDbUrl = databaseUrl.replace(/:([^:@]+)@/, ":****@");
          console.log(`Connection string (masked): ${maskedDbUrl}`);

          // Parse the URL to check if it's trying to connect to localhost
          try {
            const matches = databaseUrl.match(
              /postgresql:\/\/[^:]+:[^@]+@([^:]+):/
            );
            if (
              matches &&
              (matches[1] === "localhost" ||
                matches[1] === "127.0.0.1" ||
                matches[1] === "::1")
            ) {
              console.warn(
                "WARNING: Your DATABASE_URL contains localhost/127.0.0.1/::1 which will not work in production!"
              );
            }
          } catch (e) {
            console.error("Error parsing DATABASE_URL:", e.message);
          }

          // Use the URL directly with extended options
          return {
            type: "postgres",
            url: databaseUrl,
            ssl:
              process.env.NODE_ENV === "production"
                ? { rejectUnauthorized: false }
                : false,
            autoLoadEntities: true,
            synchronize: false, // IMPORTANT: never true in production
            logging:
              process.env.NODE_ENV !== "production" ||
              process.env.DB_LOGGING === "true",
            maxQueryExecutionTime: 1000, // Log slow queries
            connectTimeoutMS: 30000, // 30 seconds connection timeout
            extra: {
              // Retry connection logic
              max: 10, // Maximum number of clients in the pool
              connectionTimeoutMillis: 30000, // Connection timeout 30s
              // Add retry for network failures
              retry: {
                maxRetryTime: 20000, // 20 seconds max retry time
                retryDelayMs: 1000, // Initial retry delay
                maxRetries: 5, // Number of retries
              },
            },
            // Enable native connection pool to prevent connection timeout
            poolSize: 20,
          };
        }

        // Fallback to individual connection parameters (DEVELOPMENT ONLY)
        console.log(
          "[AppModule] Using individual parameters for database connection"
        );
        console.log(
          `- Host: ${configService.get("POSTGRES_HOST") || "localhost"}`
        );
        console.log(
          `- Port: ${parseInt(configService.get("POSTGRES_PORT") || "5432")}`
        );
        console.log(
          `- Database: ${configService.get("POSTGRES_DB") || "ghostpay"}`
        );

        return {
          type: "postgres",
          host: configService.get("POSTGRES_HOST") || "localhost",
          port: parseInt(configService.get("POSTGRES_PORT") || "5432"),
          username: configService.get("POSTGRES_USER") || "postgres",
          password: configService.get("POSTGRES_PASSWORD"),
          database: configService.get("POSTGRES_DB") || "ghostpay",
          entities: ["dist/**/*.entity{.ts,.js}"],
          synchronize: false, // Never auto-sync in production
          logging: configService.get("NODE_ENV") === "development",
          autoLoadEntities: true,
          connectTimeoutMS: 30000, // Increase timeout
        } as TypeOrmModuleOptions;
      },
    }),
    // Comment out DatabaseModule to prevent duplicate connection attempts
    // Since we're already setting up the connection in the AppModule
    // We'll uncomment it once we've fixed the issue
    // DatabaseModule,
    HealthModule,
    CommonModule,
    AuthModule,
    FansModule,
    CreatorsModule,
    PaymentsModule,
    AdminModule,
    SecurityModule,
    TasksModule,
    DisputeModule,
    NotificationModule,
    WithdrawalsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
