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
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get("POSTGRES_HOST"),
        port: parseInt(configService.get("POSTGRES_PORT")),
        username: configService.get("POSTGRES_USER"),
        password: configService.get("POSTGRES_PASSWORD"),
        database: configService.get("POSTGRES_DB"),
        entities: ["dist/**/*.entity{.ts,.js}"],
        synchronize: configService.get("NODE_ENV") !== "production",
        logging: configService.get("NODE_ENV") === "development",
        autoLoadEntities: true,
      }),
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
