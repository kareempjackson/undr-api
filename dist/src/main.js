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
const os = require("os");
dotenv.config();
async function bootstrap() {
    try {
        console.log("⚡️ System Diagnostics:");
        console.log(`- OS Platform: ${os.platform()} ${os.release()}`);
        console.log(`- Total Memory: ${Math.round(os.totalmem() / 1024 / 1024)} MB`);
        console.log(`- Free Memory: ${Math.round(os.freemem() / 1024 / 1024)} MB`);
        console.log(`- Node Version: ${process.version}`);
        console.log(`- Environment: ${process.env.NODE_ENV}`);
        if (process.env.DATABASE_URL) {
            console.log("🔌 Database Connection:");
            const maskedDbUrl = process.env.DATABASE_URL.replace(/:[^:@]*@/, ":****@");
            console.log(`- URL: ${maskedDbUrl}`);
        }
        else {
            console.warn("⚠️ Warning: DATABASE_URL not set. Using fallback connection parameters.");
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
        app.use((req, res, next) => {
            if (req.url === "/" && req.method === "GET") {
                console.log("Health check request received");
                return res.status(200).send("OK");
            }
            next();
        });
        if (process.env.NODE_ENV === "production") {
            app.use((req, res, next) => {
                if (req.url === "/" && req.method === "GET") {
                    return next();
                }
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
        const vercelFrontendUrl = "https://undr-frontend.vercel.app";
        const vercelDevFrontendUrl = "https://undr-frontend-dev.vercel.app";
        const railwayUrl = "https://undr-api-production.up.railway.app";
        const productionUrls = process.env.PRODUCTION_URLS
            ? process.env.PRODUCTION_URLS.split(",")
            : [];
        console.log("Setting up CORS with the following origins:");
        [
            frontendUrl,
            frontendDevUrl,
            frontendAltUrl,
            frontendAltDevUrl,
            adminUrl,
            vercelFrontendUrl,
            vercelDevFrontendUrl,
            railwayUrl,
            ...productionUrls,
        ].forEach((url) => console.log(`- ${url}`));
        app.enableCors({
            origin: (origin, callback) => {
                const allowedOrigins = [
                    frontendUrl,
                    frontendDevUrl,
                    frontendAltUrl,
                    frontendAltDevUrl,
                    adminUrl,
                    vercelFrontendUrl,
                    vercelDevFrontendUrl,
                    railwayUrl,
                    ...productionUrls,
                ];
                if (!origin || allowedOrigins.indexOf(origin) !== -1) {
                    callback(null, true);
                }
                else {
                    console.warn(`CORS blocked request from origin: ${origin}`);
                    callback(null, false);
                }
            },
            methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
            credentials: true,
            allowedHeaders: ["Content-Type", "Authorization", "stripe-signature"],
            exposedHeaders: ["Content-Range", "X-Content-Range"],
            preflightContinue: false,
            optionsSuccessStatus: 204,
        });
        console.log("CORS configuration complete");
        app.use((req, res, next) => {
            if (req.url === "/" && req.method === "GET") {
                return next();
            }
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
        console.log(`Starting server on port ${port}...`);
        await app.listen(port, "0.0.0.0");
        console.log(`Application is running on: ${await app.getUrl()}`);
    }
    catch (error) {
        console.error("Application bootstrap error:", error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map