import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./modules/database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { FansModule } from "./modules/fans/fans.module";
import { CreatorsModule } from "./modules/creators/creators.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { AdminModule } from "./modules/admin/admin.module";
import { CommonModule } from "./modules/common/common.module";
import { SecurityModule } from "./modules/security/security.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
      expandVariables: true,
    }),
    DatabaseModule,
    CommonModule,
    AuthModule,
    FansModule,
    CreatorsModule,
    PaymentsModule,
    AdminModule,
    SecurityModule,
  ],
})
export class AppModule {}
