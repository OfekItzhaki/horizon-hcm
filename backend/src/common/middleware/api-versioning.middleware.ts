import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface DeprecatedVersion {
  version: string;
  sunsetDate: Date;
  message?: string;
}

/**
 * Middleware that handles API versioning and deprecation warnings.
 * 
 * Extracts the API version from the URL path (e.g., /api/v1/buildings) and adds
 * deprecation headers for versions that are scheduled for sunset. Implements
 * RFC 8594 Deprecation and Sunset headers.
 * 
 * @example
 * ```typescript
 * // In app.module.ts
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer.apply(ApiVersioningMiddleware).forRoutes('*');
 *   }
 * }
 * 
 * // To deprecate a version:
 * const middleware = app.get(ApiVersioningMiddleware);
 * middleware.addDeprecatedVersion('v1', new Date('2025-12-31'), 'Please migrate to v2');
 * ```
 */
@Injectable()
export class ApiVersioningMiddleware implements NestMiddleware {
  private deprecatedVersions: DeprecatedVersion[] = [
    // Example: { version: 'v1', sunsetDate: new Date('2025-12-31'), message: 'API v1 will be sunset on December 31, 2025' }
  ];

  use(req: Request, res: Response, next: NextFunction) {
    // Extract version from URL path (e.g., /api/v1/buildings)
    const versionMatch = req.path.match(/^\/api\/(v\d+)\//);
    
    if (versionMatch) {
      const version = versionMatch[1];
      
      // Check if version is deprecated
      const deprecatedVersion = this.deprecatedVersions.find(
        (dv) => dv.version === version,
      );

      if (deprecatedVersion) {
        // Add deprecation warning headers
        res.setHeader('X-API-Deprecated', 'true');
        res.setHeader(
          'X-API-Sunset-Date',
          deprecatedVersion.sunsetDate.toISOString(),
        );
        
        if (deprecatedVersion.message) {
          res.setHeader('X-API-Deprecation-Message', deprecatedVersion.message);
        }

        // Add Deprecation header (RFC 8594)
        res.setHeader('Deprecation', 'true');
        res.setHeader('Sunset', deprecatedVersion.sunsetDate.toUTCString());
      }

      // Store version in request for later use
      req['apiVersion'] = version;
    }

    next();
  }

  /**
   * Adds a version to the deprecated versions list.
   * 
   * @param version - The API version to deprecate (e.g., 'v1')
   * @param sunsetDate - The date when the version will be removed
   * @param message - Optional custom deprecation message for clients
   */
  addDeprecatedVersion(version: string, sunsetDate: Date, message?: string) {
    this.deprecatedVersions.push({ version, sunsetDate, message });
  }
}
