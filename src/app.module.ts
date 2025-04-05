import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
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
      useFactory: (configService: ConfigService) => {
        // Check if DATABASE_URL is provided (Railway or other PaaS)
        const databaseUrl = configService.get<string>("DATABASE_URL");

        if (databaseUrl) {
          // If DATABASE_URL is provided, use it directly
          return {
            type: "postgres",
            url: databaseUrl,
            entities: ["dist/**/*.entity{.ts,.js}"],
            synchronize: configService.get("NODE_ENV") !== "production",
            logging: configService.get("NODE_ENV") === "development",
            autoLoadEntities: true,
            ssl:
              process.env.NODE_ENV === "production"
                ? { rejectUnauthorized: false }
                : false,
          };
        }

        // Fallback to individual connection parameters
        return {
          type: "postgres",
          host: configService.get("POSTGRES_HOST") || "localhost",
          port: parseInt(configService.get("POSTGRES_PORT") || "5432"),
          username: configService.get("POSTGRES_USER") || "postgres",
          password: configService.get("POSTGRES_PASSWORD"),
          database: configService.get("POSTGRES_DB") || "ghostpay",
          entities: ["dist/**/*.entity{.ts,.js}"],
          synchronize: configService.get("NODE_ENV") !== "production",
          logging: configService.get("NODE_ENV") === "development",
          autoLoadEntities: true,
        };
      },
    }),
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
    DatabaseModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
