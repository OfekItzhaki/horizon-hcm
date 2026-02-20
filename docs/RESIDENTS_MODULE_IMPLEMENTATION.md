# Residents Module Implementation Guide

## Overview

This document explains the Residents Module implementation, the CQRS + Clean Architecture pattern used, and how to learn the tech stack to continue development.

## What Was Implemented

### 1. Module Structure (Task 1.1)

Created a complete CQRS module following the established pattern:

```
src/residents/
├── dto/                                    # Data Transfer Objects
│   ├── add-committee-member.dto.ts        # Validation for adding committee members
│   ├── list-residents.dto.ts              # Pagination and filtering for resident lists
│   └── search-residents.dto.ts            # Search parameters
├── commands/                               # Write operations (modify state)
│   ├── impl/
│   │   ├── add-committee-member.command.ts
│   │   └── remove-committee-member.command.ts
│   └── handlers/
│       ├── add-committee-member.handler.ts
│       └── remove-committee-member.handler.ts
├── queries/                                # Read operations (retrieve data)
│   ├── impl/
│   │   ├── list-residents.query.ts
│   │   ├── get-resident-profile.query.ts
│   │   ├── search-residents.query.ts
│   │   └── export-residents.query.ts
│   └── handlers/
│       ├── list-residents.handler.ts
│       ├── get-resident-profile.handler.ts
│       ├── search-residents.handler.ts
│       └── export-residents.handler.ts
├── __tests__/
│   └── properties/
│       └── residents.properties.spec.ts    # Property-based tests
├── residents.module.ts                     # Module definition
└── residents.controller.ts                 # HTTP endpoints (to be implemented)
```

### 2. Committee Member Commands (Task 1.2)

Implemented two command handlers for managing committee members:

#### AddCommitteeMemberHandler

**Purpose**: Add a user as a committee member to a building

**Flow**:
1. Validate building exists (throw NotFoundException if not)
2. Validate user exists (throw NotFoundException if not)
3. Check for duplicate membership (throw ConflictException if already exists)
4. Create committee membership record in database
5. Invalidate cache keys for authorization checks
6. Log audit entry for compliance
7. Return created committee member with user profile

**Key Features**:
- Uses Prisma's unique constraint (`building_id_user_id`) to prevent duplicates
- Invalidates two cache keys:
  - `committee:{userId}:{buildingId}` - for CommitteeMemberGuard
  - `building-member:{userId}:{buildingId}` - for BuildingMemberGuard
- Includes user profile in response for immediate display
- TODO comment for future notification implementation

**Code Example**:
```typescript
const committeeMember = await this.prisma.buildingCommitteeMember.create({
  data: {
    building_id: buildingId,
    user_id: userId,
    role: role,
  },
  include: {
    user_profile: {
      select: {
        id: true,
        full_name: true,
        phone_number: true,
        user_type: true,
      },
    },
  },
});
```

#### RemoveCommitteeMemberHandler

**Purpose**: Remove a committee member from a building

**Flow**:
1. Find committee member by ID (throw NotFoundException if not found)
2. Verify member belongs to specified building (security check)
3. Delete committee membership record
4. Invalidate cache keys
5. Log audit entry with removed user details
6. Return success message

**Key Features**:
- Verifies building ownership before deletion (security)
- Captures user details before deletion for audit log
- Same cache invalidation as add operation
- Returns descriptive success message

### 3. Property-Based Tests (Tasks 1.3 & 1.4)

Implemented comprehensive property-based tests using `fast-check` library:

#### Property 3: Committee Membership Uniqueness

**What it tests**: Attempting to add the same user as a committee member twice should fail

**How it works**:
1. Generates random building, user, role, and currentUserId (100 iterations)
2. Mocks first addition to succeed (no existing member)
3. Verifies first addition returns created member
4. Mocks second addition to find existing member
5. Verifies second addition throws ConflictException

**Why it's important**: Ensures database uniqueness constraint is properly enforced at the application level

