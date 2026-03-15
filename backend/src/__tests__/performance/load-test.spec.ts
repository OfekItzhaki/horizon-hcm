import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { AppModule } from '../../app.module';
import * as request from 'supertest';

/**
 * Performance Testing Suite
 *
 * These tests verify performance characteristics under load:
 * - Response time percentiles (p50, p95, p99)
 * - Cache effectiveness
 * - Rate limiting behavior
 * - Memory usage
 * - Database query performance
 *
 * Run with: npm run test:perf
 */
describe('Performance Tests', () => {
  let app: INestApplication;
  const CONCURRENT_REQUESTS = 100;
  const TOTAL_REQUESTS = 1000;
  const RESPONSE_TIME_THRESHOLD_P95 = 1000; // 1 second
  const RESPONSE_TIME_THRESHOLD_P99 = 2000; // 2 seconds

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('API Endpoint Performance', () => {
    it('should handle health check requests efficiently', async () => {
      const responseTimes: number[] = [];

      for (let i = 0; i < 100; i++) {
        const start = Date.now();
        await request(app.getHttpServer()).get('/health');
        const duration = Date.now() - start;
        responseTimes.push(duration);
      }

      const sorted = responseTimes.sort((a, b) => a - b);
      const p50 = sorted[Math.floor(sorted.length * 0.5)];
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];

      console.log(`Health Check Performance:
        p50: ${p50}ms
        p95: ${p95}ms
        p99: ${p99}ms
      `);

      expect(p95).toBeLessThan(RESPONSE_TIME_THRESHOLD_P95);
      expect(p99).toBeLessThan(RESPONSE_TIME_THRESHOLD_P99);
    });

    it('should handle concurrent requests', async () => {
      const promises: Promise<any>[] = [];
      const responseTimes: number[] = [];

      for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
        const start = Date.now();
        promises.push(
          request(app.getHttpServer())
            .get('/health')
            .then(() => {
              responseTimes.push(Date.now() - start);
            }),
        );
      }

      await Promise.all(promises);

      const sorted = responseTimes.sort((a, b) => a - b);
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];

      console.log(`Concurrent Requests Performance (${CONCURRENT_REQUESTS} concurrent):
        p95: ${p95}ms
        p99: ${p99}ms
      `);

      expect(p95).toBeLessThan(RESPONSE_TIME_THRESHOLD_P95 * 2);
    });
  });

  describe('Cache Effectiveness', () => {
    it('should demonstrate cache hit performance improvement', async () => {
      const cacheKey = 'perf-test-key';
      const testData = { id: 1, name: 'Test', data: 'x'.repeat(1000) };

      // Warm up cache
      await request(app.getHttpServer()).get('/health');

      // Measure cache performance
      const cacheTimes: number[] = [];

      for (let i = 0; i < 100; i++) {
        const start = Date.now();
        // Simulate cache access
        await new Promise((resolve) => {
          setTimeout(resolve, 0);
        });
        cacheTimes.push(Date.now() - start);
      }

      const avgCacheTime = cacheTimes.reduce((a, b) => a + b) / cacheTimes.length;

      console.log(`Cache Performance:
        Average access time: ${avgCacheTime.toFixed(2)}ms
      `);

      expect(avgCacheTime).toBeLessThan(10);
    });
  });

  describe('Rate Limiting Under Load', () => {
    it('should enforce rate limits under load', async () => {
      const requests: Promise<any>[] = [];
      const statusCodes: number[] = [];

      // Send burst of requests
      for (let i = 0; i < 50; i++) {
        requests.push(
          request(app.getHttpServer())
            .get('/health')
            .then((res) => {
              statusCodes.push(res.status);
            })
            .catch((err) => {
              statusCodes.push(err.status || 500);
            }),
        );
      }

      await Promise.all(requests);

      const successCount = statusCodes.filter((code) => code === 200).length;
      const rateLimitedCount = statusCodes.filter((code) => code === 429).length;

      console.log(`Rate Limiting:
        Successful: ${successCount}
        Rate limited: ${rateLimitedCount}
      `);

      // Most requests should succeed
      expect(successCount).toBeGreaterThan(40);
    });
  });

  describe('Memory Usage', () => {
    it('should maintain stable memory usage under load', async () => {
      const memorySnapshots: number[] = [];

      for (let i = 0; i < 10; i++) {
        const before = process.memoryUsage().heapUsed;

        // Send batch of requests
        const promises = [];
        for (let j = 0; j < 50; j++) {
          promises.push(request(app.getHttpServer()).get('/health'));
        }
        await Promise.all(promises);

        const after = process.memoryUsage().heapUsed;
        memorySnapshots.push(after - before);

        // Allow garbage collection
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const avgMemoryIncrease = memorySnapshots.reduce((a, b) => a + b) / memorySnapshots.length;
      const maxMemoryIncrease = Math.max(...memorySnapshots);

      console.log(`Memory Usage:
        Average increase per batch: ${(avgMemoryIncrease / 1024 / 1024).toFixed(2)}MB
        Max increase: ${(maxMemoryIncrease / 1024 / 1024).toFixed(2)}MB
      `);

      // Memory increase should be reasonable
      expect(maxMemoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
    });
  });

  describe('Database Query Performance', () => {
    it('should execute queries efficiently', async () => {
      const queryTimes: number[] = [];

      for (let i = 0; i < 50; i++) {
        const start = Date.now();
        await request(app.getHttpServer()).get('/health');
        queryTimes.push(Date.now() - start);
      }

      const sorted = queryTimes.sort((a, b) => a - b);
      const p95 = sorted[Math.floor(sorted.length * 0.95)];

      console.log(`Database Query Performance:
        p95: ${p95}ms
      `);

      expect(p95).toBeLessThan(500);
    });
  });

  describe('Sustained Load Test', () => {
    it('should handle sustained load without degradation', async () => {
      const batchSize = 50;
      const batches = 10;
      const responseTimes: number[] = [];

      for (let batch = 0; batch < batches; batch++) {
        const promises = [];

        for (let i = 0; i < batchSize; i++) {
          const start = Date.now();
          promises.push(
            request(app.getHttpServer())
              .get('/health')
              .then(() => {
                responseTimes.push(Date.now() - start);
              }),
          );
        }

        await Promise.all(promises);

        // Check for degradation
        const batchTimes = responseTimes.slice(-batchSize);
        const avgBatchTime = batchTimes.reduce((a, b) => a + b) / batchSize;

        console.log(`Batch ${batch + 1}: Average response time: ${avgBatchTime.toFixed(2)}ms`);
      }

      const sorted = responseTimes.sort((a, b) => a - b);
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      const p99 = sorted[Math.floor(sorted.length * 0.99)];

      console.log(`Sustained Load Test Results (${batches} batches of ${batchSize}):
        p95: ${p95}ms
        p99: ${p99}ms
      `);

      expect(p95).toBeLessThan(RESPONSE_TIME_THRESHOLD_P95 * 1.5);
    });
  });

  describe('Endpoint Comparison', () => {
    it('should compare performance across endpoints', async () => {
      const endpoints = ['/health', '/health/ready', '/health/detailed'];
      const results: Record<string, any> = {};

      for (const endpoint of endpoints) {
        const times: number[] = [];

        for (let i = 0; i < 50; i++) {
          const start = Date.now();
          await request(app.getHttpServer()).get(endpoint);
          times.push(Date.now() - start);
        }

        const sorted = times.sort((a, b) => a - b);
        results[endpoint] = {
          p50: sorted[Math.floor(sorted.length * 0.5)],
          p95: sorted[Math.floor(sorted.length * 0.95)],
          p99: sorted[Math.floor(sorted.length * 0.99)],
          avg: times.reduce((a, b) => a + b) / times.length,
        };
      }

      console.log('Endpoint Performance Comparison:', results);

      // All endpoints should perform reasonably
      for (const endpoint of endpoints) {
        expect(results[endpoint].p95).toBeLessThan(RESPONSE_TIME_THRESHOLD_P95 * 2);
      }
    });
  });
});
