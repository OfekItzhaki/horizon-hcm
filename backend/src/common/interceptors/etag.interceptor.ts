import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ETagService } from '../services/etag.service';

@Injectable()
export class ETagInterceptor implements NestInterceptor {
  constructor(private etagService: ETagService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Only apply ETags to GET requests
    if (request.method !== 'GET') {
      return next.handle();
    }

    // Skip ETag for health check endpoints (they use @Res() decorator)
    if (request.url.startsWith('/health')) {
      return next.handle();
    }

    const ifNoneMatch = request.headers['if-none-match'];

    return next.handle().pipe(
      map((data) => {
        // Skip if data is null/undefined or if headers already sent
        if (!data || response.headersSent) {
          return data;
        }

        try {
          // Generate ETag for response data
          const etag = this.etagService.generateETag(data);

          // Set ETag header
          response.setHeader('ETag', etag);

          // Check if client's ETag matches
          if (ifNoneMatch) {
            const clientETags = this.etagService.parseIfNoneMatch(ifNoneMatch);
            
            if (this.etagService.matchesAny(clientETags, data)) {
              // Return 304 Not Modified
              response.status(304);
              return null;
            }
          }
        } catch (error) {
          // If ETag generation fails (e.g., circular reference), just skip it
          // Don't break the request
        }

        // Return data normally
        return data;
      }),
    );
  }
}
