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
        // Check if DATABASE_URL is provided (Railway or other PaaS)
        const databaseUrl = configService.get<string>("DATABASE_URL");
        const isProduction = configService.get("NODE_ENV") === "production";

        console.log(`[AppModule] Database connection info:`);
        console.log(`- NODE_ENV: ${configService.get("NODE_ENV")}`);
        console.log(`- Has DATABASE_URL: ${!!databaseUrl}`);
        if (databaseUrl) {
          // Mask password for security in logs
          const maskedUrl = databaseUrl.replace(/:[^:@]*@/, ":****@");
          console.log(`- DATABASE_URL: ${maskedUrl}`);
        }

        if (databaseUrl) {
          // If DATABASE_URL is provided, use it directly
          console.log("[AppModule] Using DATABASE_URL for connection");
          return {
            type: "postgres",
            url: databaseUrl,
            entities: ["dist/**/*.entity{.ts,.js}"],
            synchronize: false, // Never auto-sync in production
            logging: configService.get("NODE_ENV") === "development",
            autoLoadEntities: true,
            connectTimeoutMS: 30000, // Increase timeout for connection attempts
            ssl: isProduction ? { rejectUnauthorized: false } : false,
          } as TypeOrmModuleOptions;
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
