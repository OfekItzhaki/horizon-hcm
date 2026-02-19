# Horizon-HCM Architecture Documentation

## Overview

Horizon-HCM is a mobile-first SaaS platform for residential building management built with enterprise-grade infrastructure. The system follows CQRS + Clean Architecture patterns with NestJS, PostgreSQL, and Redis.

## Architecture Principles

1. **CQRS (Command Query Responsibility Segregation)**: Separate read and write operations
2. **Clean Architecture**: Domain logic independent of frameworks
3. **Microservices-Ready**: Modular design for future service extraction
4. **Cloud-Native**: Designed for horizontal scaling and cloud deployment
5. **Mobile-First**: Optimized for mobile bandwidth and offline capabilities

## High-Level Architecture

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
│  │ CORS │ Helmet │ Correlation IDs │ Request Signing        │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Application Layer (NestJS)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Controllers │ Guards │ Interceptors │ Pipes              │  │
│  │ CQRS Commands & Queries │ Event Handlers                 │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ Domain Layer │  │ Services     │  │ External     │
│ (Business    │  │ (Notification│  │ Services     │
│  Logic)      │  │  File, Sync) │  │ (FCM, APNS,  │
│              │  │              │  │  S3, Seq)    │
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

## Module Architecture

### Core Modules

#### 1. Authentication Module (@ofeklabs/horizon-auth)
- **Responsibility**: User authentication and authorization
- **Features**: Registration, login, 2FA, session management, device management
- **Database**: User, Session, Device, TwoFactorAuth tables
- **Mode**: Full (standalone) authentication

#### 2. Buildings Module
- **Responsibility**: Building and apartment management
- **Entities**: Building, Apartment, BuildingCommitteeMember, ApartmentOwner, ApartmentTenant
- **Pattern**: CQRS with commands and queries
- **Relations**: Links to UserProfile from auth package

#### 3. Notifications Module
- **Responsibility**: Multi-channel push notifications
- **Components**:
  - NotificationService: Core notification logic
  - TemplateService: Template management with variable substitution
  - Providers: FCM, APNS, Web Push
  - Processor: BullMQ job processor for async delivery
- **Database**: NotificationTemplate, NotificationPreference, NotificationLog
- **Queue**: `notifications` queue with retry logic

#### 4. Files Module
- **Responsibility**: File upload, storage, and processing
- **Components**:
  - StorageService: Cloud storage abstraction (S3/Azure)
  - ImageProcessingService: Compression and thumbnail generation
  - ChunkedUploadService: Large file upload support
  - Processor: BullMQ job processor for image processing
- **Database**: File model
- **Queue**: `file-processing` queue
- **Storage**: AWS S3 or Azure Blob Storage

#### 5. Sync Module
- **Responsibility**: Offline data synchronization
- **Components**:
  - SyncService: Delta sync and conflict resolution
  - Processor: Background sync operations
- **Database**: SyncState model
- **Queue**: `sync` queue
- **Strategy**: Last-write-wins with timestamp comparison

#### 6. Real-time Module
- **Responsibility**: Real-time bidirectional communication
- **Components**:
  - RealtimeGateway: WebSocket server with Socket.IO
  - RealtimeController: SSE fallback endpoints
  - PresenceService: Online/offline status tracking
- **Transport**: WebSocket (primary), SSE (fallback)
- **Scaling**: Redis adapter for multi-instance support

#### 7. Webhooks Module
- **Responsibility**: External event notifications
- **Components**:
  - WebhookService: Registration and triggering
  - WebhookProcessor: Async delivery with retries
- **Database**: Webhook, WebhookDelivery models
- **Queue**: `webhooks` queue
- **Security**: HMAC-SHA256 payload signing

#### 8. Common Module (Global)
- **Responsibility**: Shared services and utilities
- **Services**:
  - CacheService: Redis caching
  - ETagService: ETag generation and validation
  - PaginationService: Pagination utilities
  - RequestSigningService: HMAC request signing
  - DeviceFingerprintService: Device identification
  - AnomalyDetectionService: Security threat detection
  - AuditLogService: Audit trail logging
  - GDPRService: Data export and deletion
  - PasswordPolicyService: Password validation
  - AnalyticsService: Event and metrics tracking
  - FeatureFlagService: A/B testing and feature toggles
  - FormattingService: Locale-based formatting
  - TranslationService: i18n management

