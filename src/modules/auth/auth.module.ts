import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { MagicLinkService } from "./magic-link.service";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { User } from "../../entities/user.entity";
import { Wallet } from "../../entities/wallet.entity";
import { MagicLink } from "../../entities/magic-link.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Wallet, MagicLink]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get("JWT_SECRET"),
        signOptions: {
          expiresIn: "7d",
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, MagicLinkService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
