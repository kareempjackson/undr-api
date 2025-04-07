"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const config_1 = require("@nestjs/config");
let DatabaseModule = class DatabaseModule {
};
DatabaseModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const nodeEnv = configService.get("NODE_ENV");
                    const databaseUrl = configService.get("DATABASE_URL");
                    const isProduction = nodeEnv === "production";
                    console.log(`[DatabaseModule] NODE_ENV: ${nodeEnv}`);
                    console.log(`[DatabaseModule] DATABASE_URL is ${databaseUrl ? "set" : "NOT set"}`);
                    if (databaseUrl) {
                        const dbUrlForLogs = databaseUrl.replace(/postgresql:\/\/([^:]+):([^@]+)@/, "postgresql://$1:******@");
                        console.log(`[DatabaseModule] Using DATABASE_URL: ${dbUrlForLogs}`);
                        try {
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
                                connectTimeoutMS: 30000,
                            };
                        }
                        catch (error) {
                            console.error(`[DatabaseModule] Invalid DATABASE_URL format: ${error.message}`);
                        }
                    }
                    console.log("[DatabaseModule] Using individual connection parameters");
                    return {
                        type: "postgres",
                        host: configService.get("DATABASE_HOST", "localhost"),
                        port: configService.get("DATABASE_PORT", 5432),
                        username: configService.get("POSTGRES_USER", "postgres"),
                        password: configService.get("POSTGRES_PASSWORD", "postgres"),
                        database: configService.get("POSTGRES_DB", "ghostpay"),
                        entities: [__dirname + "/../../**/*.entity{.ts,.js}"],
                        synchronize: false,
                        migrationsRun: isProduction,
                        migrations: [__dirname + "/../../migrations/*{.ts,.js}"],
                        logging: nodeEnv === "development",
                        connectTimeoutMS: 30000,
                    };
                },
            }),
        ],
    })
], DatabaseModule);
exports.DatabaseModule = DatabaseModule;
//# sourceMappingURL=database.module.js.map