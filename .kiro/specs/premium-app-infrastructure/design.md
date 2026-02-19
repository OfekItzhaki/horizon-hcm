# Design Document: Premium App Infrastructure

## Overview

This design document outlines the technical approach for implementing enterprise-grade infrastructure for Horizon-HCM, a mobile-first SaaS platform for residential building management. The infrastructure builds upon the existing CQRS + Clean Architecture foundation, leveraging NestJS, PostgreSQL, Redis, and the @ofeklabs/horizon-auth package.

The design focuses on 12 critical infrastructure areas that provide cross-cutting concerns for the entire platform: structured logging and monitoring, API optimization for mobile clients, push notifications, file storage and management, offline synchronization, security and compliance, performance and scalability, comprehensive API documentation, analytics and insights, internationalization, real-time features, and DevOps automation.

### Design Philosophy

1. **Leverage Existing Infrastructure**: Build upon the already-integrated Winston logging, Seq aggregation, Helmet security, rate limiting, and Swagger documentation
2. **Mobile-First**: Optimize for mobile bandwidth, offline capabilities, and responsive user experiences
3. **CQRS Alignment**: Ensure all infrastructure components work seamlessly with the CQRS pattern
4. **Incremental Enhancement**: Add capabilities without disrupting existing functionality
5. **Cloud-Native**: Design for horizontal scalability and cloud deployment
6. **Developer Experience**: Provide excellent tooling, documentation, and debugging capabilities

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Mobile Apps  │  │ Web App      │  │ Third-Party  │          │
│  │ (iOS/Android)│  │ (React)      │  │ Integrations │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Rate Limiting │ Compression │ Versioning │ ETags         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Application Layer (NestJS)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ CQRS Commands & Queries │ Guards │ Interceptors         │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Logging &    │  │ Notification │  │ File Storage │
│ Monitoring   │  │ Service      │  │ Service      │
│ (Winston/Seq)│  │ (FCM/APNS)   │  │ (S3/Azure)   │
└──────────────┘  └──────────────┘  └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ PostgreSQL   │  │ Redis        │  │ BullMQ       │          │
│  │ (Primary DB) │  │ (Cache/Jobs) │  │ (Job Queue)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Infrastructure Components


#### 1. Logging and Monitoring System

**Current State**: Winston logger with console, file rotation, and Seq integration already configured

**Enhancements**:
- Add correlation ID middleware for request tracing across services
- Implement structured metadata enrichment (user context, tenant context, performance metrics)
- Add performance monitoring interceptor for database queries and external API calls
- Configure log retention policies with automated archival
- Implement alerting system for critical errors using Seq webhooks

**Technology Stack**:
- Winston (existing) - structured logging
- Seq (existing) - log aggregation and search
- Custom NestJS interceptors - correlation IDs, performance tracking
- Seq alerting - critical error notifications

#### 2. API Optimization Layer

**Components**:
- API versioning middleware (URL-based: /api/v1/, /api/v2/)
- Response compression middleware (gzip/brotli)
- ETag generation and conditional request handling
- Field filtering interceptor for sparse fieldsets
- Pagination utilities (cursor-based and offset-based)
- Deprecation warning headers

**Technology Stack**:
- NestJS interceptors and middleware
- compression package for gzip/brotli
- Custom decorators for field filtering
- Swagger annotations for versioning


#### 3. Push Notification Service

**Architecture**:
- Multi-provider notification service supporting FCM, APNS, and Web Push
- Template-based notification system with variable substitution
- User preference management for notification types
- Delivery tracking and retry logic with exponential backoff
- Silent notification support for background sync triggers

**Technology Stack**:
- firebase-admin SDK for FCM
- apn package for APNS
- web-push package for Web Push API
- BullMQ for async notification delivery and retries
- Redis for notification queue and delivery status

#### 4. File Storage Service

**Architecture**:
- Cloud storage abstraction layer (AWS S3, Azure Blob Storage)
- Image optimization pipeline (compression, format conversion)
- Thumbnail generation service (multiple sizes)
- Chunked upload support for large files
- Signed URL generation for secure access
- Malware scanning integration

**Technology Stack**:
- @aws-sdk/client-s3 or @azure/storage-blob
- sharp for image processing and thumbnail generation
- multer for file upload handling
- BullMQ for async image processing jobs
- ClamAV or cloud-based scanning service


#### 5. Offline Sync Engine

**Architecture**:
- Delta sync protocol (only transfer changed records)
- Conflict resolution strategy (last-write-wins with timestamp comparison)
- Operation queue with retry logic
- Optimistic update support
- Background sync capability
- Conflict logging and user notification

