import './apm'; // MUST be first - initializes APM before any other modules
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';
import { ETagInterceptor } from './common/interceptors/etag.interceptor';
import { FieldFilterInterceptor } from './common/interceptors/field-filter.interceptor';
import { CacheInterceptor } from './common/interceptors/cache.interceptor';
import { LoggerService } from './common/logger/logger.service';
import { ETagService } from './common/services/etag.service';
import { CacheService } from './common/services/cache.service';
import { MonitoringService } from './common/services/monitoring.service';
import { PrismaService } from './prisma/prisma.service';
import helmet from 'helmet';
import * as compression from 'compression';

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  // Don't crash on Redis socket errors — they're handled by the client's error event
  if ((error as any)?.name === 'SocketClosedUnexpectedlyError' ||
      (error as any)?.code === 'ECONNREFUSED') {
    console.error('[WARN] Redis connection error (non-fatal):', error.message);
    return;
  }
  console.error('[FATAL] Uncaught Exception:', error);
  process.exit(1);
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get services
  const logger = app.get(LoggerService);
  const etagService = app.get(ETagService);
  const cacheService = app.get(CacheService);
  const reflector = app.get(Reflector);
  const prisma = app.get(PrismaService);
  const monitoring = app.get(MonitoringService);

  // Security headers
  app.use(helmet());

  // Response compression (gzip/brotli)
  app.use(
    compression({
      threshold: 1024, // Only compress responses larger than 1KB
      level: 6, // Compression level (0-9, 6 is default)
    }),
  );

  // Enable validation globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Enable global interceptors (order matters!)
  app.useGlobalInterceptors(new LoggingInterceptor(logger));
  app.useGlobalInterceptors(new PerformanceInterceptor(logger, prisma, monitoring));
  app.useGlobalInterceptors(new CacheInterceptor(reflector, cacheService)); // Cache before ETag
  app.useGlobalInterceptors(new ETagInterceptor(etagService));
  app.useGlobalInterceptors(new FieldFilterInterceptor(reflector));

  // Enable CORS
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      // Allow localhost in development
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }
      // Allow Vercel preview deployments
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      // Allow explicitly configured origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });

  // Swagger/OpenAPI setup
  const config = new DocumentBuilder()
    .setTitle('Horizon-HCM API')
    .setDescription(
      'House Committee Management Platform - Modern, transparent management for residential buildings',
    )
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('buildings', 'Building management')
    .addTag('apartments', 'Apartment management')
    .addTag('payments', 'Payment system')
    .addTag('announcements', 'Announcements and communication')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Expose OpenAPI JSON for SDK generation
  app.use('/api/docs-json', (req, res) => {
    res.json(document);
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`, 'Bootstrap');
  logger.log(`Swagger documentation: http://localhost:${port}/api/docs`, 'Bootstrap');
}
bootstrap().catch((err) => {
  console.error('[FATAL] Bootstrap failed:', err);
  process.exit(1);
});
