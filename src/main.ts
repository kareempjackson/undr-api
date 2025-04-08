import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import * as bodyParser from "body-parser";
import { setEncryptionService } from "./modules/common/transformers/encrypted-column.factory";
import { EncryptionService } from "./modules/security/encryption.service";
import { IoAdapter } from "@nestjs/platform-socket.io";
import * as dotenv from "dotenv";
import * as os from "os";

// Load environment variables
dotenv.config();

async function bootstrap() {
  try {
    // Log system information for diagnostics
    console.log("⚡️ System Diagnostics:");
    console.log(`- OS Platform: ${os.platform()} ${os.release()}`);
    console.log(
      `- Total Memory: ${Math.round(os.totalmem() / 1024 / 1024)} MB`
    );
    console.log(`- Free Memory: ${Math.round(os.freemem() / 1024 / 1024)} MB`);
    console.log(`- Node Version: ${process.version}`);
    console.log(`- Environment: ${process.env.NODE_ENV}`);

    // Log database connection info
    if (process.env.DATABASE_URL) {
      console.log("🔌 Database Connection:");
      const maskedDbUrl = process.env.DATABASE_URL.replace(
        /:[^:@]*@/,
        ":****@"
      );
      console.log(`- URL: ${maskedDbUrl}`);
    } else {
      console.warn(
        "⚠️ Warning: DATABASE_URL not set. Using fallback connection parameters."
      );
    }

    // Remove direct migrations in bootstrap function
    // This should be handled by a separate command/process in production
    // See: migration:run script in package.json

    const app = await NestFactory.create(AppModule, {
      bodyParser: false, // Disable built-in bodyParser for custom handling
    });

    // Initialize the encryption service for entity transformers
    // This must be done early in the application lifecycle
    const encryptionService = app.get(EncryptionService);
    setEncryptionService(encryptionService);
    console.log("Encryption service initialized successfully");

    // Configure WebSockets
    app.useWebSocketAdapter(new IoAdapter(app));
    console.log("WebSocket adapter configured successfully");

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
    const frontendDevUrl = "http://localhost:3001";
    const frontendAltUrl = "http://127.0.0.1:3000"; // Sometimes used by browsers
    const frontendAltDevUrl = "http://127.0.0.1:3001"; // Sometimes used by browsers
    const adminUrl = process.env.ADMIN_URL || "http://localhost:3005";
    const vercelFrontendUrl =
      process.env.VERCEL_FRONTEND_URL || "https://vercel.com";
    const vercelDevFrontendUrl =
      process.env.VERCEL_DEV_FRONTEND_URL || "http://localhost:3001";
    const railwayUrl = process.env.RAILWAY_URL || "https://railway.app";

    // For Railway deployment - add production URLs to CORS whitelist
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
        vercelFrontendUrl,
        vercelDevFrontendUrl,
        railwayUrl,
        ...productionUrls,
      ],
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization", "stripe-signature"],
      exposedHeaders: ["Content-Range", "X-Content-Range"],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    });

    console.log(
      `CORS enabled for origins: ${frontendUrl}, ${frontendDevUrl}, ${frontendAltUrl}, ${frontendAltDevUrl}, ${adminUrl}, ${vercelFrontendUrl}, ${vercelDevFrontendUrl}, ${railwayUrl}, ${productionUrls.join(
        ", "
      )}`
    );

    // Set security headers for all responses
    app.use((req, res, next) => {
      // Skip for health check endpoint
      if (req.url === "/" && req.method === "GET") {
        return next();
      }

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
      // Referrer policy
      res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

      // Add Content-Security-Policy header that allows connections from all frontend domains
      const frontendDomains = [
        frontendUrl,
        frontendDevUrl,
        frontendAltUrl,
        frontendAltDevUrl,
        adminUrl,
        vercelFrontendUrl,
        vercelDevFrontendUrl,
        railwayUrl,
        ...productionUrls,
      ]
        .filter((url) => url)
        .map((url) => {
          try {
            // Extract domain from URL
            const domain = new URL(url).origin;
            return domain;
          } catch (e) {
            console.warn(`Invalid URL in CSP config: ${url}`);
            return null;
          }
        })
        .filter(Boolean)
        .join(" ");

      // Set a permissive CSP header for API services
      res.setHeader(
        "Content-Security-Policy",
        `default-src 'self'; connect-src 'self' ${frontendDomains}; font-src 'self' data:; img-src 'self' data:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none';`
      );

      next();
    });

    // Swagger documentation setup
    const config = new DocumentBuilder()
      .setTitle("Undr API")
      .setDescription("Anonymous payment system for adult creators and fans")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api", app, document);

    // Start the application
    const port = process.env.PORT || 3001;
    console.log(`Starting server on port ${port}...`);
    await app.listen(port, "0.0.0.0");
    console.log(`Application is running on: ${await app.getUrl()}`);
  } catch (error) {
    console.error("Application bootstrap error:", error);
    process.exit(1);
  }
}
bootstrap();
