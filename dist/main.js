"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const bodyParser = require("body-parser");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bodyParser: false,
    });
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