**Technology Stack**:
- Custom sync protocol over REST API
- Redis for sync state tracking
- PostgreSQL for change tracking (updated_at timestamps)
- BullMQ for background sync jobs
- Client-side: IndexedDB/SQLite for local storage

**Sync Protocol**:
```
1. Client sends last_sync_timestamp
2. Server queries records WHERE updated_at > last_sync_timestamp
3. Server returns delta + new sync_timestamp
4. Client applies changes with conflict detection
5. Client sends pending operations
6. Server validates and applies operations
```

#### 6. Security and Compliance Module

**Components**:
- Request signing middleware (HMAC-SHA256)
- Device fingerprinting service
- Anomaly detection system
- GDPR compliance utilities (data export, deletion)
- Audit logging system
- IP whitelisting middleware
- Enhanced password policy enforcement

**Technology Stack**:
- crypto module for HMAC signing
- fingerprintjs2 concepts for device fingerprinting
- Custom NestJS guards for security checks
- Audit log tables in PostgreSQL
- GDPR export/deletion commands


#### 7. Performance and Scalability Infrastructure

**Components**:
- Database query optimization (indexes, query analysis)
- Redis caching layer with TTL management
- CDN integration for static assets
- Connection pooling configuration
- Horizontal scaling support (stateless design)
- Load balancing ready
- Cache invalidation strategy

**Technology Stack**:
- Prisma with optimized queries and indexes
- Redis for caching (already integrated)
- ioredis for advanced Redis features
- CDN: CloudFront, Azure CDN, or Cloudflare
- Database connection pooling via Prisma

#### 8. API Documentation and Developer Tools

**Enhancements**:
- OpenAPI 3.0 spec generation (existing Swagger)
- Webhook system for event notifications
- API changelog maintenance
- Health check endpoints
- Deprecation notices

**Technology Stack**:
- @nestjs/swagger (existing)
- Custom webhook delivery system
- Health check endpoints (/health, /health/ready)
- Markdown-based changelog


#### 9. Analytics and Insights System

**Components**:
- Event tracking service
- Feature usage metrics
- Performance metrics collection
- Error rate tracking
- Business metrics dashboards
- A/B testing framework with feature flags

**Technology Stack**:
- Custom event tracking service
- PostgreSQL for metrics storage
- Redis for real-time counters
- Time-series data aggregation
- Feature flag library (unleash or custom)

#### 10. Internationalization (i18n) System

**Components**:
- Multi-language support (English, Hebrew, extensible)
- RTL layout support
- Locale-based formatting (currency, dates, times)
- Timezone conversion
- Translation management interface
- Fallback mechanism

**Technology Stack**:
- nestjs-i18n package
- JSON-based translation files
- date-fns or luxon for date/time formatting
- Custom formatters for currency and numbers


#### 11. Real-time Communication System

**Components**:
- WebSocket server for bidirectional communication
- Server-Sent Events (SSE) fallback
- Presence system (online/offline status)
- Real-time event broadcasting
- Connection health monitoring (ping/pong)
- Automatic reconnection with exponential backoff

**Technology Stack**:
- @nestjs/websockets with Socket.IO
- Redis adapter for multi-instance WebSocket support
- SSE implementation for fallback
- Custom presence tracking service

#### 12. DevOps and Deployment Infrastructure

**Components**:
- CI/CD pipeline configuration
- Blue-green deployment strategy
- Database migration automation
- Environment management (dev, staging, production)
- Secrets management
- Deployment health checks
- Rollback capability

**Technology Stack**:
- GitHub Actions or GitLab CI
- Docker and Docker Compose
- Kubernetes manifests (future)
- Prisma migrations
- Environment-specific .env files
- HashiCorp Vault or cloud secrets manager

## Components and Interfaces


### 1. Correlation ID Middleware

**Purpose**: Track requests across the entire system with unique identifiers

**Interface**:
```typescript
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void;
}

// Adds correlation ID to request headers and response headers
// Stores correlation ID in AsyncLocalStorage for access in handlers
```

**Integration**: Applied globally in AppModule

### 2. Performance Monitoring Interceptor

**Purpose**: Track and log performance metrics for all operations

**Interface**:
```typescript
@Injectable()
export class PerformanceInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}

// Tracks: response time, database query count, cache hit/miss, external API calls
```

### 3. API Versioning Module

**Purpose**: Support multiple API versions with deprecation management