## Data Flow Patterns

### 1. Command Flow (Write Operations)

```
Client Request
    ↓
Controller (validates DTO)
    ↓
Command Handler (business logic)
    ↓
Domain Service (if needed)
    ↓
Repository (Prisma)
    ↓
Database
    ↓
Event Emitter (optional)
    ↓
Event Handler (side effects)
```

### 2. Query Flow (Read Operations)

```
Client Request
    ↓
Controller (validates params)
    ↓
Query Handler
    ↓
Cache Check (Redis)
    ├─ Hit → Return cached data
    └─ Miss ↓
Repository (Prisma)
    ↓
Database
    ↓
Cache Store (Redis)
    ↓
Return data
```

### 3. Background Job Flow

```
Event Trigger
    ↓
Queue Job (BullMQ)
    ↓
Redis Queue
    ↓
Job Processor
    ↓
Execute Task
    ├─ Success → Update status
    └─ Failure → Retry (exponential backoff)
```

## Database Schema

### Core Entities

```
UserProfile (1) ──< (N) BuildingCommitteeMember >── (1) Building
                                                          │
                                                          │
                                                          ├── (N) Apartment
                                                          │       │
                                                          │       ├── (N) ApartmentOwner >── (1) UserProfile
                                                          │       └── (N) ApartmentTenant >── (1) UserProfile
```

### Infrastructure Entities

- **NotificationTemplate**: Template definitions
- **NotificationPreference**: User notification settings
- **NotificationLog**: Delivery tracking
- **File**: File metadata and storage keys
- **SyncState**: Sync status per user/entity
- **DeviceFingerprint**: Device identification
- **AuditLog**: Audit trail
- **AnalyticsEvent**: User events
- **FeatureUsage**: Feature usage statistics
- **PerformanceMetric**: API performance data
- **FeatureFlag**: Feature toggles
- **FeatureFlagAssignment**: User variant assignments
- **Translation**: i18n translations
- **Webhook**: Webhook registrations
- **WebhookDelivery**: Delivery tracking

### Indexes

All tables have appropriate indexes for:
- Primary keys (automatic)
- Foreign keys
- Frequently queried columns
- Composite indexes for common query patterns
- Timestamp columns for time-based queries

## Caching Strategy

### Cache Layers

1. **Application Cache (Redis)**
   - User profiles: 10 minutes TTL
   - Building data: 5 minutes TTL
   - Apartment lists: 5 minutes TTL
   - Feature flags: 1 minute TTL

2. **HTTP Cache (ETags)**
   - Conditional requests with If-None-Match
   - 304 Not Modified responses
   - Reduces bandwidth for unchanged resources

3. **CDN Cache (Future)**
   - Static assets
   - Public API responses
   - Edge caching for global distribution

### Cache Invalidation

- **Pattern-based**: `cache:building:*` invalidates all building caches
- **Event-driven**: Entity updates trigger cache invalidation
- **TTL-based**: Automatic expiration after configured time

## Security Architecture

### Authentication Flow

```
Client
    ↓
POST /auth/login (email, password)
    ↓
@ofeklabs/horizon-auth
    ├─ Validate credentials
    ├─ Check 2FA (if enabled)
    ├─ Generate JWT tokens
    └─ Create session
    ↓
Return { accessToken, refreshToken }
    ↓
Client stores tokens
    ↓
Subsequent requests include:
Authorization: Bearer <accessToken>
```

### Authorization Flow

```
Client Request
    ↓
JWT Guard (validates token)
    ↓
Extract user from token
    ↓
Role Guard (checks permissions)
    ↓
Controller (authorized)
```

### Security Layers

1. **Transport Security**: HTTPS only in production
2. **Request Security**: HMAC signing for sensitive operations
3. **Rate Limiting**: Per-user and per-IP limits
4. **Input Validation**: DTO validation with class-validator
5. **Output Sanitization**: Field filtering and data masking
6. **Audit Logging**: All sensitive operations logged
7. **Anomaly Detection**: Risk scoring and auto-restriction
8. **Device Fingerprinting**: Device identification and tracking

## Scalability

### Horizontal Scaling

The application is stateless and can scale horizontally:

