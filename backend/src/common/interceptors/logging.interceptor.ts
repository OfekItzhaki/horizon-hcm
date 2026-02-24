import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';
import { getCorrelationId } from '../middleware/correlation-id.middleware';

/**
 * Interceptor that logs all incoming requests and their responses.
 * 
 * Logs request details (method, URL, body) and response details (status, time).
 * Automatically sanitizes sensitive fields like passwords and tokens.
 * Includes correlation ID for request tracing.
 * 
 * @example
 * ```typescript
 * // Applied globally in main.ts
 * app.useGlobalInterceptors(new LoggingInterceptor(logger));
 * ```
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private logger: LoggerService) {}

  /**
   * Intercepts the request to log details before and after execution.
   * 
   * @param context - Execution context
   * @param next - Call handler for the next interceptor or route handler
   * @returns Observable with logging
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body } = request;
    const userAgent = request.get('user-agent') || '';
    const ip = request.ip;
    const correlationId = getCorrelationId();

    const now = Date.now();

    this.logger.logWithMetadata('info', 'Incoming Request', {
      correlationId,
      method,
      url,
      userAgent,
      ip,
      body: this.sanitizeBody(body),
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const responseTime = Date.now() - now;

          this.logger.logWithMetadata('info', 'Request Completed', {
            correlationId,
            method,
            url,
            statusCode,
            responseTime: `${responseTime}ms`,
          });
        },
        error: (error) => {
          const responseTime = Date.now() - now;

          this.logger.logWithMetadata('error', 'Request Failed', {
            correlationId,
            method,
            url,
            error: error.message,
            stack: error.stack,
            responseTime: `${responseTime}ms`,
          });
        },
      }),
    );
  }

  /**
   * Sanitizes sensitive fields from request body before logging.
   */
  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }
}
