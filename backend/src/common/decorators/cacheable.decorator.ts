import { SetMetadata } from '@nestjs/common';

export const CACHEABLE_KEY = 'cacheable';

export interface CacheableOptions {
  /**
   * Cache key template
   * Supports placeholders: {{param}} for method parameters
   * Example: 'buildings:{{id}}' or 'user:{{userId}}:profile'
   */
  key: string;

  /**
   * Time to live in seconds
   */
  ttl: number;

  /**
   * Optional condition function to determine if result should be cached
   * Return false to skip caching
   */
  condition?: (result: any) => boolean;
}

/**
 * Decorator to enable automatic caching on a method
 * 
 * Usage:
 * @Cacheable({ key: 'buildings:{{id}}', ttl: 300 })
 * async getBuilding(id: string) { ... }
 * 
 * The decorator will:
 * 1. Check cache for the key
 * 2. Return cached value if found
 * 3. Execute method if not found
 * 4. Cache the result
 * 5. Return the result
 */
export const Cacheable = (options: CacheableOptions) =>
  SetMetadata(CACHEABLE_KEY, options);