**Interface**:
```typescript
@Module({})
export class ApiVersioningModule {
  static forRoot(config: VersioningConfig): DynamicModule;
}

interface VersioningConfig {
  defaultVersion: string;
  deprecatedVersions: Array<{ version: string; sunsetDate: Date }>;
}

// Usage: @ApiVersion('1') on controllers
```


### 4. Response Compression Middleware

**Purpose**: Compress API responses to reduce bandwidth

**Interface**:
```typescript
@Injectable()
export class CompressionMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void;
}

// Supports gzip and brotli based on Accept-Encoding header
// Configurable compression threshold (default: 1KB)
```

### 5. ETag Service

**Purpose**: Generate and validate ETags for cacheable resources

**Interface**:
```typescript
@Injectable()
export class ETagService {
  generateETag(data: any): string;
  validateETag(etag: string, data: any): boolean;
}

@Injectable()
export class ETagInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
}

// Returns 304 Not Modified when If-None-Match matches current ETag
```

### 6. Field Filtering Decorator

**Purpose**: Allow clients to request specific fields in responses

**Interface**:
```typescript
@FieldFilter()
@Get(':id')
async getBuilding(@Param('id') id: string, @Query('fields') fields?: string) {
  // fields = 'id,name,address' returns only those fields
}

// Implemented via custom decorator and interceptor
```


### 7. Pagination Utilities

**Purpose**: Standardized pagination for list endpoints

**Interface**:
```typescript
interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
  };
}

@Injectable()
export class PaginationService {
  async paginate<T>(
    query: PrismaQuery,
    params: PaginationParams
  ): Promise<PaginatedResponse<T>>;
}
```

### 8. Notification Service

**Purpose**: Multi-provider push notification delivery

**Interface**:
```typescript
@Injectable()
export class NotificationService {
  async sendToDevice(deviceToken: string, notification: Notification): Promise<void>;
  async sendToUser(userId: string, notification: Notification): Promise<void>;
  async sendBatch(notifications: BatchNotification[]): Promise<void>;
}

interface Notification {
  title: string;
  body: string;
  data?: Record<string, any>;
  silent?: boolean;
  template?: string;
  variables?: Record<string, string>;
}

// Supports FCM, APNS, Web Push
// Handles delivery tracking and retries via BullMQ
```


### 9. File Storage Service

**Purpose**: Cloud storage abstraction with image processing

**Interface**:
```typescript
@Injectable()
export class FileStorageService {
  async uploadFile(file: Express.Multer.File, options: UploadOptions): Promise<FileMetadata>;
  async uploadChunk(chunk: ChunkData): Promise<ChunkStatus>;
  async generateSignedUrl(fileKey: string, expiresIn: number): Promise<string>;
  async deleteFile(fileKey: string): Promise<void>;
}

@Injectable()
export class ImageProcessingService {
  async optimizeImage(file: Buffer): Promise<Buffer>;
  async generateThumbnails(file: Buffer, sizes: number[]): Promise<Map<number, Buffer>>;
}

interface FileMetadata {
  key: string;
  url: string;
  size: number;
  mimeType: string;
  thumbnails?: Record<string, string>;
}
```

### 10. Sync Service

**Purpose**: Offline data synchronization with conflict resolution

**Interface**:
```typescript
@Injectable()
export class SyncService {
  async getDelta(entityType: string, lastSyncTimestamp: Date): Promise<SyncDelta>;
  async applyOperations(operations: SyncOperation[]): Promise<SyncResult>;
  async resolveConflict(conflict: SyncConflict): Promise<Resolution>;
}

interface SyncDelta {
  created: any[];
  updated: any[];
  deleted: string[];
  syncTimestamp: Date;
}

interface SyncOperation {
  type: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  data?: any;
  timestamp: Date;
}
```


### 11. Security Services

**Purpose**: Request signing, device fingerprinting, and anomaly detection

**Interface**:
```typescript
@Injectable()
export class RequestSigningService {
  generateSignature(payload: any, secret: string): string;
  validateSignature(payload: any, signature: string, secret: string): boolean;
}

@Injectable()
export class DeviceFingerprintService {
  generateFingerprint(deviceInfo: DeviceInfo): string;
  validateDevice(userId: string, fingerprint: string): Promise<boolean>;
}

@Injectable()
export class AnomalyDetectionService {
  async detectAnomaly(event: SecurityEvent): Promise<AnomalyResult>;
  async restrictAccount(userId: string, reason: string): Promise<void>;
}

interface DeviceInfo {
  userAgent: string;
  platform: string;
  screenResolution?: string;
  timezone: string;
  language: string;
}
```

### 12. GDPR Compliance Service

**Purpose**: Data export and deletion for GDPR compliance