#### Property 4: Committee Member Removal Audit

**What it tests**: Every committee member removal must create an audit log entry

**How it works**:
1. Generates random committee member data (100 iterations)
2. Mocks successful removal
3. Verifies audit log was called exactly once
4. Verifies audit log contains correct action, resourceType, resourceId, and metadata

**Why it's important**: Ensures compliance and traceability for all committee member changes

## Understanding the Tech Stack

### Core Technologies

#### 1. NestJS Framework
- **What**: Progressive Node.js framework for building server-side applications
- **Why**: Provides structure, dependency injection, and decorators
- **Learn**: https://docs.nestjs.com/
- **Key Concepts**:
  - Modules: Organize code into cohesive blocks
  - Controllers: Handle HTTP requests
  - Providers: Injectable services (handlers, services)
  - Decorators: `@Injectable()`, `@Controller()`, `@Get()`, etc.

#### 2. CQRS Pattern (Command Query Responsibility Segregation)
- **What**: Separates read operations (queries) from write operations (commands)
- **Why**: Better scalability, clearer code organization, easier testing
- **Learn**: https://docs.nestjs.com/recipes/cqrs
- **Key Concepts**:
  - Commands: Modify state (create, update, delete)
  - Queries: Retrieve data (list, get, search)
  - Handlers: Execute commands/queries
  - CommandBus/QueryBus: Dispatch commands/queries to handlers

**Example Flow**:
```
HTTP Request → Controller → CommandBus.execute(command) → Handler → Database → Response
```

#### 3. Prisma ORM
- **What**: Type-safe database ORM for TypeScript
- **Why**: Auto-generated types, migrations, great DX
- **Learn**: https://www.prisma.io/docs
- **Key Concepts**:
  - Schema: Define models in `prisma/schema.prisma`
  - Client: Auto-generated database client
  - Relations: Define relationships between models
  - Queries: Type-safe database operations

**Example**:
```typescript
// Find unique with relations
const member = await this.prisma.buildingCommitteeMember.findUnique({
  where: { id: memberId },
  include: {
    user_profile: true,  // Include related user profile
  },
});
```

#### 4. Property-Based Testing with fast-check
- **What**: Generate random test data to verify properties hold for all inputs
- **Why**: Catches edge cases that example-based tests miss
- **Learn**: https://github.com/dubzzz/fast-check
- **Key Concepts**:
  - Arbitraries: Generators for random data
  - Properties: Universal truths that should always hold
  - Shrinking: Automatically finds minimal failing case

**Example**:
```typescript
await fc.assert(
  fc.asyncProperty(
    buildingArbitrary(),  // Generate random building
    userArbitrary(),      // Generate random user
    async (building, user) => {
      // Test that property holds for these random inputs
    }
  ),
  { numRuns: 100 }  // Run 100 times with different random data
);
```

### Supporting Services

#### AuditLogService
- **Purpose**: Log all sensitive operations for compliance
- **Usage**: `await this.auditLog.log({ action, resourceType, resourceId, metadata })`
- **Location**: `src/common/services/audit-log.service.ts`

#### CacheService
- **Purpose**: Redis-based caching for performance
- **Usage**: `await this.cache.delete(key)` to invalidate cache
- **Location**: `src/common/services/cache.service.ts`
- **TTLs**: 
  - Committee membership: 15 minutes
  - Building membership: 15 minutes
  - User profiles: 30 minutes

#### NotificationService
- **Purpose**: Send notifications to users
- **Usage**: `await this.notificationService.send({ templateName, recipients, data })`
- **Location**: `src/notifications/services/notification.service.ts`
- **Note**: Currently marked as TODO in handlers

## How the Flow Works

### Adding a Committee Member

