import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';

/**
 * AsyncLocalStorage instance for storing correlation IDs across async operations.
 * Allows retrieving the correlation ID from anywhere in the request lifecycle.
 */
export const correlationIdStorage = new AsyncLocalStorage<string>();

/**
 * Middleware that assigns a unique correlation ID to each request.
 * 
 * Uses the X-Correlation-ID header if provided, otherwise generates a new UUID.
 * The correlation ID is stored in AsyncLocalStorage for access throughout the
 * request lifecycle and added to response headers for client-side tracking.
 * 
 * @example
 * ```typescript
 * // In app.module.ts
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer.apply(CorrelationIdMiddleware).forRoutes('*');
 *   }
 * }
 * ```
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Get correlation ID from header or generate new one
    const correlationId =
      (req.headers['x-correlation-id'] as string) || randomUUID();

    // Store in AsyncLocalStorage for access throughout request lifecycle
    correlationIdStorage.run(correlationId, () => {
      // Add to request object
      req['correlationId'] = correlationId;

      // Add to response headers
      res.setHeader('X-Correlation-ID', correlationId);

      next();
    });
  }
}

/**
 * Helper function to retrieve the current request's correlation ID.
 * 
 * @returns The correlation ID for the current request, or undefined if not in a request context
 * 
 * @example
 * ```typescript
 * const correlationId = getCorrelationId();
 * logger.log(`Processing request ${correlationId}`);
 * ```
 */
export function getCorrelationId(): string | undefined {
  return correlationIdStorage.getStore();
}