**Interface**:
```typescript
@Injectable()
export class GDPRService {
  async exportUserData(userId: string): Promise<UserDataExport>;
  async deleteUserData(userId: string): Promise<DeletionResult>;
  async anonymizeUserData(userId: string): Promise<void>;
}

interface UserDataExport {
  user: any;
  profile: any;
  buildings: any[];
  apartments: any[];
  payments: any[];
  exportDate: Date;
  format: 'json';
}
```


### 13. Audit Logging Service

**Purpose**: Track sensitive operations for compliance

**Interface**:
```typescript
@Injectable()
export class AuditLogService {
  async logEvent(event: AuditEvent): Promise<void>;
  async queryLogs(filters: AuditLogFilters): Promise<AuditLog[]>;
}

interface AuditEvent {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changes?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

// Stored in separate audit_logs table
// Immutable records with retention policy
```

### 14. Cache Service

**Purpose**: Redis-based caching with TTL and invalidation

**Interface**:
```typescript
@Injectable()
export class CacheService {
  async get<T>(key: string): Promise<T | null>;
  async set(key: string, value: any, ttl?: number): Promise<void>;
  async delete(key: string): Promise<void>;
  async invalidatePattern(pattern: string): Promise<void>;
  async remember<T>(key: string, ttl: number, factory: () => Promise<T>): Promise<T>;
}

// Decorator for automatic caching
@Cacheable({ ttl: 300, key: 'building:{{id}}' })
async getBuilding(id: string) { }
```


### 15. Analytics Service

**Purpose**: Track events and metrics for business insights

**Interface**:
```typescript
@Injectable()
export class AnalyticsService {
  async trackEvent(event: AnalyticsEvent): Promise<void>;
  async trackFeatureUsage(userId: string, feature: string): Promise<void>;
  async getMetrics(query: MetricsQuery): Promise<Metrics>;
}

interface AnalyticsEvent {
  userId?: string;
  eventType: string;
  properties: Record<string, any>;
  timestamp: Date;
}

interface Metrics {
  activeUsers: number;
  featureUsage: Record<string, number>;
  errorRates: Record<string, number>;
  responseTimeP95: number;
}
```

### 16. Feature Flag Service

**Purpose**: A/B testing and gradual feature rollout

**Interface**:
```typescript
@Injectable()
export class FeatureFlagService {
  async isEnabled(flag: string, userId?: string): Promise<boolean>;
  async getVariant(flag: string, userId: string): Promise<string>;
  async setFlag(flag: string, enabled: boolean, rolloutPercentage?: number): Promise<void>;
}

// Decorator for feature-gated endpoints
@FeatureFlag('new-dashboard')
@Get('dashboard')
async getDashboard() { }
```


### 17. Internationalization Service

**Purpose**: Multi-language support with locale formatting

**Interface**:
```typescript
@Injectable()
export class I18nService {
  translate(key: string, lang: string, variables?: Record<string, any>): string;
  formatCurrency(amount: number, currency: string, locale: string): string;
  formatDate(date: Date, locale: string, format?: string): string;
  formatTime(date: Date, timezone: string): string;
}

// Decorator for automatic translation
@UseI18n()
@Get('messages')
async getMessages(@I18nLang() lang: string) { }
```

### 18. WebSocket Gateway

**Purpose**: Real-time bidirectional communication

**Interface**:
```typescript
@WebSocketGateway()
export class RealtimeGateway {
  @SubscribeMessage('join-room')
  handleJoinRoom(client: Socket, room: string): void;
  
  @SubscribeMessage('leave-room')
  handleLeaveRoom(client: Socket, room: string): void;
  
  broadcastToRoom(room: string, event: string, data: any): void;
  sendToUser(userId: string, event: string, data: any): void;
}

// Presence tracking
@Injectable()
export class PresenceService {
  async setOnline(userId: string): Promise<void>;
  async setOffline(userId: string): Promise<void>;
  async getOnlineUsers(buildingId: string): Promise<string[]>;
}
```


### 19. Webhook Service

**Purpose**: Event notifications to external systems

**Interface**:
```typescript
@Injectable()
export class WebhookService {
  async registerWebhook(webhook: WebhookConfig): Promise<string>;
  async triggerWebhook(event: WebhookEvent): Promise<void>;
  async retryFailedWebhook(webhookId: string): Promise<void>;
}

interface WebhookConfig {
  url: string;
  events: string[];
  secret: string;
  active: boolean;
}

interface WebhookEvent {
  type: string;
  data: any;
  timestamp: Date;
}

// Delivery via BullMQ with retries
```

