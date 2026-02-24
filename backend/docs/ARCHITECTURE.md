# Horizon-HCM Architecture

## System Overview

Horizon-HCM is a comprehensive House Committee Management platform built with a modern, scalable architecture. The system consists of a NestJS backend API, React web application, and React Native mobile application.

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
├──────────────────────┬──────────────────────────────────────┤
│   Web App (React)    │   Mobile App (React Native)          │
│   Port: 3000         │   Expo                                │
└──────────────────────┴──────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (NestJS)                      │
│                      Port: 3001                              │
├─────────────────────────────────────────────────────────────┤
│  Controllers → CQRS Bus → Handlers → Services → Database    │
│                                                               │
│  Guards: Auth, Authorization, Rate Limiting                  │
│  Interceptors: Logging, Caching, Performance, ETag           │
│  Middleware: Correlation ID, API Versioning                  │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  PostgreSQL  │   │    Redis     │   │   AWS S3     │
│  (Supabase)  │   │   Cache +    │   │ File Storage │
│   Port: 5432 │   │   Queues     │   │              │
└──────────────┘   │  Port: 6379  │   └──────────────┘
                   └──────────────┘
                           │
                           ▼
                   ┌──────────────┐
                   │   BullMQ     │
                   │ Job Queues   │
                   └──────────────┘
```

---

## Architecture Principles

### 1. Clean Architecture
- **Separation of Concerns**: Controllers, handlers, services, and repositories are clearly separated
- **Dependency Inversion**: High-level modules don't depend on low-level modules
- **Single Responsibility**: Each class has one reason to change

### 2. CQRS Pattern
- **Commands**: Write operations that modify state
- **Queries**: Read operations that return data
- **Separation**: Commands and queries are handled by different handlers
- **Benefits**: Scalability, clarity, testability

### 3. Domain-Driven Design
- **Modules**: Organized by business domain (apartments, payments, residents)
- **Aggregates**: Entities with clear boundaries
- **Domain Events**: Communicate changes across modules

---

## Technology Stack

### Backend
| Technology | Purpose | Rationale |
|------------|---------|-----------|
| **NestJS** | Framework | Enterprise-grade, TypeScript-first, modular |
| **TypeScript** | Language | Type safety, better tooling, maintainability |
| **Prisma** | ORM | Type-safe database access, migrations, schema management |
| **PostgreSQL** | Database | ACID compliance, JSON support, mature ecosystem |
| **Redis** | Cache + Queue | Fast in-memory storage, pub/sub, job queues |
| **BullMQ** | Job Queue | Reliable background jobs, retry logic, monitoring |
| **AWS S3** | File Storage | Scalable, durable, cost-effective |
| **Socket.IO** | Real-time | WebSocket support, fallback mechanisms |
| **Winston** | Logging | Structured logging, multiple transports |
| **Jest** | Testing | Fast, comprehensive, snapshot testing |
| **fast-check** | Property Testing | Generative testing for complex logic |

### Frontend
| Technology | Purpose | Rationale |
|------------|---------|-----------|
| **React** | Web Framework | Component-based, large ecosystem, mature |
| **React Native** | Mobile Framework | Cross-platform, code sharing, native performance |
| **TypeScript** | Language | Type safety across stack |
| **React Query** | Data Fetching | Caching, synchronization, optimistic updates |
| **Zustand** | State Management | Simple, performant, minimal boilerplate |
| **Tailwind CSS** | Styling (Web) | Utility-first, consistent design system |

---

## Module Architecture

### Standard Module Structure

```
module-name/
├── module-name.module.ts       # Module definition
├── module-name.controller.ts   # HTTP endpoints
├── commands/                   # Write operations
│   ├── impl/                   # Command classes
│   │   └── create-entity.command.ts
│   └── handlers/               # Command handlers
│       └── create-entity.handler.ts
├── queries/                    # Read operations
│   ├── impl/                   # Query classes
│   │   └── get-entity.query.ts
│   └── handlers/               # Query handlers
│       └── get-entity.handler.ts
├── dto/                        # Data transfer objects
│   ├── create-entity.dto.ts
│   └── update-entity.dto.ts
└── __tests__/                  # Tests
    ├── create-entity.handler.spec.ts
    └── properties/
        └── entity.properties.spec.ts
```

### Request Flow

```
1. HTTP Request
   ↓
2. Middleware (Correlation ID, API Versioning)
   ↓
3. Guards (Authentication, Authorization)
   ↓
4. Interceptors (Logging, Caching, Performance)
   ↓
5. Controller (Route handler)
   ↓
6. Validation (class-validator)
   ↓
7. CQRS Bus (CommandBus or QueryBus)
   ↓
8. Handler (Business logic)
   ↓
