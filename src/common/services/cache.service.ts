import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType;
  private readonly defaultTTL = 300; // 5 minutes default

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {}

  async onModuleInit() {
    const redisHost = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const redisPort = this.configService.get<number>('REDIS_PORT') || 6379;

    this.client = createClient({
      socket: {
        host: redisHost,
        port: redisPort,
      },
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      this.logger.log('Redis Client Connected', 'CacheService');
    });

    await this.client.connect();
  }

  async onModuleDestroy() {
    await this.client.quit();
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(this.namespaceKey(key));
      if (!value) return null;

      return JSON.parse(value as string) as T;
    } catch (error) {
      this.logger.error(`Cache get error for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const namespacedKey = this.namespaceKey(key);
      const ttlSeconds = ttl || this.defaultTTL;

      await this.client.setEx(namespacedKey, ttlSeconds, serialized);
    } catch (error) {
      this.logger.error(`Cache set error for key: ${key}`, error);
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.client.del(this.namespaceKey(key));
    } catch (error) {
      this.logger.error(`Cache delete error for key: ${key}`, error);
    }
  }

  /**
   * Delete multiple keys matching a pattern
   * Example: invalidatePattern('user:*') deletes all keys starting with 'user:'
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const namespacedPattern = this.namespaceKey(pattern);
      const keys = await this.client.keys(namespacedPattern);

      if (keys.length > 0) {
        await this.client.del(keys);
        this.logger.log(
          `Invalidated ${keys.length} cache keys matching pattern: ${pattern}`,
          'CacheService',
        );
      }
    } catch (error) {
      this.logger.error(`Cache invalidate pattern error: ${pattern}`, error);
    }
  }

  /**
   * Cache-aside pattern: Get from cache or execute factory function
   * Automatically caches the result if not found
   */
  async remember<T>(
    key: string,
    ttl: number,
    factory: () => Promise<T>,
  ): Promise<T> {
    // Try to get from cache
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Execute factory function
    const value = await factory();

    // Cache the result
    await this.set(key, value, ttl);

    return value;
  }

  /**
   * Check if key exists in cache
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(this.namespaceKey(key));
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache exists error for key: ${key}`, error);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key (in seconds)
   */
  async ttl(key: string): Promise<number> {
    try {
      return await this.client.ttl(this.namespaceKey(key));
    } catch (error) {
      this.logger.error(`Cache TTL error for key: ${key}`, error);
      return -1;
    }
  }

  /**
   * Increment a numeric value in cache
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.client.incrBy(this.namespaceKey(key), amount);
    } catch (error) {
      this.logger.error(`Cache increment error for key: ${key}`, error);
      return 0;
    }
  }

  /**
   * Decrement a numeric value in cache
   */
  async decrement(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.client.decrBy(this.namespaceKey(key), amount);
    } catch (error) {
      this.logger.error(`Cache decrement error for key: ${key}`, error);
      return 0;
    }
  }

  /**
   * Clear all cache (use with caution!)
   */
  async clear(): Promise<void> {
    try {
      await this.client.flushDb();
      this.logger.log('Cache cleared', 'CacheService');
    } catch (error) {
      this.logger.error('Cache clear error', error);
    }
  }

  /**
   * Add namespace prefix to keys for organization
   */
  private namespaceKey(key: string): string {
    const namespace = this.configService.get<string>('CACHE_NAMESPACE') || 'horizon-hcm';
    return `${namespace}:${key}`;
  }

  /**
   * Get keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    try {
      const namespacedPattern = this.namespaceKey(pattern);
      return await this.client.keys(namespacedPattern);
    } catch (error) {
      this.logger.error(`Cache keys error for pattern: ${pattern}`, error);
      return [];
    }
  }

  /**
   * Get the raw Redis client for advanced operations
   */
  getClient(): RedisClientType {
    return this.client;
  }
}
