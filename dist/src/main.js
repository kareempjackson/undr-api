"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const bodyParser = require("body-parser");
const encrypted_column_factory_1 = require("./modules/common/transformers/encrypted-column.factory");
const encryption_service_1 = require("./modules/security/encryption.service");
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const dotenv = require("dotenv");
const data_source_1 = require("./data-source");
dotenv.config();
async function bootstrap() {
    try {
        if (process.env.NODE_ENV === "production" && process.env.DATABASE_URL) {
            try {
                console.log("Attempting to run migrations...");
                await data_source_1.AppDataSource.initialize();
                await data_source_1.AppDataSource.runMigrations();
                console.log("Migrations completed successfully");
                await data_source_1.AppDataSource.destroy();
            }
            catch (error) {
                console.error("Error running migrations:", error);
            }
        }
        const app = await core_1.NestFactory.create(app_module_1.AppModule, {
            bodyParser: false,
        });
        const encryptionService = app.get(encryption_service_1.EncryptionService);
        (0, encrypted_column_factory_1.setEncryptionService)(encryptionService);
        console.log("Encryption service initialized successfully");
        app.useWebSocketAdapter(new platform_socket_io_1.IoAdapter(app));
        console.log("WebSocket adapter configured successfully");
        app.use((req, res, next) => {
            if (req.originalUrl === "/payments/stripe/webhook") {
                bodyParser.raw({ type: "application/json" })(req, res, next);
            }
            else {
                bodyParser.json()(req, res, next);
            }
        });
        app.use((req, res, next) => {
            if (req.body && Buffer.isBuffer(req.body)) {
                req.rawBody = req.body;
            }
            next();
        });
        if (process.env.NODE_ENV === "production") {
            app.use((req, res, next) => {
                if (!req.secure && req.headers["x-forwarded-proto"] !== "https") {
                    const httpsUrl = `https://${req.headers.host}${req.url}`;
                    return res.redirect(301, httpsUrl);
                }
                next();
            });
        }
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            transform: true,
            transformOptions: { enableImplicitConversion: true },
        }));
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const frontendDevUrl = "http://localhost:3001";
        const frontendAltUrl = "http://127.0.0.1:3000";
        const frontendAltDevUrl = "http://127.0.0.1:3001";
        const adminUrl = process.env.ADMIN_URL || "http://localhost:3005";
        const productionUrls = process.env.PRODUCTION_URLS
            ? process.env.PRODUCTION_URLS.split(",")
            : [];
        app.enableCors({
            origin: [
                frontendUrl,
                frontendDevUrl,
                frontendAltUrl,
                frontendAltDevUrl,
                adminUrl,
                ...productionUrls,
            ],
            methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
            credentials: true,
            allowedHeaders: ["Content-Type", "Authorization", "stripe-signature"],
            exposedHeaders: ["Content-Range", "X-Content-Range"],
            preflightContinue: false,
            optionsSuccessStatus: 204,
        });
        console.log(`CORS enabled for origins: ${frontendUrl}, ${frontendDevUrl}, ${frontendAltUrl}, ${frontendAltDevUrl}, ${adminUrl}, ${productionUrls.join(", ")}`);
        app.use((req, res, next) => {
            res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.setHeader("X-XSS-Protection", "1; mode=block");
            res.setHeader("X-Frame-Options", "DENY");
            res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
            next();
        });
        const config = new swagger_1.DocumentBuilder()
            .setTitle("Undr API")
            .setDescription("Anonymous payment system for adult creators and fans")
            .setVersion("1.0")
            .addBearerAuth()
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup("api", app, document);
        const port = process.env.PORT || 3001;
        await app.listen(port);
        console.log(`Application is running on: ${await app.getUrl()}`);
    }
    catch (error) {
        console.error("Application bootstrap error:", error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map