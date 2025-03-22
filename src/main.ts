import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import * as bodyParser from "body-parser";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Disable built-in bodyParser for custom handling
  });

  // Configure body parsers for different routes
  // Use raw bodyParser for Stripe webhook route
  app.use((req, res, next) => {
    if (req.originalUrl === "/payments/stripe/webhook") {
      bodyParser.raw({ type: "application/json" })(req, res, next);
    } else {
      bodyParser.json()(req, res, next);
    }
  });

  // Ensure raw body is available for verification
  app.use((req, res, next) => {
    if (req.body && Buffer.isBuffer(req.body)) {
      req.rawBody = req.body;
    }
    next();
  });

  // Validation pipes for DTO validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  // CORS setup - ensure frontend URL is correctly configured
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const adminUrl = process.env.ADMIN_URL || "http://localhost:3002";

  app.enableCors({
    origin: [frontendUrl, adminUrl],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "stripe-signature"],
  });

  console.log(`CORS enabled for origins: ${frontendUrl}, ${adminUrl}`);

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle("GhostPay API")
    .setDescription("Anonymous payment system for adult creators and fans")
    .setVersion("1.0")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, document);

  // Start the application
  //const port = process.env.PORT || 3001;
  const port = 3001;
  await app.listen(port);
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();
