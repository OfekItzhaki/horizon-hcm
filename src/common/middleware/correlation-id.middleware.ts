import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';

// AsyncLocalStorage instance for correlation ID
export const correlationIdStorage = new AsyncLocalStorage<string>();

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

// Helper function to get current correlation ID
export function getCorrelationId(): string | undefined {
  return correlationIdStorage.getStore();
}