9. Services (Shared logic)
   ↓
10. Repository/Prisma (Data access)
    ↓
11. Database
    ↓
12. Response
    ↓
13. Interceptors (Transform, ETag, Field Filter)
    ↓
14. HTTP Response
```

---

## Data Flow Patterns

### 1. Command Flow (Write Operations)

```
Client Request (POST/PUT/DELETE)
    ↓
Controller validates DTO
    ↓
CommandBus.execute(command)
    ↓
CommandHandler
    ├─→ Validate business rules
    ├─→ Update database (Prisma)
    ├─→ Invalidate cache
    ├─→ Emit domain event
    └─→ Log audit trail
    ↓
Return success response
    ↓
Event Handler (async)
    ├─→ Send notifications
    ├─→ Update analytics
    └─→ Trigger webhooks
```

### 2. Query Flow (Read Operations)

```
Client Request (GET)
    ↓
Controller validates query params
    ↓
Check cache (Redis)
    ├─→ Cache HIT: Return cached data
    └─→ Cache MISS: Continue
    ↓
QueryBus.execute(query)
    ↓
QueryHandler
    ├─→ Fetch from database (Prisma)
    ├─→ Transform data
    └─→ Store in cache
    ↓
Return response
```

### 3. Background Job Flow

```
Event Triggered
    ↓
Add job to BullMQ queue
    ↓
Job Processor
    ├─→ Process job
    ├─→ Retry on failure (exponential backoff)
    └─→ Update job status
    ↓
Job Complete
    ├─→ Send notification
    └─→ Log result
```

---

## Authorization Model

### Guard Hierarchy

```
1. JwtAuthGuard (from @ofeklabs/horizon-auth)
   ├─→ Validates JWT token
   ├─→ Populates request.user
   └─→ Required for all protected endpoints

2. BuildingMemberGuard
   ├─→ Checks if user belongs to building
   ├─→ Queries: Committee, Owner, or Tenant
   ├─→ Cached for 15 minutes
   └─→ Required for building-specific operations

3. CommitteeMemberGuard
   ├─→ Checks if user is committee member
   ├─→ Queries: BuildingCommitteeMember table
   ├─→ Cached for 15 minutes
   └─→ Required for admin operations

4. ResourceOwnerGuard
   ├─→ Checks if user owns resource
   ├─→ OR if user is committee member
   ├─→ No caching (resource-specific)
   └─→ Required for resource modifications
```

### Guard Execution Order

Guards execute in sequence. If any guard fails, execution stops.

```
Request → JwtAuthGuard → BuildingMemberGuard → CommitteeMemberGuard → Handler
          (Auth)         (Membership)          (Admin)
```

---

## Caching Strategy

### Cache Layers

1. **Application Cache (Redis)**
   - Query results
   - Authorization checks
   - Session data
   - TTL: 5-15 minutes

2. **HTTP Cache (ETag)**
   - Response caching
   - Conditional requests (304 Not Modified)
   - Client-side caching

### Cache Keys

```
Pattern: {namespace}:{identifier}:{subkey}

Examples:
- balance:{buildingId}                    # Building balance
- committee:{userId}:{buildingId}         # Committee membership
- building-member:{userId}:{buildingId}   # Building membership
- payment-summary:{buildingId}:{dateRange} # Payment summary
```

### Cache Invalidation

```
Event: Apartment Owner Added
    ↓
Invalidate:
- building-member:{userId}:{buildingId}
- apartment-owners:{apartmentId}
- building-residents:{buildingId}
```

---

## Database Schema

### Core Entities

```
Buildings
    ├─→ Apartments
    │   ├─→ ApartmentOwners (many-to-many with Users)
    │   └─→ ApartmentTenants (many-to-many with Users)
    ├─→ BuildingCommitteeMembers (many-to-many with Users)
    ├─→ Payments
    ├─→ MaintenanceRequests
    ├─→ Meetings
    ├─→ Documents
    └─→ Announcements

Users
    ├─→ UserProfile (one-to-one)
    ├─→ ApartmentOwners (many-to-many with Apartments)
    ├─→ ApartmentTenants (many-to-many with Apartments)
    └─→ BuildingCommitteeMembers (many-to-many with Buildings)
```

### Naming Conventions

- **Tables**: snake_case, plural (e.g., `apartment_owners`)
- **Columns**: snake_case (e.g., `created_at`, `user_id`)
- **Primary Keys**: `id` (UUID)
- **Foreign Keys**: `{table}_id` (e.g., `building_id`)
- **Timestamps**: `created_at`, `updated_at`

---

## API Design

### RESTful Conventions

```
GET    /buildings                    # List buildings
GET    /buildings/:id                # Get building
POST   /buildings                    # Create building
PATCH  /buildings/:id                # Update building
DELETE /buildings/:id                # Delete building

