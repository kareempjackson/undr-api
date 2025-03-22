"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const bodyParser = require("body-parser");
const encrypted_column_factory_1 = require("./modules/common/transformers/encrypted-column.factory");
const encryption_service_1 = require("./modules/security/encryption.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bodyParser: false,
    });
    const encryptionService = app.get(encryption_service_1.EncryptionService);
    (0, encrypted_column_factory_1.setEncryptionService)(encryptionService);
    console.log("Encryption service initialized successfully");
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
    const adminUrl = process.env.ADMIN_URL || "http://localhost:3002";
    app.enableCors({
        origin: [frontendUrl, adminUrl],
        methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization", "stripe-signature"],
    });
    console.log(`CORS enabled for origins: ${frontendUrl}, ${adminUrl}`);
    app.use((req, res, next) => {
        res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("X-XSS-Protection", "1; mode=block");
        res.setHeader("X-Frame-Options", "DENY");
        res.setHeader("Content-Security-Policy", "default-src 'self'");
        res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        next();
    });
    const config = new swagger_1.DocumentBuilder()
        .setTitle("GhostPay API")
        .setDescription("Anonymous payment system for adult creators and fans")
        .setVersion("1.0")
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup("api", app, document);
    const port = 3001;
    await app.listen(port);
    console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
//# sourceMappingURL=main.js.map