```
1. HTTP POST /buildings/:buildingId/committee-members
   Body: { userId: "...", role: "Chairman" }
   
2. Controller receives request
   → Extracts @CurrentUser() for authentication
   → Validates DTO (AddCommitteeMemberDto)
   → Creates AddCommitteeMemberCommand
   
3. CommandBus dispatches to AddCommitteeMemberHandler
   
4. Handler executes:
   ├─ Validate building exists (Prisma query)
   ├─ Validate user exists (Prisma query)
   ├─ Check duplicate (Prisma unique constraint)
   ├─ Create membership (Prisma create)
   ├─ Invalidate cache (CacheService)
   └─ Log audit (AuditLogService)
   
5. Return created committee member to client
```

### Cache Invalidation Strategy

When a committee member is added or removed, we invalidate two cache keys:

1. **`committee:{userId}:{buildingId}`**
   - Used by: CommitteeMemberGuard
   - Purpose: Check if user is a committee member
   - TTL: 15 minutes

2. **`building-member:{userId}:{buildingId}`**
   - Used by: BuildingMemberGuard
   - Purpose: Check if user belongs to building (committee, owner, or tenant)
   - TTL: 15 minutes

**Why invalidate on write?**
- Ensures authorization guards see updated membership immediately
- Prevents stale cache from allowing/denying access incorrectly
- Cache will be repopulated on next authorization check

## Database Schema

### BuildingCommitteeMember Table

```prisma
model BuildingCommitteeMember {
  id          String   @id @default(uuid())
  building_id String
  user_id     String
  role        String?  // e.g., "Chairman", "Treasurer"
  created_at  DateTime @default(now())

  building     Building    @relation(fields: [building_id], references: [id], onDelete: Cascade)
  user_profile UserProfile @relation(fields: [user_id], references: [id], onDelete: Cascade)

  @@unique([building_id, user_id])  // Prevents duplicate memberships
  @@index([building_id])
  @@index([user_id])
  @@map("building_committee_members")
}
```

**Key Points**:
- `@@unique([building_id, user_id])`: Enforces one membership per user per building
- `onDelete: Cascade`: Deleting building or user automatically removes membership
- Indexes on `building_id` and `user_id` for fast lookups
- `role` is optional (nullable) for flexibility

## Testing Strategy

### Unit Tests (Not yet implemented)
- Test specific examples and edge cases
- Mock all dependencies
- Fast execution
- Example: "should throw NotFoundException when building doesn't exist"

### Property-Based Tests (Implemented)
- Test universal properties with random data
- 100 iterations per test
- Catches edge cases
- Example: "duplicate membership should always fail"

### Integration Tests (Future)
- Test with real database and Redis
- Test complete flows end-to-end
- Slower but more comprehensive

## How to Continue Development

### Step 1: Understand the Pattern

Look at existing modules to see the pattern:
```bash
# Study the Apartments module (similar structure)
src/apartments/
├── commands/handlers/assign-owner.handler.ts  # Similar to add-committee-member
├── queries/handlers/list-apartments.handler.ts  # Pattern for list-residents
└── apartments.controller.ts  # Pattern for residents.controller
```

### Step 2: Implement Queries (Task 1.5)

Next task is to implement the 4 query handlers:

1. **ListResidentsHandler**: 
   - Query BuildingCommitteeMember, ApartmentOwner, ApartmentTenant
   - Join with UserProfile
   - Support pagination (max 100 items)
   - Support filtering (search, userType, apartmentNumber, phoneNumber)
   - Sort alphabetically by full_name

2. **GetResidentProfileHandler**:
   - Query UserProfile by ID
   - Include all committee memberships
   - Include all apartment ownerships with shares
   - Include all active tenancies with dates

3. **SearchResidentsHandler**:
   - Filter by search term (name, phone, apartment)
   - Case-insensitive search
   - Return matching residents

4. **ExportResidentsHandler**:
   - Query all residents for building
   - Generate CSV with headers
   - Upload to FileStorageService with 24h expiration
   - Return download URL

### Step 3: Study Similar Implementations

