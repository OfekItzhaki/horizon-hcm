import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';
import { CACHEABLE_KEY, CacheableOptions } from '../decorators/cacheable.decorator';
import { trackCacheHit, trackCacheMiss } from './performance.interceptor';

/**
 * Interceptor that implements automatic response caching for endpoints.
 * 
 * Works with the @Cacheable decorator to cache method responses in Redis.
 * Supports dynamic cache keys with parameter placeholders and conditional caching.
 * 
 * @example
 * ```typescript
 * @Cacheable({ key: 'user:{{userId}}', ttl: 300 })
 * @Get('users/:userId')
 * async getUser(@Param('userId') userId: string) { ... }
 * ```
 */
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private reflector: Reflector,
    private cacheService: CacheService,
  ) {}

  /**
   * Intercepts the request to check cache before executing the handler.
   * 
   * @param context - Execution context
   * @param next - Call handler for the next interceptor or route handler
   * @returns Observable with cached or fresh data
   */
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    // Get cacheable options from decorator
    const options = this.reflector.get<CacheableOptions>(
      CACHEABLE_KEY,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();

    // Generate cache key from template
    const cacheKey = this.generateCacheKey(options.key, context);

    // Try to get from cache
    const cachedValue = await this.cacheService.get(cacheKey);

    if (cachedValue !== null) {
      // Track cache hit for performance monitoring
      trackCacheHit(request);

      // Return cached value
      return of(cachedValue);
    }

    // Track cache miss
    trackCacheMiss(request);

    // Execute method and cache result
    return next.handle().pipe(
      tap(async (result) => {
        // Check condition if provided
        if (options.condition && !options.condition(result)) {
          return;
        }

        // Cache the result
        await this.cacheService.set(cacheKey, result, options.ttl);
      }),
    );
  }

  /**
   * Generate cache key from template and method parameters
   * Supports placeholders like {{param}}
   */
  private generateCacheKey(template: string, context: ExecutionContext): string {
    const handler = context.getHandler();
    const args = context.getArgs();

    // Get parameter names from function
    const paramNames = this.getParameterNames(handler);

    // Replace placeholders with actual values
    let key = template;
    paramNames.forEach((paramName, index) => {
      const placeholder = `{{${paramName}}}`;
      const value = args[index];

      if (key.includes(placeholder)) {
        // Handle different value types
        const stringValue = this.serializeValue(value);
        key = key.replace(placeholder, stringValue);
      }
    });

    return key;
  }

  /**
   * Extract parameter names from function
   */
  private getParameterNames(func: Function): string[] {
    const funcStr = func.toString();
    const match = funcStr.match(/\(([^)]*)\)/);

    if (!match || !match[1]) {
      return [];
    }

    return match[1]
      .split(',')
      .map((param) => param.trim().split('=')[0].trim())
      .filter((param) => param.length > 0);
  }

  /**
   * Serialize value for cache key
   */
  private serializeValue(value: any): string {
    if (value === null || value === undefined) {
      return 'null';
    }

    if (typeof value === 'object') {
      // For objects, use JSON stringify
      return JSON.stringify(value);
    }

    return String(value);
  }
}
