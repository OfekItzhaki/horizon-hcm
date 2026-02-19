import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Request } from 'express';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Track an analytics event
   */
  async trackEvent(
    eventName: string,
    userId?: string,
    eventData?: any,
    req?: Request,
  ): Promise<void> {
    try {
      await this.prisma.analyticsEvent.create({
        data: {
          user_id: userId,
          event_name: eventName,
          event_data: eventData,
          session_id: req?.headers['x-session-id'] as string,
          ip_address: req ? this.getClientIp(req) : undefined,
          user_agent: req?.headers['user-agent'],
        },
      });

      this.logger.log(`Event tracked: ${eventName} for user ${userId || 'anonymous'}`);
    } catch (error) {
      this.logger.error(`Failed to track event: ${error.message}`);
    }
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(
    featureName: string,
    userId: string,
  ): Promise<void> {
    try {
      // Try to increment existing usage
      const existing = await this.prisma.featureUsage.findUnique({
        where: {
          user_id_feature_name: {
            user_id: userId,
            feature_name: featureName,
          },
        },
      });

      if (existing) {
        await this.prisma.featureUsage.update({
          where: { id: existing.id },
          data: {
            usage_count: { increment: 1 },
            last_used_at: new Date(),
          },
        });
      } else {
        await this.prisma.featureUsage.create({
          data: {
            user_id: userId,
            feature_name: featureName,
          },
        });
      }

      this.logger.log(`Feature usage tracked: ${featureName} for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to track feature usage: ${error.message}`);
    }
  }

  /**
   * Get events for a user
   */
  async getUserEvents(
    userId: string,
    limit: number = 100,
    offset: number = 0,
  ) {
    return this.prisma.analyticsEvent.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  /**
   * Get feature usage statistics
   */
  async getFeatureUsageStats(featureName?: string) {
    const where = featureName ? { feature_name: featureName } : {};

    const stats = await this.prisma.featureUsage.groupBy({
      by: ['feature_name'],
      where,
      _count: {
        user_id: true,
      },
      _sum: {
        usage_count: true,
      },
    });

    return stats.map((stat) => ({
      featureName: stat.feature_name,
      uniqueUsers: stat._count.user_id,
      totalUsage: stat._sum.usage_count || 0,
    }));
  }

  /**
   * Get user's feature usage
   */
  async getUserFeatureUsage(userId: string) {
    return this.prisma.featureUsage.findMany({
      where: { user_id: userId },
      orderBy: { last_used_at: 'desc' },
    });
  }

  /**
   * Get event counts by name
   */
  async getEventCounts(
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ eventName: string; count: number }[]> {
    const where: any = {};

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = startDate;
      if (endDate) where.created_at.lte = endDate;
    }

    const counts = await this.prisma.analyticsEvent.groupBy({
      by: ['event_name'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    return counts.map((c) => ({
      eventName: c.event_name,
      count: c._count.id,
    }));
  }

  /**
   * Get active users count
   */
  async getActiveUsersCount(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.analyticsEvent.findMany({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
        user_id: {
          not: null,
        },
      },
      distinct: ['user_id'],
      select: {
        user_id: true,
      },
    });

    return result.length;
  }

  /**
   * Extract client IP address from request
   */
  private getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = (forwarded as string).split(',');
      return ips[0].trim();
    }

    return req.ip || req.socket.remoteAddress || 'unknown';
  }

  /**
   * Get performance metrics
   */
  async getPerformanceMetrics(where: any = {}) {
    const metrics = await this.prisma.performanceMetric.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 100,
    });

    // Calculate aggregates
    const avgResponseTime =
      metrics.reduce((sum, m) => sum + m.response_time_ms, 0) / metrics.length || 0;
    const avgDatabaseQueries =
      metrics.reduce((sum, m) => sum + m.database_queries, 0) / metrics.length || 0;
    const errorRate =
      (metrics.filter((m) => m.status_code && m.status_code >= 400).length /
        metrics.length) *
        100 || 0;

    return {
      summary: {
        totalRequests: metrics.length,
        avgResponseTime: Math.round(avgResponseTime),
        avgDatabaseQueries: Math.round(avgDatabaseQueries * 10) / 10,
        errorRate: Math.round(errorRate * 10) / 10,
      },
      recentMetrics: metrics.slice(0, 20),
    };
  }

  /**
   * Get slow endpoints
   */
  async getSlowEndpoints(thresholdMs: number = 1000) {
    const slowMetrics = await this.prisma.performanceMetric.findMany({
      where: {
        response_time_ms: {
          gte: thresholdMs,
        },
      },
      orderBy: { response_time_ms: 'desc' },
      take: 50,
    });

    // Group by endpoint
    const grouped = slowMetrics.reduce((acc: any, metric) => {
      if (!acc[metric.endpoint]) {
        acc[metric.endpoint] = {
          endpoint: metric.endpoint,
          count: 0,
          maxResponseTime: 0,
          avgResponseTime: 0,
          totalResponseTime: 0,
        };
      }

      acc[metric.endpoint].count++;
      acc[metric.endpoint].totalResponseTime += metric.response_time_ms;
      acc[metric.endpoint].maxResponseTime = Math.max(
        acc[metric.endpoint].maxResponseTime,
        metric.response_time_ms,
      );

      return acc;
    }, {});

    // Calculate averages
    const result = Object.values(grouped).map((g: any) => ({
      endpoint: g.endpoint,
      count: g.count,
      maxResponseTime: g.maxResponseTime,
      avgResponseTime: Math.round(g.totalResponseTime / g.count),
    }));

    return result.sort((a: any, b: any) => b.avgResponseTime - a.avgResponseTime);
  }
}