```typescript
// Example: List query with pagination
const skip = (page - 1) * limit;
const residents = await this.prisma.userProfile.findMany({
  where: { /* filters */ },
  include: { /* relations */ },
  orderBy: { full_name: 'asc' },
  skip: skip,
  take: limit,
});

const total = await this.prisma.userProfile.count({
  where: { /* same filters */ },
});

return {
  data: residents,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  },
};
```

### Step 4: Run Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test residents.properties.spec

# Run with coverage
npm run test:cov

# Watch mode for development
npm run test:watch
```

### Step 5: Check for Errors

```bash
# Build the project
npm run build

# Start development server
npm run start:dev

# Check for TypeScript errors
npx tsc --noEmit
```

## Common Patterns

### 1. Validation Pattern
```typescript
// Check if entity exists
const entity = await this.prisma.entity.findUnique({ where: { id } });
if (!entity) {
  throw new NotFoundException('Entity not found');
}
```

### 2. Unique Constraint Pattern
```typescript
// Check for duplicates
const existing = await this.prisma.entity.findUnique({
  where: { unique_field: value },
});
if (existing) {
  throw new ConflictException('Entity already exists');
}
```

### 3. Cache Invalidation Pattern
```typescript
// Invalidate related cache keys
await this.cache.delete(`key1:${id}`);
await this.cache.delete(`key2:${id}`);
```

### 4. Audit Logging Pattern
```typescript
await this.auditLog.log({
  userId: currentUserId,
  action: 'resource.action',
  resourceType: 'ResourceType',
  resourceId: id,
  metadata: { /* relevant data */ },
});
```

### 5. Pagination Pattern
```typescript
const skip = (page - 1) * limit;
const [data, total] = await Promise.all([
  this.prisma.entity.findMany({ skip, take: limit }),
  this.prisma.entity.count(),
]);
```

## Debugging Tips

### 1. Check Prisma Queries
```typescript
// Enable query logging in development
// Add to prisma/schema.prisma:
generator client {
  provider = "prisma-client-js"
  log      = ["query", "info", "warn", "error"]
}
```

### 2. Test Database Queries
```bash
# Open Prisma Studio to view database
npx prisma studio

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### 3. Check Redis Cache
```bash
# Connect to Redis CLI
redis-cli

# View all keys
KEYS *

# Get specific key
GET committee:user-id:building-id

# Delete key
DEL committee:user-id:building-id
```

### 4. View Logs
```typescript
// Add console.log for debugging
console.log('Command:', command);
console.log('Result:', result);

// Use NestJS Logger
private readonly logger = new Logger(AddCommitteeMemberHandler.name);
this.logger.log('Adding committee member', { userId, buildingId });
```

## Resources

### Official Documentation
- NestJS: https://docs.nestjs.com/
- Prisma: https://www.prisma.io/docs
- CQRS: https://docs.nestjs.com/recipes/cqrs
- fast-check: https://github.com/dubzzz/fast-check

### Learning Path
1. **Week 1**: NestJS basics (modules, controllers, providers)
2. **Week 2**: CQRS pattern (commands, queries, handlers)
3. **Week 3**: Prisma ORM (schema, queries, relations)
4. **Week 4**: Testing (unit tests, property-based tests)

### Code Examples
- Study `src/apartments/` for similar patterns
- Study `src/payments/` for simpler examples
- Study `src/announcements/` for complex queries

## Next Steps

1. ✅ Module structure created
2. ✅ Committee member commands implemented
3. ✅ Property-based tests written
4. ⏳ Implement resident queries (Task 1.5)
5. ⏳ Write property tests for queries (Tasks 1.6-1.10)
6. ⏳ Implement residents controller (Task 1.11)
7. ⏳ Write unit tests (Task 1.12)

Continue with Task 1.5 to implement the query handlers following the patterns shown in this document.

---

**Last Updated**: February 20, 2026
**Progress**: 30% of Residents Module complete (4 of 12 tasks)
