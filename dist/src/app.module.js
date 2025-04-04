"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const auth_module_1 = require("./modules/auth/auth.module");
const fans_module_1 = require("./modules/fans/fans.module");
const creators_module_1 = require("./modules/creators/creators.module");
const payments_module_1 = require("./modules/payments/payments.module");
const admin_module_1 = require("./modules/admin/admin.module");
const common_module_1 = require("./modules/common/common.module");
const security_module_1 = require("./modules/security/security.module");
const tasks_module_1 = require("./tasks/tasks.module");
const dispute_module_1 = require("./modules/dispute/dispute.module");
const notification_module_1 = require("./modules/notification/notification.module");
const withdrawals_module_1 = require("./modules/withdrawals/withdrawals.module");
const database_module_1 = require("./modules/database/database.module");
let AppModule = class AppModule {
};
AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ".env",
                expandVariables: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
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
            common_module_1.CommonModule,
            auth_module_1.AuthModule,
            fans_module_1.FansModule,
            creators_module_1.CreatorsModule,
            payments_module_1.PaymentsModule,
            admin_module_1.AdminModule,
            security_module_1.SecurityModule,
            tasks_module_1.TasksModule,
            dispute_module_1.DisputeModule,
            notification_module_1.NotificationModule,
            withdrawals_module_1.WithdrawalsModule,
            database_module_1.DatabaseModule,
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
exports.AppModule = AppModule;
//# sourceMappingURL=app.module.js.map