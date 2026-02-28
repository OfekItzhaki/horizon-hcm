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
import { PrismaService } from './prisma/prisma.service';
import helmet from 'helmet';
import * as compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get services
  const logger = app.get(LoggerService);
  const etagService = app.get(ETagService);
  const cacheService = app.get(CacheService);
  const reflector = app.get(Reflector);
  const prisma = app.get(PrismaService);

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
  app.useGlobalInterceptors(new PerformanceInterceptor(logger, prisma));
  app.useGlobalInterceptors(new CacheInterceptor(reflector, cacheService)); // Cache before ETag
  app.useGlobalInterceptors(new ETagInterceptor(etagService));
  app.useGlobalInterceptors(new FieldFilterInterceptor(reflector));

  // Enable CORS
  app.enableCors({
    origin: (origin, callback) => {
      // Allow all localhost origins in development
      if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        callback(null, true);
      } else if (process.env.NODE_ENV === 'production' && origin === process.env.FRONTEND_URL) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
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

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`, 'Bootstrap');
  logger.log(`Swagger documentation: http://localhost:${port}/api/docs`, 'Bootstrap');
}
bootstrap();
