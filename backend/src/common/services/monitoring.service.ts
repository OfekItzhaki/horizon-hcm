import { Injectable } from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

export interface AlertConfig {
  name: string;
  condition: (metrics: PerformanceMetrics) => boolean;
  severity: 'critical' | 'warning' | 'info';
  message: (metrics: PerformanceMetrics) => string;
}

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  errorRate: number;
  timestamp: Date;
  dbQueryCount: number;
  cacheHitRate: number;
}

@Injectable()
export class MonitoringService {
  private alerts: AlertConfig[] = [];
  private metricsBuffer: PerformanceMetrics[] = [];
  private readonly BUFFER_SIZE = 100;
  private readonly CHECK_INTERVAL = 60000; // 1 minute

  constructor(private logger: LoggerService) {
    this.initializeDefaultAlerts();
    this.startMonitoring();
  }

  private initializeDefaultAlerts(): void {
    // Alert for high error rates
    this.registerAlert({
      name: 'High Error Rate',
      condition: (metrics) => metrics.errorRate > 0.05, // > 5%
      severity: 'critical',
      message: (metrics) =>
        `High error rate detected on ${metrics.endpoint}: ${(metrics.errorRate * 100).toFixed(2)}%`,
    });

    // Alert for slow responses
    this.registerAlert({
      name: 'Slow Response Time',
      condition: (metrics) => metrics.responseTime > 5000, // > 5 seconds
      severity: 'warning',
      message: (metrics) =>
        `Slow response detected on ${metrics.endpoint}: ${metrics.responseTime}ms`,
    });

    // Alert for database performance
    this.registerAlert({
      name: 'High Database Query Count',
      condition: (metrics) => metrics.dbQueryCount > 50,
      severity: 'warning',
      message: (metrics) =>
        `High database query count on ${metrics.endpoint}: ${metrics.dbQueryCount} queries`,
    });

    // Alert for low cache hit rate
    this.registerAlert({
      name: 'Low Cache Hit Rate',
      condition: (metrics) => metrics.cacheHitRate < 0.3 && metrics.cacheHitRate > 0, // < 30%
      severity: 'info',
      message: (metrics) =>
        `Low cache hit rate on ${metrics.endpoint}: ${(metrics.cacheHitRate * 100).toFixed(2)}%`,
    });

    // Alert for 5xx errors
    this.registerAlert({
      name: 'Server Error',
      condition: (metrics) => metrics.statusCode >= 500,
      severity: 'critical',
      message: (metrics) =>
        `Server error on ${metrics.method} ${metrics.endpoint}: ${metrics.statusCode}`,
    });
  }

  registerAlert(alert: AlertConfig): void {
    this.alerts.push(alert);
  }

  recordMetrics(metrics: PerformanceMetrics): void {
    this.metricsBuffer.push(metrics);

    // Keep buffer size manageable
    if (this.metricsBuffer.length > this.BUFFER_SIZE) {
      this.metricsBuffer.shift();
    }

    // Check alerts immediately for critical issues
    this.checkAlerts(metrics);
  }

  private checkAlerts(metrics: PerformanceMetrics): void {
    for (const alert of this.alerts) {
      if (alert.condition(metrics)) {
        const message = alert.message(metrics);
        this.triggerAlert(alert.name, message, alert.severity);
      }
    }
  }

  private triggerAlert(name: string, message: string, severity: string): void {
    const logLevel = severity === 'critical' ? 'error' : severity === 'warning' ? 'warn' : 'info';
    this.logger.logWithMetadata(logLevel, `[ALERT] ${name}: ${message}`, {
      alertName: name,
      severity,
      timestamp: new Date(),
    });
  }

  private startMonitoring(): void {
    setInterval(() => {
      this.analyzeMetrics();
    }, this.CHECK_INTERVAL);
  }

  private analyzeMetrics(): void {
    if (this.metricsBuffer.length === 0) return;

    // Calculate aggregate metrics
    const totalRequests = this.metricsBuffer.length;
    const errorCount = this.metricsBuffer.filter((m) => m.statusCode >= 400).length;
    const avgResponseTime =
      this.metricsBuffer.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;
    const avgErrorRate =
      this.metricsBuffer.reduce((sum, m) => sum + m.errorRate, 0) / totalRequests;

    // Log health metrics
    this.logger.logWithMetadata('info', 'Health metrics snapshot', {
      totalRequests,
      errorCount,
      errorRate: (errorCount / totalRequests) * 100,
      avgResponseTime: avgResponseTime.toFixed(2),
      avgErrorRate: (avgErrorRate * 100).toFixed(2),
      timestamp: new Date(),
    });

    // Check for error rate spike
    if (errorCount / totalRequests > 0.1) {
      this.triggerAlert(
        'Error Rate Spike',
        `Error rate spike detected: ${((errorCount / totalRequests) * 100).toFixed(2)}%`,
        'critical',
      );
    }
  }

  getMetricsSnapshot() {
    return {
      bufferSize: this.metricsBuffer.length,
      metrics: this.metricsBuffer.slice(-10), // Last 10 metrics
      timestamp: new Date(),
    };
  }

  clearMetrics(): void {
    this.metricsBuffer = [];
  }
}