GET    /buildings/:id/apartments     # List apartments in building
POST   /buildings/:id/apartments     # Create apartment in building
```

### Response Format

**Success Response**:
```json
{
  "id": "uuid",
  "name": "Building A",
  "address": "123 Main St",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Error Response**:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "apartmentNumber",
      "message": "Apartment number is required"
    }
  ]
}
```

**Paginated Response**:
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

## Scalability Considerations

### Horizontal Scaling

1. **Stateless API**
   - No session state in memory
   - All state in Redis or database
   - Can run multiple instances

2. **Load Balancing**
   - Round-robin or least connections
   - Health check endpoint: `/health`
   - Sticky sessions not required

3. **Database Connection Pooling**
   - Prisma connection pool
   - Max connections per instance
   - Connection timeout handling

### Vertical Scaling

1. **Database Optimization**
   - Indexes on frequently queried columns
   - Query optimization
   - Read replicas for read-heavy operations

2. **Caching**
   - Redis for frequently accessed data
   - Cache warming strategies
   - Cache invalidation patterns

3. **Background Jobs**
   - BullMQ for async processing
   - Job prioritization
   - Retry strategies

---

## Security Architecture

### Authentication Flow

```
1. User submits credentials
   ↓
2. Backend validates credentials
   ↓
3. Generate JWT token (24h expiration)
   ↓
4. Return token to client
   ↓
5. Client includes token in Authorization header
   ↓
6. JwtAuthGuard validates token
   ↓
7. Request proceeds with user context
```

### Security Layers

1. **Transport Security**
   - HTTPS only in production
   - TLS 1.2+ required

2. **Authentication**
   - JWT tokens with RS256 signing
   - Token expiration (24 hours)
   - Refresh token rotation

3. **Authorization**
   - Role-based access control (RBAC)
   - Resource-level permissions
   - Guard composition

4. **Input Validation**
   - class-validator for DTOs
   - SQL injection prevention (Prisma parameterization)
   - XSS prevention (input sanitization)

5. **Rate Limiting**
   - Global: 100 requests/minute
   - Per-endpoint customization available
   - IP-based throttling

6. **Audit Logging**
   - All sensitive operations logged
   - User actions tracked
   - Immutable audit trail

---

## Monitoring and Observability

### Logging

**Log Levels**:
- `error`: Errors that need immediate attention
- `warn`: Warnings that should be investigated
- `info`: Important business events
- `debug`: Detailed debugging information

**Log Format** (JSON):
```json
{
  "timestamp": "2024-01-01T00:00:00Z",
  "level": "info",
  "message": "User logged in",
  "correlationId": "uuid",
  "userId": "uuid",
  "context": "AuthService"
}
```

### Metrics

1. **Performance Metrics**
   - Request duration
   - Database query count
   - Cache hit/miss rate
   - External API latency

2. **Business Metrics**
   - User registrations
   - Active users
   - Feature usage
   - Error rates

### Health Checks

```
GET /health
Response:
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" },
    "storage": { "status": "up" }
  }
}
```

---

## Deployment Architecture

### Production Environment

```
┌─────────────────────────────────────────────────────────┐
│                    Load Balancer                         │
│                  (AWS ALB / Nginx)                       │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  API Server  │  │  API Server  │  │  API Server  │
│  Instance 1  │  │  Instance 2  │  │  Instance 3  │
└──────────────┘  └──────────────┘  └──────────────┘
        │                 │                 │
        └─────────────────┼─────────────────┘
                          ▼
        ┌─────────────────────────────────────┐
        │         Shared Services             │
        ├─────────────────────────────────────┤
        │  PostgreSQL (Primary + Replicas)    │
        │  Redis Cluster                      │
        │  S3 Bucket                          │
        └─────────────────────────────────────┘
```

### Deployment Strategy

**Blue-Green Deployment**:
1. Deploy new version to "green" environment
2. Run health checks
3. Switch traffic to "green"
4. Keep "blue" for rollback
5. Decommission "blue" after verification

---

## Future Considerations

### Planned Enhancements

1. **Microservices**
   - Split into domain-specific services
   - API Gateway for routing
   - Service mesh for communication

2. **Event Sourcing**
   - Store all state changes as events
   - Rebuild state from event log
   - Time-travel debugging

3. **GraphQL API**
   - Alternative to REST
   - Client-driven queries
   - Reduced over-fetching

4. **Multi-tenancy**
   - Tenant isolation
   - Shared database with tenant_id
   - Tenant-specific customization

---

## References

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-24  
**Next Review**: Quarterly or after major architectural changes
