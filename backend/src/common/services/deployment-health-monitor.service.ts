import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from './cache.service';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  checks: {
    database: HealthStatus;
    redis: HealthStatus;
    memory: HealthStatus;
    uptime: number;
  };
}

export interface HealthStatus {
  status: 'up' | 'down';
  responseTime?: number;
  error?: string;
}

@Injectable()
export class DeploymentHealthMonitorService implements OnModuleInit, OnModuleDestroy {
  private healthCheckInterval: NodeJS.Timeout;
  private readonly CHECK_INTERVAL = 30000; // 30 seconds
  private lastHealthStatus: HealthCheckResult;
  private startTime: Date;

  constructor(
    private logger: LoggerService,
    private prisma: PrismaService,
    private cache: CacheService,
  ) {
    this.startTime = new Date();
  }

  onModuleInit(): void {
    this.startHealthChecking();
  }

  onModuleDestroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  private startHealthChecking(): void {
    // Run initial check
    this.performHealthCheck();

    // Schedule periodic checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.CHECK_INTERVAL);
  }

  private async performHealthCheck(): Promise<void> {
    const result: HealthCheckResult = {
      status: 'healthy',
      timestamp: new Date(),
      checks: {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
        memory: this.checkMemory(),
        uptime: Date.now() - this.startTime.getTime(),
      },
    };

    // Determine overall status
    const failedChecks = Object.values(result.checks).filter(
      (check) => typeof check === 'object' && check.status === 'down',
    ).length;

    if (failedChecks > 0) {
      result.status = failedChecks > 1 ? 'unhealthy' : 'degraded';
    }

    this.lastHealthStatus = result;

    // Log health status
    if (result.status !== 'healthy') {
      this.logger.logWithMetadata('warn', `Deployment health status: ${result.status}`, {
        checks: result.checks,
        timestamp: result.timestamp,
      });

      // Alert on unhealthy status
      if (result.status === 'unhealthy') {
        this.logger.logWithMetadata('error', 'CRITICAL: Deployment is unhealthy', {
          checks: result.checks,
          timestamp: result.timestamp,
        });
      }
    }
  }

  private async checkDatabase(): Promise<HealthStatus> {
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - start;

      return {
        status: 'up',
        responseTime,
      };
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkRedis(): Promise<HealthStatus> {
    try {
      const start = Date.now();
      await this.cache.set('health-check', 'ok', 10);
      const value = await this.cache.get('health-check');
      const responseTime = Date.now() - start;

      if (value === 'ok') {
        return {
          status: 'up',
          responseTime,
        };
      }

      return {
        status: 'down',
        error: 'Health check value mismatch',
      };
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private checkMemory(): HealthStatus {
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;

    // Alert if heap usage is above 90%
    if (heapUsedPercent > 90) {
      this.logger.logWithMetadata('warn', 'High memory usage detected', {
        heapUsedPercent: heapUsedPercent.toFixed(2),
        heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
        heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
      });
    }

    return {
      status: heapUsedPercent < 95 ? 'up' : 'down',
    };
  }

  async getHealthStatus(): Promise<HealthCheckResult> {
    if (!this.lastHealthStatus) {
      await this.performHealthCheck();
    }
    return this.lastHealthStatus;
  }

  async getDetailedHealth() {
    const health = await this.getHealthStatus();
    const memUsage = process.memoryUsage();

    return {
      ...health,
      memory: {
        heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(2) + ' MB',
        heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
        external: (memUsage.external / 1024 / 1024).toFixed(2) + ' MB',
        rss: (memUsage.rss / 1024 / 1024).toFixed(2) + ' MB',
      },
    };
  }
}
