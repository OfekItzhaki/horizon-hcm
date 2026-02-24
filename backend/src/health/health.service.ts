import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CacheService } from '../common/services/cache.service';
import { LoggerService } from '../common/logger/logger.service';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
  };
}

export interface ReadinessStatus {
  status: 'ready' | 'not_ready';
  timestamp: string;
  checks: {
    database: HealthCheck;
    redis: HealthCheck;
  };
}

export interface HealthCheck {
  status: 'up' | 'down';
  responseTime?: number;
  error?: string;
}

@Injectable()
export class HealthService {
  private startTime: number;

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private logger: LoggerService,
  ) {
    this.startTime = Date.now();
  }

  /**
   * Basic health check - returns overall system health
   */
  async checkHealth(): Promise<HealthStatus> {
    const databaseCheck = await this.checkDatabase();
    const redisCheck = await this.checkRedis();

    const isHealthy = databaseCheck.status === 'up' && redisCheck.status === 'up';

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000), // seconds
      checks: {
        database: databaseCheck,
        redis: redisCheck,
      },
    };
  }

  /**
   * Readiness check - determines if app is ready to receive traffic
   * Used by Kubernetes readiness probes
   */
  async checkReadiness(): Promise<ReadinessStatus> {
    const databaseCheck = await this.checkDatabase();
    const redisCheck = await this.checkRedis();

    const isReady = databaseCheck.status === 'up' && redisCheck.status === 'up';

    return {
      status: isReady ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: databaseCheck,
        redis: redisCheck,
      },
    };
  }

  /**
   * Check database connectivity
   */
  private async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Simple query to check database connectivity
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'up',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Check Redis connectivity
   */
  private async checkRedis(): Promise<HealthCheck> {
    const startTime = Date.now();

    try {
      // Try to set and get a test key
      const testKey = 'health:check';
      const testValue = Date.now().toString();

      await this.cacheService.set(testKey, testValue, 10); // 10 second TTL
      const retrieved = await this.cacheService.get<string>(testKey);

      if (retrieved !== testValue) {
        throw new Error('Redis value mismatch');
      }

      // Clean up
      await this.cacheService.delete(testKey);

      return {
        status: 'up',
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      this.logger.error('Redis health check failed', error);
      return {
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  /**
   * Get application uptime in seconds
   */
  getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}