### 20. Health Check Service

**Purpose**: Application and dependency health monitoring

**Interface**:
```typescript
@Injectable()
export class HealthCheckService {
  async checkHealth(): Promise<HealthStatus>;
  async checkReadiness(): Promise<ReadinessStatus>;
}

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  checks: {
    database: boolean;
    redis: boolean;
    storage: boolean;
  };
  uptime: number;
}

// Endpoints: GET /health, GET /health/ready
```

## Data Models


### Database Schema Extensions

The following tables extend the existing Prisma schema:

```prisma
// Audit Logging
model AuditLog {
  id          String   @id @default(uuid())
  userId      String
  action      String
  entityType  String
  entityId    String
  changes     Json?
  ipAddress   String
  userAgent   String
  timestamp   DateTime @default(now())
  
  @@index([userId, timestamp])
  @@index([entityType, entityId])
  @@index([timestamp])
}

// File Storage
model File {
  id          String   @id @default(uuid())
  key         String   @unique
  filename    String
  mimeType    String
  size        Int
  url         String
  thumbnails  Json?
  uploadedBy  String
  uploadedAt  DateTime @default(now())
  scanned     Boolean  @default(false)
  scanResult  String?
  
  @@index([uploadedBy])
  @@index([uploadedAt])
}

// Notifications
model NotificationTemplate {
  id          String   @id @default(uuid())
  name        String   @unique
  title       String
  body        String
  variables   String[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model NotificationPreference {
  id          String   @id @default(uuid())
  userId      String
  type        String
  enabled     Boolean  @default(true)
  channels    String[] // ['push', 'email', 'sms']
  
  @@unique([userId, type])
}

model NotificationLog {
  id          String   @id @default(uuid())
  userId      String
  type        String
  title       String
  body        String
  status      String   // 'sent', 'failed', 'pending'
  provider    String   // 'fcm', 'apns', 'web-push'
  deviceToken String?
  error       String?
  sentAt      DateTime @default(now())
  
  @@index([userId, sentAt])
  @@index([status])
}
```


```prisma
// Analytics
model AnalyticsEvent {
  id          String   @id @default(uuid())
  userId      String?
  eventType   String
  properties  Json
  timestamp   DateTime @default(now())
  
  @@index([userId, timestamp])
  @@index([eventType, timestamp])
  @@index([timestamp])
}

model FeatureUsage {
  id          String   @id @default(uuid())
  userId      String
  feature     String
  count       Int      @default(1)
  lastUsedAt  DateTime @default(now())
  
  @@unique([userId, feature])
  @@index([feature, lastUsedAt])
}

// Feature Flags
model FeatureFlag {
  id                String   @id @default(uuid())
  name              String   @unique
  enabled           Boolean  @default(false)
  rolloutPercentage Int      @default(0)
  variants          Json?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

// Webhooks
model Webhook {
  id          String   @id @default(uuid())
  url         String
  events      String[]
  secret      String
  active      Boolean  @default(true)
  createdBy   String
  createdAt   DateTime @default(now())
  
  @@index([active])
}

model WebhookDelivery {
  id          String   @id @default(uuid())
  webhookId   String
  event       String
  payload     Json
  status      String   // 'success', 'failed', 'pending'
  attempts    Int      @default(0)
  response    String?
  deliveredAt DateTime?
  createdAt   DateTime @default(now())
  
  @@index([webhookId, createdAt])
  @@index([status])
}
```


```prisma
// Device Fingerprinting
model DeviceFingerprint {
  id          String   @id @default(uuid())
  userId      String
  fingerprint String
  deviceInfo  Json
  trusted     Boolean  @default(false)
  lastSeenAt  DateTime @default(now())
  createdAt   DateTime @default(now())
  
  @@unique([userId, fingerprint])
  @@index([userId, lastSeenAt])
}

// Sync State
model SyncState {
  id              String   @id @default(uuid())
  userId          String
  deviceId        String
  entityType      String
  lastSyncAt      DateTime
  pendingOps      Int      @default(0)
  
  @@unique([userId, deviceId, entityType])
  @@index([userId, lastSyncAt])
}

// Translations
model Translation {
  id          String   @id @default(uuid())
  key         String
  language    String
  value       String
  namespace   String   @default("default")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([key, language, namespace])
  @@index([language, namespace])
}
```

### Redis Data Structures

