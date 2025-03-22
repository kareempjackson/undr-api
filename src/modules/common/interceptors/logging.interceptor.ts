import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { Request } from "express";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const method = request.method;
    const url = request.url;
    const now = Date.now();

    // Use masked IP instead of actual IP
    const maskedIp = request.maskedIp || "no-masked-ip";
    const clientRegion = request.clientRegion || "unknown-region";

    // For admin routes or debugging, we might still have access to the raw IP
    const rawIp = request.rawIp ? `(${request.rawIp})` : "";

    return next.handle().pipe(
      tap(() => {
        const response = ctx.getResponse();
        const statusCode = response.statusCode;
        const responseTime = Date.now() - now;

        this.logger.log(
          `${method} ${url} ${statusCode} ${responseTime}ms - Region: ${clientRegion} - MaskedIP: ${maskedIp} ${rawIp}`
        );
      })
    );
  }
}
