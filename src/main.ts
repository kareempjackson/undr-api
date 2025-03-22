import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import * as bodyParser from "body-parser";
import { setEncryptionService } from "./modules/common/transformers/encrypted-column.factory";
import { EncryptionService } from "./modules/security/encryption.service";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false, // Disable built-in bodyParser for custom handling
  });

  // Initialize the encryption service for entity transformers
  // This must be done early in the application lifecycle
  const encryptionService = app.get(EncryptionService);
  setEncryptionService(encryptionService);
  console.log("Encryption service initialized successfully");

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

  // Enforce HTTPS in production
  // This middleware will redirect all HTTP requests to HTTPS
  if (process.env.NODE_ENV === "production") {
    app.use((req, res, next) => {
      // Check for HTTP protocol
      if (!req.secure && req.headers["x-forwarded-proto"] !== "https") {
        // Redirect to HTTPS with 301 status (permanent redirect)
        const httpsUrl = `https://${req.headers.host}${req.url}`;
        return res.redirect(301, httpsUrl);
      }
      next();
    });
  }

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

  // Set security headers for all responses
  app.use((req, res, next) => {
    // HTTP Strict Transport Security
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
    // Prevent MIME type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");
    // Cross-site scripting protection
    res.setHeader("X-XSS-Protection", "1; mode=block");
    // Prevent clickjacking
    res.setHeader("X-Frame-Options", "DENY");
    // Content Security Policy
    res.setHeader("Content-Security-Policy", "default-src 'self'");
    // Referrer policy
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    next();
  });

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
