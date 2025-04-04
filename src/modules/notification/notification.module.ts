import { Module, Global, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { NotificationService } from "./notification.service";
import { EmailService } from "./email.service";
import { NotificationController } from "./notification.controller";
import { Notification } from "../../entities/notification.entity";
import { NotificationPreference } from "../../entities/notification-preference.entity";
import { User } from "../../entities/user.entity";
import { NotificationGateway } from "./notification.gateway";
import { JwtModule } from "@nestjs/jwt";
import { AuthModule } from "../auth/auth.module";

@Global() // Make this module global so services are available everywhere
@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, NotificationPreference, User]),
    ConfigModule,
    JwtModule.register({
      // JWT options will be used from ConfigService, this is just to make the JwtService available
    }),
    forwardRef(() => AuthModule),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, EmailService, NotificationGateway],
  exports: [NotificationService, EmailService, NotificationGateway],
})
export class NotificationModule {}