```typescript
// Cache keys
cache:building:{id}                    // Building data (TTL: 5 minutes)
cache:user:{id}:profile                // User profile (TTL: 10 minutes)
cache:apartments:building:{id}         // Apartment list (TTL: 5 minutes)

// Session keys (managed by @ofeklabs/horizon-auth)
session:{sessionId}                    // User session data

// Rate limiting keys
ratelimit:ip:{ip}:{endpoint}           // IP-based rate limiting
ratelimit:user:{userId}:{endpoint}     // User-based rate limiting

// Presence keys
presence:user:{userId}                 // Online status (TTL: 5 minutes)
presence:building:{buildingId}         // Set of online users

// Job queues (BullMQ)
queue:notifications                    // Notification delivery jobs
queue:file-processing                  // Image processing jobs
queue:webhooks                         // Webhook delivery jobs
queue:sync                             // Background sync jobs
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies and consolidations:

- **Logging properties (1.1, 1.2, 1.4, 1.5, 1.6)**: These can be consolidated into comprehensive logging properties that verify all required metadata is present
- **Rate limiting examples (2.8, 2.9)**: These are specific configurations of the general rate limiting property (2.7)
- **File format support (4.2, 4.4)**: These are specific examples of file validation
- **Notification provider support (3.1, 3.2, 3.3)**: These are integration concerns, not testable properties
- **GDPR operations (6.4, 6.5)**: These can be tested for completeness without the time constraints

The following properties represent unique, testable behaviors that provide comprehensive validation coverage:


### Logging and Monitoring Properties

Property 1: Request logging completeness
*For any* HTTP request, the logged request entry should contain a correlation ID, timestamp, HTTP method, path, and client information (user agent, IP address)
**Validates: Requirements 1.1**

Property 2: Response logging completeness
*For any* HTTP response, the logged response entry should contain the correlation ID from the request, status code, response time, and payload size
**Validates: Requirements 1.2**

Property 3: Log level filtering
*For any* configured log level, only log entries at or above that level should be output
**Validates: Requirements 1.3**

Property 4: Error logging completeness
*For any* error that occurs during request processing, the logged error entry should contain a stack trace, correlation ID, user context, and relevant request data
**Validates: Requirements 1.4**

Property 5: Structured log format
*For all* log entries, the output should be valid JSON with consistent field naming conventions
**Validates: Requirements 1.5**

Property 6: Performance metrics logging
*For any* request that involves database queries, external API calls, or cache operations, the log should include timing metrics for each operation type
**Validates: Requirements 1.6**


### API Optimization Properties

Property 7: Deprecation header presence
*For any* request to a deprecated API version, the response should include a deprecation warning header
**Validates: Requirements 2.2**

Property 8: Pagination support
*For any* paginated endpoint, both cursor-based and offset-based pagination should return results with correct pagination metadata (total, hasNext, hasPrev)
**Validates: Requirements 2.3**

Property 9: Field filtering
*For any* request with field filtering parameters, the response should contain only the specified fields
**Validates: Requirements 2.4**

Property 10: Response compression
*For any* request with Accept-Encoding: gzip header, the response should be compressed using gzip
**Validates: Requirements 2.5**

Property 11: ETag generation and validation
*For any* cacheable resource, an ETag should be generated, and subsequent requests with matching If-None-Match header should return 304 Not Modified
**Validates: Requirements 2.6**

Property 12: Rate limit enforcement
*For any* client exceeding rate limits, the response should be HTTP 429 with a Retry-After header indicating wait time
**Validates: Requirements 2.7**


### Push Notification Properties

Property 13: Notification preference enforcement
*For any* user with disabled notification preferences for a specific type, notifications of that type should not be sent to that user
**Validates: Requirements 3.4**

Property 14: Template variable substitution
*For any* notification template with variables, rendering the template with variable values should produce a notification with all variables correctly substituted
**Validates: Requirements 3.5**

Property 15: Multi-language notification support
*For any* notification sent to a user, the notification should be in the user's preferred language if a translation exists
**Validates: Requirements 3.6**

Property 16: Notification delivery tracking
*For any* notification sent, the delivery status (sent, failed, pending) should be tracked and logged
**Validates: Requirements 3.7**

Property 17: Notification retry with exponential backoff
*For any* failed notification delivery, the system should retry up to 3 times with exponentially increasing delays between attempts
**Validates: Requirements 3.9**


### File Storage Properties

Property 18: Image compression
*For any* uploaded image, the stored image should be compressed while maintaining acceptable quality (file size reduced without significant visual degradation)
**Validates: Requirements 4.1**

Property 19: File size validation
*For any* file upload that exceeds the maximum size limit for its type, the upload should be rejected with an error indicating the maximum allowed size
**Validates: Requirements 4.3**

Property 20: Thumbnail generation
*For any* uploaded image, thumbnails should be generated at sizes 150x150, 300x300, and 600x600 pixels
**Validates: Requirements 4.6**

Property 21: Signed URL generation
*For any* file, a signed URL should be generated with a configurable expiration time, and the URL should become invalid after expiration
**Validates: Requirements 4.7**

Property 22: Chunked upload support
*For any* large file uploaded in chunks, the system should track progress and successfully reassemble all chunks into the complete file
**Validates: Requirements 4.8**


### Offline Sync Properties

Property 23: Last-write-wins conflict resolution
*For any* conflicting changes with different timestamps, the change with the later timestamp should be applied
**Validates: Requirements 5.1**

Property 24: Sync operation retry
*For any* failed sync operation, the system should maintain it in the queue and retry with appropriate backoff logic
**Validates: Requirements 5.3**

Property 25: Delta sync efficiency
*For any* sync request with a last_sync_timestamp, only records with updated_at > last_sync_timestamp should be returned
**Validates: Requirements 5.4**

Property 26: Unresolvable conflict handling
*For any* sync conflict that cannot be resolved automatically, the conflict should be logged and the user should be notified
**Validates: Requirements 5.7**


### Security and Compliance Properties

Property 27: Request signature validation
*For any* sensitive operation, requests without valid HMAC-SHA256 signatures should be rejected
**Validates: Requirements 6.1**

Property 28: Device fingerprint generation
*For any* device information provided, a consistent fingerprint should be generated and stored for anomaly detection
**Validates: Requirements 6.2**

Property 29: Suspicious activity response
*For any* detected suspicious activity, the system should log the activity, restrict the account, and notify administrators
**Validates: Requirements 6.3**

Property 30: GDPR data export completeness
*For any* user data export request, the exported JSON should contain all user data including profile, buildings, apartments, and payments
**Validates: Requirements 6.4**

Property 31: GDPR data deletion completeness
*For any* user data deletion request, all user data should be permanently removed from the database
**Validates: Requirements 6.5**

Property 32: Audit log creation
*For any* sensitive operation (authentication, data access, permission change), an audit log entry should be created with all required metadata
**Validates: Requirements 6.6**

Property 33: IP whitelist enforcement
*For any* request from a non-whitelisted IP address when IP whitelisting is enabled, the request should be rejected
**Validates: Requirements 6.7**

Property 34: Password policy enforcement
*For any* password that does not meet requirements (minimum 12 characters, uppercase, lowercase, numbers, special characters), the password should be rejected
**Validates: Requirements 6.9**


### Performance and Scalability Properties

Property 35: Cache TTL enforcement
*For any* cached data with a TTL, the data should be automatically evicted from cache after the TTL expires
**Validates: Requirements 7.2**


### API Documentation and Developer Tools Properties

Property 36: Webhook event delivery
*For any* registered webhook with matching event type, the webhook should be triggered with the event payload
**Validates: Requirements 8.3**

### Analytics and Insights Properties

Property 37: Event tracking completeness
*For any* tracked user action, the event should be stored with timestamp and all relevant metadata
**Validates: Requirements 9.1**

Property 38: Feature usage tracking
*For any* feature usage, the usage count and last used timestamp should be updated for that user and feature
**Validates: Requirements 9.2**

Property 39: Performance metrics collection
*For any* request, performance metrics (response time, error status) should be collected and stored
**Validates: Requirements 9.3, 9.5**

Property 40: Feature flag evaluation
*For any* feature flag check, the result should be based on the flag's enabled status and rollout percentage
**Validates: Requirements 9.7**


### Internationalization Properties

Property 41: Currency formatting
*For any* currency value and locale, the formatted string should include the appropriate currency symbol and decimal separators for that locale
**Validates: Requirements 10.3**

Property 42: Date and time formatting
*For any* date/time value and locale, the formatted string should follow the date/time conventions of that locale
**Validates: Requirements 10.4**

Property 43: Timezone conversion
*For any* timestamp and user timezone, the displayed time should be correctly converted to the user's timezone
**Validates: Requirements 10.5**

Property 44: Translation fallback
*For any* missing translation key, the system should return the English translation and log the missing key
**Validates: Requirements 10.7**

### Real-time Features Properties

Property 45: Presence tracking
*For any* user, the online/offline status should be accurately tracked and retrievable
**Validates: Requirements 11.3**

## Error Handling


### Error Handling Strategy

All infrastructure components follow a consistent error handling approach:

1. **Validation Errors**: Return 400 Bad Request with detailed error messages
2. **Authentication Errors**: Return 401 Unauthorized
3. **Authorization Errors**: Return 403 Forbidden
4. **Not Found Errors**: Return 404 Not Found
5. **Rate Limit Errors**: Return 429 Too Many Requests with Retry-After header
6. **Server Errors**: Return 500 Internal Server Error with sanitized error message
7. **Service Unavailable**: Return 503 Service Unavailable for dependency failures

### Error Response Format

```typescript
interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  timestamp: string;
  path: string;
  correlationId?: string;
  details?: any; // Only in development
}
```

### Error Logging

All errors are logged with:
- Correlation ID for request tracing
- Full stack trace
- User context (if authenticated)
- Request details (method, path, body)
- Error classification (validation, business logic, infrastructure)

### Retry Logic

Infrastructure components implement retry logic with exponential backoff:
- Notifications: 3 retries with 1s, 2s, 4s delays
- Webhooks: 5 retries with 1s, 2s, 4s, 8s, 16s delays
- Sync operations: 3 retries with 2s, 4s, 8s delays
- File processing: 2 retries with 5s, 10s delays

### Circuit Breaker Pattern

For external service integrations:
- Open circuit after 5 consecutive failures
- Half-open state after 30 seconds
- Close circuit after 3 successful requests
- Applies to: cloud storage, notification providers, webhook deliveries


## Testing Strategy

### Dual Testing Approach

The infrastructure will be validated using both unit tests and property-based tests:

**Unit Tests**: Focus on specific examples, edge cases, and error conditions
- Configuration validation
- Specific error scenarios
- Integration points between components
- Edge cases (empty data, boundary values)
- Example: Testing that a specific deprecated API version returns the correct warning header

**Property-Based Tests**: Verify universal properties across all inputs
- Universal behaviors that should hold for all valid inputs
- Comprehensive input coverage through randomization
- Minimum 100 iterations per property test
- Example: Testing that all requests to any deprecated version include warning headers

Together, these approaches provide comprehensive coverage where unit tests catch concrete bugs and property tests verify general correctness.

### Property-Based Testing Configuration

**Library**: fast-check (already in package.json)

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: premium-app-infrastructure, Property {number}: {property_text}`