1. **Session Management**: Redis-based, shared across instances
2. **WebSocket**: Redis adapter for cross-instance communication
3. **Job Queues**: Redis-based, distributed processing
4. **Caching**: Shared Redis cache
5. **File Storage**: Cloud storage (S3/Azure)

### Load Balancing

```
                    Load Balancer
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
    Instance 1       Instance 2       Instance 3
        │                │                │
        └────────────────┼────────────────┘
                         │
                    ┌────┴────┐
                    │         │
                Database    Redis
```

### Performance Optimizations

1. **Database**:
   - Connection pooling (10-100 connections)
   - Query optimization with indexes
   - Read replicas for read-heavy operations

2. **Caching**:
   - Redis for frequently accessed data
   - ETag for HTTP caching
   - Cache-aside pattern with automatic population

3. **API**:
   - Response compression (gzip/brotli)
   - Field filtering to reduce payload size
   - Pagination for large datasets

4. **Background Jobs**:
   - Async processing for heavy operations
   - Retry logic with exponential backoff
   - Concurrency limits to prevent overload

## Monitoring & Observability

### Logging

- **Structured Logging**: JSON format with Winston
- **Log Aggregation**: Seq for centralized logging
- **Correlation IDs**: Track requests across services
- **Log Levels**: Debug, Info, Warn, Error, Fatal

### Metrics

- **Performance Metrics**: Response times, database queries, cache hits
- **Business Metrics**: Active users, feature usage, events
- **Error Metrics**: Error rates per endpoint
- **System Metrics**: CPU, memory, disk usage

### Tracing

- **Correlation IDs**: Unique ID per request
- **Request/Response Logging**: Full request lifecycle
- **Performance Tracking**: Database query times, external API calls

### Health Checks

- **Liveness**: `/health/live` - Is the app running?
- **Readiness**: `/health/ready` - Can the app serve traffic?
- **Health**: `/health` - Detailed health status with dependencies

## Disaster Recovery

### Backup Strategy

1. **Database**: Daily automated backups with 30-day retention
2. **Redis**: RDB snapshots every 15 minutes
3. **File Storage**: S3 versioning and lifecycle policies
4. **Configuration**: Version controlled in Git

### Recovery Procedures

1. **Database Restore**: From latest backup
2. **Application Rollback**: Previous Docker image or Git commit
3. **Cache Rebuild**: Automatic on application restart
4. **File Recovery**: S3 versioning or backup restore

## Future Enhancements

### Phase 2 (Planned)

1. **Microservices**: Extract modules into separate services
2. **Event Sourcing**: Full event log for audit and replay
3. **GraphQL API**: Alternative to REST for flexible queries
4. **Advanced Analytics**: Machine learning for insights
5. **Multi-tenancy**: Tenant isolation and customization

### Phase 3 (Future)

1. **Kubernetes**: Container orchestration
2. **Service Mesh**: Istio for advanced traffic management
3. **Distributed Tracing**: OpenTelemetry integration
4. **Advanced Caching**: Multi-layer caching with CDN
5. **Global Distribution**: Multi-region deployment

## Technology Stack Summary

### Backend
- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.x
- **Runtime**: Node.js 18+ / 20+

### Database
- **Primary**: PostgreSQL 14+ (Supabase)
- **ORM**: Prisma 5.x
- **Migrations**: Prisma Migrate

### Caching & Jobs
- **Cache**: Redis 6+
- **Job Queue**: BullMQ
- **Session Store**: Redis

### Authentication
- **Package**: @ofeklabs/horizon-auth v0.4.1
- **Strategy**: JWT with refresh tokens
- **2FA**: TOTP-based

### External Services
- **Storage**: AWS S3 / Azure Blob Storage
- **Notifications**: FCM, APNS, Web Push
- **Logging**: Seq
- **Image Processing**: Sharp

### API Features
- **Documentation**: Swagger/OpenAPI 3.0
- **Validation**: class-validator
- **Serialization**: class-transformer
- **Compression**: gzip/brotli
- **Security**: Helmet, CORS, Rate Limiting

## Conclusion

Horizon-HCM is built with enterprise-grade infrastructure following industry best practices. The architecture is designed for scalability, maintainability, and security, making it production-ready for residential building management at scale.
