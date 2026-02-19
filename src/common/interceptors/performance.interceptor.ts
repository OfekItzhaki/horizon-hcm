import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import { getCorrelationId } from '../middleware/correlation-id.middleware';

interface PerformanceMetrics {
  correlationId?: string;
  method: string;
  url: string;
  responseTime: number;
  databaseQueries?: number;
  databaseQueryTime?: number;
  cacheHits?: number;
  cacheMisses?: number;
  externalApiCalls?: number;
  externalApiTime?: number;
}

@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  constructor(
    private logger: LoggerService,
    private prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url } = request;
    const correlationId = getCorrelationId();

    const startTime = Date.now();

    // Initialize performance tracking on request object
    request.performanceMetrics = {
      databaseQueries: 0,
      databaseQueryTime: 0,
      cacheHits: 0,
      cacheMisses: 0,
      externalApiCalls: 0,
      externalApiTime: 0,
    };

    return next.handle().pipe(
      tap({
        next: () => {
          this.logPerformanceMetrics(
            method,
            url,
            correlationId,
            startTime,
            request.performanceMetrics,
            response.statusCode,
          );
        },
        error: (error) => {
          this.logPerformanceMetrics(
            method,
            url,
            correlationId,
            startTime,
            request.performanceMetrics,
            error.status || 500,
            error.message,
          );
        },
      }),
    );
  }

  private async logPerformanceMetrics(
    method: string,
    url: string,
    correlationId: string | undefined,
    startTime: number,
    metrics: any,
    statusCode?: number,
    errorMessage?: string,
  ) {
    const responseTime = Date.now() - startTime;

    const performanceData: PerformanceMetrics = {
      correlationId,
      method,
      url,
      responseTime,
      databaseQueries: metrics.databaseQueries,
      databaseQueryTime: metrics.databaseQueryTime,
      cacheHits: metrics.cacheHits,
      cacheMisses: metrics.cacheMisses,
      externalApiCalls: metrics.externalApiCalls,
      externalApiTime: metrics.externalApiTime,
    };

    // Log performance metrics
    this.logger.logWithMetadata('info', 'Performance Metrics', performanceData);

    // Store metrics in database (async, don't block response)
    this.storeMetrics(
      method,
      url,
      responseTime,
      metrics,
      statusCode,
      errorMessage,
    ).catch((error) => {
      this.logger.logWithMetadata('error', 'Failed to store performance metrics', {
        error: error.message,
      });
    });

    // Warn if response time is slow
    if (responseTime > 1000) {
      this.logger.logWithMetadata('warn', 'Slow Request Detected', {
        correlationId,
        method,
        url,
        responseTime,
      });
    }

    // Warn if too many database queries
    if (metrics.databaseQueries > 10) {
      this.logger.logWithMetadata('warn', 'High Database Query Count', {
        correlationId,
        method,
        url,
        queryCount: metrics.databaseQueries,
      });
    }
  }

  private async storeMetrics(
    method: string,
    url: string,
    responseTime: number,
    metrics: any,
    statusCode?: number,
    errorMessage?: string,
  ): Promise<void> {
    try {
      await this.prisma.performanceMetric.create({
        data: {
          endpoint: `${method} ${url}`,
          response_time_ms: responseTime,
          database_queries: metrics.databaseQueries || 0,
          database_time_ms: metrics.databaseQueryTime || 0,
          cache_hits: metrics.cacheHits || 0,
          cache_misses: metrics.cacheMisses || 0,
          external_api_calls: metrics.externalApiCalls || 0,
          external_api_time_ms: metrics.externalApiTime || 0,
          status_code: statusCode,
          error_message: errorMessage,
        },
      });
    } catch (error) {
      // Silently fail to avoid impacting application performance
    }
  }
}

// Helper functions to track metrics (to be used in services)
export function trackDatabaseQuery(request: any, queryTime: number) {
  if (request?.performanceMetrics) {
    request.performanceMetrics.databaseQueries++;
    request.performanceMetrics.databaseQueryTime += queryTime;
  }
}

export function trackCacheHit(request: any) {
  if (request?.performanceMetrics) {
    request.performanceMetrics.cacheHits++;
  }
}

export function trackCacheMiss(request: any) {
  if (request?.performanceMetrics) {
    request.performanceMetrics.cacheMisses++;
  }
}

export function trackExternalApiCall(request: any, callTime: number) {
  if (request?.performanceMetrics) {
    request.performanceMetrics.externalApiCalls++;
    request.performanceMetrics.externalApiTime += callTime;
  }
}