**Example Property Test**:
```typescript
import * as fc from 'fast-check';

describe('Feature: premium-app-infrastructure, Property 1: Request logging completeness', () => {
  it('should log all requests with required metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
          path: fc.webPath(),
          userAgent: fc.string(),
          ip: fc.ipV4(),
        }),
        async (request) => {
          // Make request
          const response = await makeRequest(request);
          
          // Verify log entry
          const logEntry = await getLastLogEntry();
          expect(logEntry).toHaveProperty('correlationId');
          expect(logEntry).toHaveProperty('timestamp');
          expect(logEntry.method).toBe(request.method);
          expect(logEntry.path).toBe(request.path);
          expect(logEntry.userAgent).toBe(request.userAgent);
          expect(logEntry.ip).toBe(request.ip);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```


### Unit Testing Strategy

**Focus Areas**:
1. Configuration validation (environment variables, feature flags)
2. Error handling edge cases (malformed input, missing data)
3. Specific business rules (rate limits, file size limits)
4. Integration between components (cache invalidation, event triggering)

**Example Unit Test**:
```typescript
describe('Rate Limiting', () => {
  it('should reject requests exceeding per-user limit', async () => {
    const userId = 'test-user';
    
    // Make 1000 requests (the limit)
    for (let i = 0; i < 1000; i++) {
      const response = await makeAuthenticatedRequest(userId);
      expect(response.status).toBe(200);
    }
    
    // 1001st request should be rate limited
    const response = await makeAuthenticatedRequest(userId);
    expect(response.status).toBe(429);
    expect(response.headers).toHaveProperty('retry-after');
  });
});
```

### Integration Testing

**Scope**: Test interactions between infrastructure components
- Logging + Performance monitoring
- Cache + Database queries
- Notifications + Job queue
- Webhooks + Event system
- File upload + Image processing

**Tools**:
- Supertest for HTTP testing
- Docker Compose for infrastructure (PostgreSQL, Redis, Seq)
- Test containers for isolated testing

### Performance Testing

**Metrics to Track**:
- Response time (P50, P95, P99)
- Database query count per request
- Cache hit rate
- Memory usage
- CPU usage

**Tools**:
- Artillery or k6 for load testing
- Clinic.js for Node.js profiling
- Seq for performance log analysis

### Test Coverage Goals

- Unit test coverage: > 80%
- Property test coverage: All 45 properties implemented
- Integration test coverage: All critical paths
- E2E test coverage: Key user journeys

