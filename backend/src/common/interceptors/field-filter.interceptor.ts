import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { FIELD_FILTER_KEY } from '../decorators/field-filter.decorator';

/**
 * Interceptor that implements field filtering for API responses.
 * 
 * Allows clients to request specific fields using the ?fields=field1,field2 query parameter.
 * Supports nested fields with dot notation (e.g., ?fields=user.name,user.email).
 * Works with single objects, arrays, and paginated responses.
 * 
 * @example
 * ```typescript
 * @FieldFilter()
 * @Get('users')
 * async getUsers() { ... }
 * // Client: GET /users?fields=id,name,email
 * ```
 */
@Injectable()
export class FieldFilterInterceptor implements NestInterceptor {
  constructor(private reflector: Reflector) {}

  /**
   * Intercepts the response to filter fields based on query parameter.
   * 
   * @param context - Execution context
   * @param next - Call handler for the next interceptor or route handler
   * @returns Observable with filtered data
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // Check if field filtering is enabled for this endpoint
    const isFieldFilterEnabled = this.reflector.get<boolean>(
      FIELD_FILTER_KEY,
      context.getHandler(),
    );

    if (!isFieldFilterEnabled) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const fieldsParam = request.query.fields;

    // If no fields parameter, return all fields
    if (!fieldsParam) {
      return next.handle();
    }

    // Parse fields parameter (comma-separated)
    const requestedFields = fieldsParam.split(',').map((f: string) => f.trim());

    return next.handle().pipe(
      map((data) => {
        if (!data) return data;

        // Handle arrays
        if (Array.isArray(data)) {
          return data.map((item) => this.filterFields(item, requestedFields));
        }

        // Handle paginated responses
        if (data.data && Array.isArray(data.data)) {
          return {
            ...data,
            data: data.data.map((item: any) =>
              this.filterFields(item, requestedFields),
            ),
          };
        }

        // Handle single objects
        return this.filterFields(data, requestedFields);
      }),
    );
  }

  /**
   * Filters an object to include only the requested fields.
   */
  private filterFields(obj: any, fields: string[]): any {
    if (!obj || typeof obj !== 'object') return obj;

    const filtered: any = {};

    fields.forEach((field) => {
      // Support nested fields with dot notation (e.g., "user.name")
      if (field.includes('.')) {
        const [parent, ...rest] = field.split('.');
        if (obj[parent]) {
          if (!filtered[parent]) {
            filtered[parent] = {};
          }
          const nestedField = rest.join('.');
          const nestedValue = this.getNestedValue(obj[parent], nestedField);
          this.setNestedValue(filtered[parent], nestedField, nestedValue);
        }
      } else {
        // Simple field
        if (field in obj) {
          filtered[field] = obj[field];
        }
      }
    });

    return filtered;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }
}
