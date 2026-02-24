/**
 * Performance Monitoring Utility
 * 
 * Tracks Web Vitals and custom performance metrics.
 */

import { analytics } from './analytics';

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

class PerformanceMonitor {
  private isDevelopment = import.meta.env.DEV;

  /**
   * Initialize performance monitoring
   */
  init() {
    if (this.isDevelopment) {
      console.log('Performance monitoring initialized');
    }

    // Monitor Web Vitals
    this.monitorWebVitals();

    // Monitor custom metrics
    this.monitorCustomMetrics();
  }

  /**
   * Monitor Web Vitals (CLS, FID, FCP, LCP, TTFB)
   */
  private monitorWebVitals() {
    // In production, you would use web-vitals library:
    // import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
    // 
    // getCLS(this.reportMetric.bind(this));
    // getFID(this.reportMetric.bind(this));
    // getFCP(this.reportMetric.bind(this));
    // getLCP(this.reportMetric.bind(this));
    // getTTFB(this.reportMetric.bind(this));
  }

  /**
   * Monitor custom performance metrics
   */
  private monitorCustomMetrics() {
    // Monitor navigation timing
    if (window.performance && window.performance.timing) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = window.performance.timing;
          const loadTime = timing.loadEventEnd - timing.navigationStart;
          const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
          const renderTime = timing.domComplete - timing.domLoading;

          this.reportCustomMetric('Page Load Time', loadTime);
          this.reportCustomMetric('DOM Ready Time', domReadyTime);
          this.reportCustomMetric('Render Time', renderTime);
        }, 0);
      });
    }

    // Monitor resource timing
    this.monitorResourceTiming();
  }

  /**
   * Monitor resource loading performance
   */
  private monitorResourceTiming() {
    if (window.performance && window.performance.getEntriesByType) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const resources = window.performance.getEntriesByType('resource');
          
          // Calculate total resource size
          let totalSize = 0;
          let scriptSize = 0;
          let styleSize = 0;
          let imageSize = 0;

          resources.forEach((resource: any) => {
            const size = resource.transferSize || 0;
            totalSize += size;

            if (resource.initiatorType === 'script') {
              scriptSize += size;
            } else if (resource.initiatorType === 'css' || resource.initiatorType === 'link') {
              styleSize += size;
            } else if (resource.initiatorType === 'img') {
              imageSize += size;
            }
          });

          this.reportCustomMetric('Total Resource Size', totalSize / 1024); // KB
          this.reportCustomMetric('Script Size', scriptSize / 1024); // KB
          this.reportCustomMetric('Style Size', styleSize / 1024); // KB
          this.reportCustomMetric('Image Size', imageSize / 1024); // KB
        }, 0);
      });
    }
  }

  /**
   * Report Web Vital metric
   */
  private reportMetric(metric: PerformanceMetric) {
    if (this.isDevelopment) {
      console.log(`[${metric.rating}] ${metric.name}:`, metric.value);
    }

    // Track in analytics
    analytics.trackPerformance(metric.name, metric.value);
  }

  /**
   * Report custom metric
   */
  private reportCustomMetric(name: string, value: number) {
    if (this.isDevelopment) {
      console.log(`[Performance] ${name}:`, value);
    }

    // Track in analytics
    analytics.trackPerformance(name, value);
  }

  /**
   * Measure function execution time
   */
  measureFunction<T>(name: string, fn: () => T): T {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    this.reportCustomMetric(`Function: ${name}`, duration);

    return result;
  }

  /**
   * Measure async function execution time
   */
  async measureAsyncFunction<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    const duration = endTime - startTime;

    this.reportCustomMetric(`Async Function: ${name}`, duration);

    return result;
  }

  /**
   * Mark performance milestone
   */
  mark(name: string) {
    if (window.performance && window.performance.mark) {
      window.performance.mark(name);
    }
  }

  /**
   * Measure between two marks
   */
  measure(name: string, startMark: string, endMark: string) {
    if (window.performance && window.performance.measure) {
      try {
        window.performance.measure(name, startMark, endMark);
        const measure = window.performance.getEntriesByName(name)[0];
        this.reportCustomMetric(name, measure.duration);
      } catch (error) {
        console.error('Performance measure error:', error);
      }
    }
  }

  /**
   * Get performance entries
   */
  getEntries(type?: string): PerformanceEntry[] {
    if (!window.performance) return [];

    if (type) {
      return window.performance.getEntriesByType(type);
    }

    return window.performance.getEntries();
  }

  /**
   * Clear performance entries
   */
  clearEntries() {
    if (window.performance && window.performance.clearMarks) {
      window.performance.clearMarks();
      window.performance.clearMeasures();
    }
  }

  /**
   * Get memory usage (Chrome only)
   */
  getMemoryUsage(): { used: number; total: number; limit: number } | null {
    const memory = (performance as any).memory;
    
    if (!memory) return null;

    return {
      used: memory.usedJSHeapSize / 1048576, // MB
      total: memory.totalJSHeapSize / 1048576, // MB
      limit: memory.jsHeapSizeLimit / 1048576, // MB
    };
  }

  /**
   * Log memory usage
   */
  logMemoryUsage() {
    const memory = this.getMemoryUsage();
    
    if (memory) {
      console.log('Memory Usage:', {
        used: `${memory.used.toFixed(2)} MB`,
        total: `${memory.total.toFixed(2)} MB`,
        limit: `${memory.limit.toFixed(2)} MB`,
        percentage: `${((memory.used / memory.limit) * 100).toFixed(2)}%`,
      });
    }
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Initialize on import
performanceMonitor.init();
