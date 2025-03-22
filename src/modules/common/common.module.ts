import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from "@nestjs/common";
import { APP_INTERCEPTOR, APP_GUARD } from "@nestjs/core";
import { IpMaskingMiddleware } from "./middleware/ip-masking.middleware";
import { LoggingInterceptor } from "./interceptors/logging.interceptor";
import { PrivacyCriticalGuard } from "./guards/privacy-critical.guard";
import { SecurityModule } from "../security/security.module";

@Module({
  imports: [
    // Import SecurityModule to access ProxyDetectionService
    SecurityModule,
  ],
  providers: [
    // Register the logging interceptor globally
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // Register the privacy critical guard globally
    {
      provide: APP_GUARD,
      useClass: PrivacyCriticalGuard,
    },
    // Provide the middleware for injection
    IpMaskingMiddleware,
  ],
  exports: [IpMaskingMiddleware],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply the IP masking middleware to all routes
    consumer
      .apply(IpMaskingMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
