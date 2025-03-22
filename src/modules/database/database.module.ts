import { Module, Global } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: "postgres",
        host: configService.get("DATABASE_HOST", "localhost"),
        port: configService.get("DATABASE_PORT", 5432),
        username: configService.get("POSTGRES_USER", "postgres"),
        password: configService.get("POSTGRES_PASSWORD", "postgres"),
        database: configService.get("POSTGRES_DB", "ghostpay"),
        entities: [__dirname + "/../../**/*.entity{.ts,.js}"],
        synchronize: false,
        migrationsRun: configService.get("NODE_ENV") === "production",
        migrations: [__dirname + "/../../migrations/*{.ts,.js}"],
        logging: configService.get("NODE_ENV") === "development",
      }),
    }),
  ],
})
export class DatabaseModule {}
