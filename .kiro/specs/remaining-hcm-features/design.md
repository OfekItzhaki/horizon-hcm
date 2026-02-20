# Design Document: Remaining HCM Features

## Overview

This design document specifies the implementation of the remaining 30% of Horizon-HCM backend features. The system follows CQRS + Clean Architecture patterns with NestJS, using separate command and query handlers for write and read operations. This specification covers four main areas:

1. **Residents Module**: CQRS module for managing building residents (committee members, owners, tenants) with queries for listing/searching and commands for committee member management
2. **Financial Reports Module**: Query-only module for generating various financial reports (balance, transactions, income/expense breakdowns, budget comparisons, year-over-year analysis)
3. **Authorization Guards**: Three NestJS guards (CommitteeMemberGuard, BuildingMemberGuard, ResourceOwnerGuard) with Redis caching for performance
4. **User Context Integration**: @CurrentUser() decorator and updates to existing controllers to replace placeholder authentication with real user data

All features integrate with existing infrastructure including audit logging, notifications, file storage, caching, and the @ofeklabs/horizon-auth authentication package.

## Architecture

### Module Structure

The implementation follows the established CQRS pattern used in existing modules (Apartments, Payments, Maintenance, Meetings, Documents, Announcements):

```
src/residents/
├── residents.module.ts
├── residents.controller.ts
├── commands/
│   ├── impl/
│   │   ├── add-committee-member.command.ts
│   │   └── remove-committee-member.command.ts
│   └── handlers/
│       ├── add-committee-member.handler.ts
│       └── remove-committee-member.handler.ts
├── queries/
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
└── dto/
    ├── add-committee-member.dto.ts
    ├── list-residents.dto.ts
    └── search-residents.dto.ts
```

```
src/reports/
├── reports.module.ts
├── reports.controller.ts
└── queries/
    ├── impl/
    │   ├── get-building-balance.query.ts
    │   ├── get-transaction-history.query.ts
    │   ├── get-income-report.query.ts
    │   ├── get-expense-report.query.ts
    │   ├── get-budget-comparison.query.ts
    │   ├── get-payment-status-summary.query.ts
    │   ├── get-year-over-year.query.ts
    │   └── export-financial-report.query.ts
    └── handlers/
        ├── get-building-balance.handler.ts
        ├── get-transaction-history.handler.ts
        ├── get-income-report.handler.ts
        ├── get-expense-report.handler.ts
        ├── get-budget-comparison.handler.ts
        ├── get-payment-status-summary.handler.ts
        ├── get-year-over-year.handler.ts
        └── export-financial-report.handler.ts
```

```
src/common/guards/
├── committee-member.guard.ts
├── building-member.guard.ts
└── resource-owner.guard.ts

src/common/decorators/
└── current-user.decorator.ts
```

### CQRS Pattern

- **Commands**: Write operations (add/remove committee members) that modify state
- **Queries**: Read operations (list residents, generate reports) that retrieve data without side effects
- **Handlers**: Execute commands/queries with business logic
- **Events**: Domain events emitted after state changes (for notifications, audit logs)

### Integration Points

- **AuditLogService**: Log all sensitive operations (committee member changes, report exports, authorization failures)
- **CacheService**: Cache frequently accessed data (committee membership, building membership, user profiles, report results)
- **NotificationService**: Send notifications for committee member changes
- **FileStorageService**: Store exported reports (CSV, PDF) with 24-hour expiration
- **@ofeklabs/horizon-auth**: Retrieve authenticated user information from JWT tokens
- **PrismaService**: Database access with transactions for atomic operations
- **FormattingService**: Format dates, numbers, and currency according to user locale

## Components and Interfaces

### 1. Residents Module

#### API Endpoints

**GET /buildings/:buildingId/residents**
- List all residents (committee members, owners, active tenants)
- Query params: `page, limit, search, userType, apartmentNumber, phoneNumber`
- Authorization: CommitteeMemberGuard + BuildingMemberGuard
- Returns: Paginated resident list with full name, phone, user type, apartments, committee role

**GET /residents/:id**
- Get resident profile with all associated apartments
- Authorization: CommitteeMemberGuard OR ResourceOwnerGuard (user viewing their own profile)
- Returns: Resident profile with full name, phone, user type, apartments (with ownership shares or tenancy dates), committee role

**POST /buildings/:buildingId/committee-members**
- Add a committee member to the building
- Body: `{ userId, role }`
- Authorization: CommitteeMemberGuard + BuildingMemberGuard
- Returns: Created committee membership record

**DELETE /buildings/:buildingId/committee-members/:memberId**
- Remove a committee member from the building
- Authorization: CommitteeMemberGuard + BuildingMemberGuard
- Returns: Success message

**GET /buildings/:buildingId/residents/export**
- Export resident data as CSV
- Authorization: CommitteeMemberGuard + BuildingMemberGuard
- Returns: CSV file download URL (valid for 24 hours)

#### Commands

**AddCommitteeMemberCommand**
- Input: `{ buildingId, userId, role }`
- Validation: User exists, not already a committee member, building exists
- Side effects: Create BuildingCommitteeMember record, invalidate cache, log audit entry, send notification
- Returns: Created committee membership

**RemoveCommitteeMemberCommand**
- Input: `{ buildingId, memberId }`
- Validation: Committee member exists, building exists
- Side effects: Delete BuildingCommitteeMember record, invalidate cache, log audit entry, send notification
- Returns: Success confirmation

#### Queries

**ListResidentsQuery**
- Input: `{ buildingId, page, limit, search?, userType?, apartmentNumber?, phoneNumber? }`
- Logic: Query BuildingCommitteeMember, ApartmentOwner, ApartmentTenant tables, join with UserProfile, filter by search criteria, paginate
- Returns: Paginated list of residents with full details

**GetResidentProfileQuery**
- Input: `{ residentId }`
- Logic: Query UserProfile, join with BuildingCommitteeMember, ApartmentOwner, ApartmentTenant to get all associations
- Returns: Complete resident profile with all roles and apartments

**SearchResidentsQuery**
- Input: `{ buildingId, searchTerm, searchField }`
- Logic: Filter residents by name (case-insensitive contains), phone (contains), or apartment number
- Returns: Filtered resident list

**ExportResidentsQuery**
- Input: `{ buildingId }`
- Logic: Query all residents, format as CSV with headers, upload to file storage with 24-hour expiration
- Returns: Download URL

#### Business Logic

- Validate user exists before adding as committee member
- Prevent duplicate committee memberships (unique constraint on building_id + user_id)
- Support multiple roles per user (user can be owner AND committee member)
- Default sort order: alphabetical by full name
- Maximum page size: 100 items
- Cache committee membership checks (TTL: 15 minutes)
- Invalidate cache when committee membership changes
- Log all committee member additions/removals in audit log
- CSV export includes: full_name, phone_number, user_type, apartment_numbers, committee_role

### 2. Financial Reports Module

#### API Endpoints

**GET /buildings/:buildingId/reports/balance**
- Get current building balance
- Authorization: CommitteeMemberGuard + BuildingMemberGuard
- Returns: `{ balance: Decimal, lastUpdated: DateTime }`

**GET /buildings/:buildingId/reports/transactions**
- Get transaction history with filters
- Query params: `page, limit, startDate?, endDate?, transactionType?`
- Authorization: CommitteeMemberGuard + BuildingMemberGuard
- Returns: Paginated transaction list with date, amount, type, description, apartment, status

**GET /buildings/:buildingId/reports/income**
- Get income report by category
- Query params: `startDate?, endDate?`
- Authorization: CommitteeMemberGuard + BuildingMemberGuard
- Returns: Income breakdown by payment type with totals and counts

**GET /buildings/:buildingId/reports/expenses**
- Get expense report by category
- Query params: `startDate?, endDate?`
- Authorization: CommitteeMemberGuard + BuildingMemberGuard
- Returns: Expense breakdown by maintenance category with totals and counts

**GET /buildings/:buildingId/reports/budget-comparison**
- Get budget vs actual comparison
- Query params: `startDate, endDate`
- Authorization: CommitteeMemberGuard + BuildingMemberGuard
- Returns: Budget comparison with variances and percentages

**GET /buildings/:buildingId/reports/payment-status**
- Get payment status summary
- Query params: `startDate?, endDate?`
- Authorization: CommitteeMemberGuard + BuildingMemberGuard
- Returns: Payment status breakdown (pending, paid, overdue) with collection rate

**GET /buildings/:buildingId/reports/year-over-year**
- Get year-over-year comparison
- Query params: `year?`
- Authorization: CommitteeMemberGuard + BuildingMemberGuard
- Returns: YoY comparison with change amounts and percentages, monthly breakdown

**GET /buildings/:buildingId/reports/export**
- Export financial report
- Query params: `reportType, format (csv|pdf), startDate?, endDate?`
- Authorization: CommitteeMemberGuard + BuildingMemberGuard
- Returns: File download URL (valid for 24 hours)

#### Queries

**GetBuildingBalanceQuery**
- Input: `{ buildingId }`
- Logic: Sum all payments with status "paid", subtract all completed maintenance request costs
- Caching: Cache result with TTL 5 minutes, invalidate on payment/expense changes
- Returns: `{ balance: Decimal, lastUpdated: DateTime }`

**GetTransactionHistoryQuery**
- Input: `{ buildingId, page, limit, startDate?, endDate?, transactionType? }`
- Logic: Query Payment table, filter by date range and type, join with Apartment, order by date DESC
- Default date range: Current month if not specified
- Returns: Paginated transaction list

**GetIncomeReportQuery**
- Input: `{ buildingId, startDate?, endDate? }`
- Logic: Query Payment table, filter by status "paid" and date range, group by payment_type, calculate sum and count
- Default date range: Current month if not specified
- Returns: `{ categories: [{ name, total, count }], grandTotal: Decimal }`

**GetExpenseReportQuery**
- Input: `{ buildingId, startDate?, endDate? }`
- Logic: Query MaintenanceRequest table, filter by status "completed" and completion_date in range, group by category, calculate sum and count
- Default date range: Current month if not specified
- Returns: `{ categories: [{ name, total, count }], grandTotal: Decimal }`

**GetBudgetComparisonQuery**
- Input: `{ buildingId, startDate, endDate }`
- Logic: Calculate actual income/expenses for period, retrieve budgeted amounts from Building configuration (stored in JSON field), calculate variances and percentages
- Variance calculation: `actual - budgeted`
- Variance percentage: `((actual - budgeted) / budgeted) * 100`
- Favorable: Income over budget OR expenses under budget
- Returns: `{ categories: [{ name, budgeted, actual, variance, variancePercent, isFavorable }] }`

**GetPaymentStatusSummaryQuery**
- Input: `{ buildingId, startDate?, endDate? }`
- Logic: Query Payment table, filter by date range, group by status, calculate sum and count for each status
- Collection rate: `(paid_amount / total_amount) * 100`
- Caching: Cache result with TTL 10 minutes
- Returns: `{ pending: { amount, count }, paid: { amount, count }, overdue: { amount, count }, collectionRate: Decimal }`

**GetYearOverYearQuery**
- Input: `{ buildingId, year? }`
- Logic: Calculate income/expenses for current year and previous year (same date range), calculate change amounts and percentages
- Monthly breakdown: Group by month for 12-month trend
- Handle missing previous year data: Return zero for previous year amounts
- Returns: `{ currentYear: { income, expenses }, previousYear: { income, expenses }, change: { income, expenses }, changePercent: { income, expenses }, monthlyBreakdown: [...] }`

**ExportFinancialReportQuery**
- Input: `{ buildingId, reportType, format, startDate?, endDate? }`
- Logic: Generate report data based on reportType, format as CSV or PDF, upload to file storage with 24-hour expiration
- CSV format: Headers + data rows, proper escaping
- PDF format: Formatted tables, building header, report metadata
- Include: Report title, building name, date range, generation timestamp
- Format amounts: Currency symbol + 2 decimal places
- Format dates: User's preferred locale
- Log export action in audit log
- Returns: `{ downloadUrl: string, expiresAt: DateTime }`

#### Business Logic

- All monetary amounts formatted with exactly 2 decimal places
- All percentages formatted with exactly 1 decimal place
- Default date range: Current month when not specified
- Balance calculation: `SUM(payments WHERE status='paid') - SUM(maintenance_requests WHERE status='completed')`
- Update building.current_balance when payment status changes to "paid" (use database transaction)
- Cache balance with TTL 5 minutes, invalidate on payment/expense changes
- Cache payment status summary with TTL 10 minutes
- Maximum page size for transactions: 100 items
- Sort transactions by date DESC (most recent first)
- Sort income/expense categories by total amount DESC
- Handle null budgeted amounts: Return null for variance calculations
- Exported files expire after 24 hours
- All report exports logged in audit log with user ID and report type

### 3. Authorization Guards

#### CommitteeMemberGuard

**Purpose**: Restrict committee-only actions to users with committee membership for the building

**Implementation**:
```typescript
@Injectable()
export class CommitteeMemberGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly auditLog: AuditLogService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // Set by authentication middleware
    const buildingId = this.extractBuildingId(request);

    if (!user || !buildingId) {
      return false;
    }

    // Check cache first
    const cacheKey = `committee:${user.id}:${buildingId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached !== null) {
      return cached === 'true';
    }

    // Query database
    const membership = await this.prisma.buildingCommitteeMember.findUnique({
      where: {
        building_id_user_id: {
          building_id: buildingId,
          user_id: user.id,
        },
      },
    });

    const isCommitteeMember = !!membership;

    // Cache result for 15 minutes
    await this.cache.set(cacheKey, isCommitteeMember ? 'true' : 'false', 900);

    if (!isCommitteeMember) {
      // Log authorization failure
      await this.auditLog.log({
        userId: user.id,
        action: 'authorization.failed',
        resourceType: 'Building',
        resourceId: buildingId,
        metadata: { reason: 'not_committee_member', endpoint: request.url },
      });

      throw new ForbiddenException('Access denied: Committee member role required');
    }

    return true;
  }

  private extractBuildingId(request: any): string | null {
    // Try params first, then body
    return request.params?.buildingId || request.body?.buildingId || null;
  }
}
```

**Cache Invalidation**: When committee membership is created or deleted, invalidate cache key `committee:{userId}:{buildingId}`

**Error Response**: HTTP 403 with message "Access denied: Committee member role required"

#### BuildingMemberGuard

**Purpose**: Restrict building data access to users associated with the building (committee member, owner, or tenant)

**Implementation**:
```typescript
@Injectable()
export class BuildingMemberGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly auditLog: AuditLogService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const buildingId = this.extractBuildingId(request);

    if (!user || !buildingId) {
      return false;
    }

    // Check cache first
    const cacheKey = `building-member:${user.id}:${buildingId}`;
    const cached = await this.cache.get(cacheKey);
    if (cached !== null) {
      return cached === 'true';
    }

    // Check committee membership
    const isCommittee = await this.prisma.buildingCommitteeMember.findUnique({
      where: {
        building_id_user_id: {
          building_id: buildingId,
          user_id: user.id,
        },
      },
    });

    if (isCommittee) {
      await this.cache.set(cacheKey, 'true', 900);
      return true;
    }

    // Check apartment ownership
    const isOwner = await this.prisma.apartmentOwner.findFirst({
      where: {
        user_id: user.id,
        apartment: {
          building_id: buildingId,
        },
      },
    });

    if (isOwner) {
      await this.cache.set(cacheKey, 'true', 900);
      return true;
    }

    // Check active tenancy
    const isTenant = await this.prisma.apartmentTenant.findFirst({
      where: {
        user_id: user.id,
        is_active: true,
        apartment: {
          building_id: buildingId,
        },
      },
    });

    const isMember = !!isTenant;

    // Cache result for 15 minutes
    await this.cache.set(cacheKey, isMember ? 'true' : 'false', 900);

    if (!isMember) {
      await this.auditLog.log({
        userId: user.id,
        action: 'authorization.failed',
        resourceType: 'Building',
        resourceId: buildingId,
        metadata: { reason: 'not_building_member', endpoint: request.url },
      });

      throw new ForbiddenException('Access denied: You do not belong to this building');
    }

    return true;
  }

  private extractBuildingId(request: any): string | null {
    return request.params?.buildingId || request.body?.buildingId || null;
  }
}
```

**Cache Invalidation**: When user's building association changes (committee membership, ownership, tenancy), invalidate cache key `building-member:{userId}:{buildingId}`

**Error Response**: HTTP 403 with message "Access denied: You do not belong to this building"

#### ResourceOwnerGuard

**Purpose**: Restrict resource modifications to resource owners or committee members with appropriate permissions

**Implementation**:
```typescript
@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resourceId = this.extractResourceId(request);
    const resourceType = this.extractResourceType(context);

    if (!user || !resourceId || !resourceType) {
      return false;
    }

    // Special case: Users can always modify their own profile
    if (resourceType === 'UserProfile' && resourceId === user.id) {
      return true;
    }

    // Check if user is committee member for the building (if applicable)
    const buildingId = await this.getBuildingIdForResource(resourceType, resourceId);
    if (buildingId) {
      const isCommittee = await this.prisma.buildingCommitteeMember.findUnique({
        where: {
          building_id_user_id: {
            building_id: buildingId,
            user_id: user.id,
          },
        },
      });

      if (isCommittee) {
        return true; // Committee members can modify any resource in their building
      }
    }

    // Check resource ownership
    const isOwner = await this.checkResourceOwnership(resourceType, resourceId, user.id);

    if (!isOwner) {
      await this.auditLog.log({
        userId: user.id,
        action: 'authorization.failed',
        resourceType,
        resourceId,
        metadata: { reason: 'not_resource_owner', endpoint: request.url },
      });

      throw new ForbiddenException('Access denied: You do not own this resource');
    }

    return true;
  }

  private extractResourceId(request: any): string | null {
    // Try various common parameter names
    return request.params?.id || request.params?.resourceId || request.params?.userId || null;
  }

  private extractResourceType(context: ExecutionContext): string | null {
    // Extract from controller metadata or route path
    const handler = context.getHandler();
    const resourceType = Reflect.getMetadata('resourceType', handler);
    return resourceType || null;
  }

  private async getBuildingIdForResource(resourceType: string, resourceId: string): Promise<string | null> {
    // Map resource types to their building associations
    switch (resourceType) {
      case 'Apartment':
        const apartment = await this.prisma.apartment.findUnique({
          where: { id: resourceId },
          select: { building_id: true },
        });
        return apartment?.building_id || null;

      case 'Payment':
        const payment = await this.prisma.payment.findUnique({
          where: { id: resourceId },
          include: { apartment: { select: { building_id: true } } },
        });
        return payment?.apartment?.building_id || null;

      case 'MaintenanceRequest':
        const maintenance = await this.prisma.maintenanceRequest.findUnique({
          where: { id: resourceId },
          select: { building_id: true },
        });
        return maintenance?.building_id || null;

      default:
        return null;
    }
  }

  private async checkResourceOwnership(resourceType: string, resourceId: string, userId: string): Promise<boolean> {
    // Check ownership based on resource type
    switch (resourceType) {
      case 'MaintenanceRequest':
        const maintenance = await this.prisma.maintenanceRequest.findUnique({
          where: { id: resourceId },
          select: { requester_id: true },
        });
        return maintenance?.requester_id === userId;

      case 'Announcement':
        const announcement = await this.prisma.announcement.findUnique({
          where: { id: resourceId },
          select: { author_id: true },
        });
        return announcement?.author_id === userId;

      case 'Document':
        const document = await this.prisma.document.findUnique({
          where: { id: resourceId },
          select: { uploaded_by: true },
        });
        return document?.uploaded_by === userId;

      default:
        return false;
    }
  }
}
```

**Usage**: Apply with `@ResourceType()` decorator to specify resource type:
```typescript
@Patch(':id')
@UseGuards(ResourceOwnerGuard)
@ResourceType('MaintenanceRequest')
async updateMaintenanceRequest(@Param('id') id: string, @Body() dto: UpdateMaintenanceRequestDto) {
  // ...
}
```

**Error Response**: HTTP 403 with message "Access denied: You do not own this resource"

### 4. User Context Integration

#### @CurrentUser() Decorator

**Purpose**: Extract authenticated user information from request and make it available to controllers

**Implementation**:

The `@CurrentUser()` decorator is provided by the `@ofeklabs/horizon-auth` package and should be imported directly:

```typescript
import { CurrentUser } from '@ofeklabs/horizon-auth';
```

**User Data Structure**:

The decorator returns a user object with the following structure (based on the auth package):

```typescript
interface CurrentUserData {
  id: string;
  email: string;
  fullName: string;
  userType: string;
  preferredLanguage: string;
  // Additional fields provided by @ofeklabs/horizon-auth
}
```

**Integration with @ofeklabs/horizon-auth**:
- Authentication middleware (provided by HorizonAuthModule) extracts JWT from Authorization header
- JWT contains user ID and basic user information
- Middleware attaches authenticated user to `request.user`
- All controllers can access via `@CurrentUser()` decorator
- If no valid authentication token is present, the auth middleware returns HTTP 401 Unauthorized

**User Profile Caching**:
- User profile data is cached by the auth package with TTL 30 minutes
- Cache key: `user-profile:{userId}`
- Cache is automatically invalidated when user profile is updated

#### Controller Updates

All existing controllers need to be updated to:

1. **Import and use @CurrentUser() decorator from @ofeklabs/horizon-auth**:
```typescript
import { CurrentUser } from '@ofeklabs/horizon-auth';

// Before
async createPayment(@Body() dto: CreatePaymentDto) {
  return this.commandBus.execute(
    new CreatePaymentCommand({ ...dto, createdBy: 'current-user-id' })
  );
}

// After
async createPayment(@CurrentUser() user, @Body() dto: CreatePaymentDto) {
  return this.commandBus.execute(
    new CreatePaymentCommand({ ...dto, createdBy: user.id })
  );
}
```

2. **Apply authorization guards**:
```typescript
import { CurrentUser } from '@ofeklabs/horizon-auth';

@Controller('payments')
@UseGuards(AuthGuard) // Global authentication from @ofeklabs/horizon-auth
export class PaymentsController {
  @Post()
  @UseGuards(CommitteeMemberGuard, BuildingMemberGuard)
  async createPayment(@CurrentUser() user, @Body() dto: CreatePaymentDto) {
    // ...
  }

  @Get(':id')
  @UseGuards(BuildingMemberGuard)
  async getPayment(@CurrentUser() user, @Param('id') id: string) {
    // ...
  }

  @Patch(':id')
  @UseGuards(CommitteeMemberGuard, ResourceOwnerGuard)
  @ResourceType('Payment')
  async updatePayment(@CurrentUser() user, @Param('id') id: string, @Body() dto: UpdatePaymentDto) {
    // ...
  }
}
```

3. **Pass user context to handlers**:
```typescript
import { CurrentUser } from '@ofeklabs/horizon-auth';

async createPayment(@CurrentUser() user, @Body() dto: CreatePaymentDto) {
  return this.commandBus.execute(
    new CreatePaymentCommand({
      ...dto,
      createdBy: user.id,
      userLanguage: user.preferredLanguage,
    })
  );
}
```

4. **Use user language for notifications**:
```typescript
// In command handler
await this.notificationService.send({
  userId: payment.apartment.owners[0].user_id,
  templateName: 'payment_created',
  language: command.userLanguage,
  data: { amount: payment.amount, dueDate: payment.due_date },
});
```

#### Guard Application Strategy

**Guard Execution Order**:
1. AuthGuard (authentication) - Global
2. BuildingMemberGuard (building membership)
3. CommitteeMemberGuard (committee role)
4. ResourceOwnerGuard (resource ownership)

**Short-circuit Behavior**: If any guard fails, execution stops and error is returned immediately

**Guard Combinations by Endpoint Type**:
- **Public endpoints**: No guards (explicitly marked with @Public() decorator)
- **Read building data**: AuthGuard + BuildingMemberGuard
- **Create/Update/Delete building data**: AuthGuard + BuildingMemberGuard + CommitteeMemberGuard
- **Modify user-owned resource**: AuthGuard + ResourceOwnerGuard (committee members bypass)
- **View own profile**: AuthGuard only

## Data Models

### Existing Tables (No Changes Required)

The following tables already exist in the Prisma schema and support all required functionality:

- **UserProfile**: Stores user information (full_name, phone_number, user_type, preferred_language)
- **Building**: Stores building information including current_balance
- **BuildingCommitteeMember**: Links users to buildings with committee roles
- **Apartment**: Stores apartment information
- **ApartmentOwner**: Links users to apartments with ownership shares
- **ApartmentTenant**: Links users to apartments with tenancy dates
- **Payment**: Stores payment records with status, type, amounts
- **MaintenanceRequest**: Stores maintenance requests with categories and completion dates

### Schema Enhancements (Optional)

To support budget comparison reports, add a JSON field to the Building model:

```prisma
model Building {
  // ... existing fields ...
  budget_config Json? // Stores budgeted amounts by category
  // Example: { "income": { "monthly_fee": 50000, "special_assessment": 10000 }, "expenses": { "plumbing": 5000, "electrical": 3000 } }
}
```

This field is optional and can be added later. If not present, budget comparison reports will return null for budgeted amounts.

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated:

1. **Search and Filter Properties**: Multiple requirements specify filtering by different fields (name, phone, apartment, user type). These can be combined into comprehensive search accuracy properties.

2. **Formatting Properties**: Many requirements specify decimal places (2 for amounts, 1 for percentages). These can be consolidated into formatting consistency properties.

3. **Caching Properties**: Multiple requirements specify caching with TTLs and invalidation. These can be combined into cache behavior properties.

4. **Authorization Properties**: Multiple requirements specify authorization checks for different guards. These can be consolidated into comprehensive authorization properties.

5. **Aggregation Properties**: Multiple requirements calculate totals, counts, and summaries. These can be combined into calculation accuracy properties.

6. **Audit Logging Properties**: Multiple requirements specify audit logging for different operations. These can be consolidated into audit completeness properties.

7. **Date Range Properties**: Multiple requirements specify default date ranges (current month). These can be combined into default behavior properties.

8. **Pagination Properties**: Multiple requirements specify pagination with max 100 items. These can be consolidated into pagination consistency properties.

### Core Properties

#### Property 1: Resident Search Accuracy
*For any* building and search criteria (name, phone, apartment, user type), all returned residents should match the specified search criteria, and the search should be case-insensitive for text fields.
**Validates: Requirements 1.2, 1.3, 1.4, 1.5**

#### Property 2: Resident Profile Completeness
*For any* resident, the profile should include full name, phone number, user type, all associated apartments (with ownership shares for owners or tenancy dates for tenants), and committee role if the user is a committee member.
**Validates: Requirements 1.6, 1.11**

#### Property 3: Committee Membership Uniqueness
*For any* building and user, attempting to add the same user as a committee member twice should result in the second addition being rejected with a conflict error.
**Validates: Requirements 1.7**

#### Property 4: Committee Member Removal Audit
*For any* committee member removal, an audit log entry should be created with the user ID, action type, resource type, resource ID, and timestamp.
**Validates: Requirements 1.8**

#### Property 5: CSV Export Round Trip
*For any* resident list, exporting to CSV then parsing the CSV should preserve all data fields (full name, phone number, user type, apartment numbers, committee role).
**Validates: Requirements 1.9**

#### Property 6: Pagination Limit Enforcement
*For any* paginated list request, if the requested page size exceeds 100, the system should either reject the request or cap the page size at 100.
**Validates: Requirements 1.10, 3.6**

#### Property 7: Alphabetical Sorting
*For any* resident list without explicit sort parameter, the results should be ordered alphabetically by full name in ascending order.
**Validates: Requirements 1.12**

#### Property 8: Balance Calculation Accuracy
*For any* building, the calculated balance should equal the sum of all payments with status "paid" minus the sum of all completed maintenance request costs.
**Validates: Requirements 2.1, 2.2**

#### Property 9: Decimal Precision Consistency
*For any* monetary amount returned by the system, the value should be formatted with exactly 2 decimal places, and any percentage should be formatted with exactly 1 decimal place.
**Validates: Requirements 2.3, 4.6, 5.6, 6.8, 7.4, 8.7, 9.7**

#### Property 10: Balance Update Atomicity
*For any* payment status change to "paid", the building balance update should occur atomically within the same database transaction, ensuring either both succeed or both fail.
**Validates: Requirements 2.4, 2.5**

#### Property 11: Cache TTL Consistency
*For any* cached value, the cache entry should expire after its specified TTL (5 minutes for balance, 10 minutes for payment summary, 15 minutes for membership checks, 30 minutes for user profiles).
**Validates: Requirements 2.6, 8.8, 10.5, 11.5, 13.7**

#### Property 12: Cache Invalidation on Update
*For any* cached entity, when the entity is updated or deleted, the cache entry for that entity should be invalidated immediately.
**Validates: Requirements 2.7, 10.6, 11.6, 13.8**

#### Property 13: Date Range Filter Accuracy
*For any* query with date range filters, all returned results should have dates that fall within the specified range (inclusive).
**Validates: Requirements 3.2, 4.3, 5.3, 8.6**

#### Property 14: Transaction Type Filter Accuracy
*For any* transaction query with type filter, all returned transactions should match the specified payment type.
**Validates: Requirements 3.3**

#### Property 15: Transaction Data Completeness
*For any* transaction in the transaction history, the record should include transaction date, amount, type, description, apartment number, and status.
**Validates: Requirements 3.4**

#### Property 16: Descending Date Sort
*For any* transaction list, the results should be ordered by date in descending order (most recent first).
**Validates: Requirements 3.5**

#### Property 17: Default Date Range Application
*For any* report query without specified date range, the system should default to the current month (first day to last day of current month).
**Validates: Requirements 3.7, 4.7, 5.7**

#### Property 18: Income Aggregation Accuracy
*For any* building and date range, the income report should correctly aggregate payments by type, and the grand total should equal the sum of all category totals.
**Validates: Requirements 4.1, 4.2, 4.5**

#### Property 19: Category Data Completeness
*For any* income or expense report, each category should include category name, total amount, and count of transactions.
**Validates: Requirements 4.4, 5.4**

#### Property 20: Descending Amount Sort
*For any* income or expense report, categories should be ordered by total amount in descending order (highest first).
**Validates: Requirements 4.8, 5.8**

#### Property 21: Expense Aggregation Accuracy
*For any* building and date range, the expense report should correctly aggregate completed maintenance requests by category, and the grand total should equal the sum of all category totals.
**Validates: Requirements 5.1, 5.2, 5.5**

#### Property 22: Variance Calculation Accuracy
*For any* budget comparison, the variance should equal actual minus budgeted, and the variance percentage should equal ((actual - budgeted) / budgeted) * 100.
**Validates: Requirements 6.3, 6.4**

#### Property 23: Budget Comparison Data Completeness
*For any* budget comparison report, each category should include category name, budgeted amount, actual amount, variance amount, and variance percentage.
**Validates: Requirements 6.5**

#### Property 24: Variance Classification Logic
*For any* budget variance, income over budget should be marked as favorable, income under budget as unfavorable, expenses under budget as favorable, and expenses over budget as unfavorable.
**Validates: Requirements 6.6**

#### Property 25: CSV Export Format Validity
*For any* CSV export, the file should have proper headers in the first row, data rows following, and all fields properly escaped according to CSV standards.
**Validates: Requirements 7.1**

#### Property 26: PDF Export Validity
*For any* PDF export, the file should be a valid PDF document containing formatted tables and building information header.
**Validates: Requirements 7.2**

#### Property 27: Export Metadata Completeness
*For any* report export, the file should include report title, building name, date range, and generation timestamp.
**Validates: Requirements 7.3**

#### Property 28: Locale-Based Date Formatting
*For any* date displayed in exports, the format should match the user's preferred locale settings.
**Validates: Requirements 7.5**

#### Property 29: Export URL Expiration
*For any* exported file, the download URL should be valid for 24 hours and then expire.
**Validates: Requirements 7.6, 7.7**

#### Property 30: Export Audit Logging
*For any* report export, an audit log entry should be created with user ID, report type, and timestamp.
**Validates: Requirements 7.8**

#### Property 31: Payment Status Aggregation Accuracy
*For any* building and date range, the payment status summary should correctly aggregate payments by status (pending, paid, overdue), and the sum of all status totals should equal the total of all payments in the range.
**Validates: Requirements 8.1, 8.2, 8.3, 8.4**

#### Property 32: Collection Rate Calculation
*For any* payment status summary, the collection rate should equal (paid amount / total amount) * 100.
**Validates: Requirements 8.5**

#### Property 33: Year-over-Year Change Calculation
*For any* year-over-year comparison, the change amount should equal current year minus previous year, and the change percentage should equal ((current - previous) / previous) * 100.
**Validates: Requirements 9.3, 9.4**

#### Property 34: Year-over-Year Data Completeness
*For any* year-over-year report, the response should include current year amounts, previous year amounts, change amounts, and change percentages for both income and expenses.
**Validates: Requirements 9.5**

#### Property 35: Monthly Breakdown Structure
*For any* year-over-year report, the monthly breakdown should include data for all 12 months of the year.
**Validates: Requirements 9.8**

#### Property 36: Committee Authorization Verification
*For any* committee-only endpoint, when a user without committee membership attempts access, the request should be denied with HTTP 403 and error message "Access denied: Committee member role required".
**Validates: Requirements 10.1, 10.2, 10.8**

#### Property 37: Building ID Extraction
*For any* request requiring building context, the system should successfully extract the building ID from either request parameters or request body.
**Validates: Requirements 10.3, 11.3, 12.3**

#### Property 38: Committee Membership Query Accuracy
*For any* user and building, the committee membership check should query the BuildingCommitteeMember table and return true only if a matching record exists.
**Validates: Requirements 10.4**

#### Property 39: Authorization Failure Audit Logging
*For any* authorization failure, an audit log entry should be created with user ID, endpoint, resource type, resource ID, and timestamp.
**Validates: Requirements 10.7, 11.7, 12.7**

#### Property 40: Building Membership Verification
*For any* user and building, the building membership check should return true if the user is a committee member, apartment owner, or active tenant for that building.
**Validates: Requirements 11.1, 11.4, 11.8**

#### Property 41: Building Membership Authorization Error
*For any* user not associated with a building, when attempting to access building data, the request should be denied with HTTP 403 and error message "Access denied: You do not belong to this building".
**Validates: Requirements 11.2**

#### Property 42: Resource Ownership Verification
*For any* resource and user, the ownership check should verify the user ID matches the resource owner field or the user is a committee member for the resource's building.
**Validates: Requirements 12.1, 12.4, 12.5, 12.8**

#### Property 43: Resource Ownership Authorization Error
*For any* user who is not the resource owner and not a committee member, when attempting to modify a resource, the request should be denied with HTTP 403 and error message "Access denied: You do not own this resource".
**Validates: Requirements 12.2**

#### Property 44: User Profile Self-Modification
*For any* user, the user should always be allowed to modify their own user profile regardless of building membership or committee status.
**Validates: Requirements 12.6**

#### Property 45: Current User Decorator Functionality
*For any* authenticated request, the @CurrentUser() decorator should extract and populate user ID, email, full name, user type, and preferred language from the request.
**Validates: Requirements 13.1, 13.2, 13.4, 13.6**

#### Property 46: Authentication Requirement
*For any* request without a valid authentication token, the system should return HTTP 401 Unauthorized.
**Validates: Requirements 13.5**

#### Property 47: User Context Propagation
*For any* controller action, the authenticated user's ID should be passed to command and query handlers through the execution context.
**Validates: Requirements 14.1, 14.3**

#### Property 48: Audit Logging with Real User
*For any* auditable action, the audit log entry should contain the authenticated user's ID, not a placeholder value.
**Validates: Requirements 14.5**

#### Property 49: Localized Notifications
*For any* notification sent to a user, the notification should use the user's preferred language from their profile.
**Validates: Requirements 14.6**

#### Property 50: Guard Application Completeness
*For any* controller endpoint, appropriate authorization guards should be applied based on the endpoint type (committee-only, building-specific, resource-modification).
**Validates: Requirements 14.7, 15.1, 15.2, 15.3**

#### Property 51: Authentication Enforcement
*For any* endpoint not explicitly marked as public, authentication should be required.
**Validates: Requirements 14.8**

#### Property 52: Multiple Guards Composition
*For any* endpoint with multiple guards, all guards should be evaluated, and the request should proceed only if all guards pass.
**Validates: Requirements 15.4**

#### Property 53: Guard Execution Order
*For any* endpoint with multiple guards, guards should execute in the order: authentication, building membership, committee membership, resource ownership.
**Validates: Requirements 15.5**

#### Property 54: Guard Short-Circuit Behavior
*For any* endpoint with multiple guards, when any guard fails, execution should stop immediately and return the authorization error without executing subsequent guards.
**Validates: Requirements 15.6**

#### Property 55: Authorization Error Message Clarity
*For any* authorization failure, the error message should clearly indicate which permission check failed (authentication, committee membership, building membership, or resource ownership).
**Validates: Requirements 15.8**

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```typescript
{
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp: string;
  path: string;
  correlationId: string;
}
```

### Error Categories

#### 1. Validation Errors (400 Bad Request)

- Missing required fields (userId, buildingId, role)
- Invalid field formats (date ranges, page sizes)
- Invalid enum values (user type, payment type, category)
- Business rule violations (page size > 100)
- Invalid date ranges (end date before start date)

Example:
```json
{
  "statusCode": 400,
  "message": ["userId must be a valid UUID", "role is required"],
  "error": "Bad Request"
}
```

#### 2. Authorization Errors (401 Unauthorized, 403 Forbidden)

- Missing or invalid JWT token (401)
- Not a committee member (403)
- Not a building member (403)
- Not a resource owner (403)

Examples:
```json
{
  "statusCode": 401,
  "message": "Authentication required",
  "error": "Unauthorized"
}
```

```json
{
  "statusCode": 403,
  "message": "Access denied: Committee member role required",
  "error": "Forbidden"
}
```

```json
{
  "statusCode": 403,
  "message": "Access denied: You do not belong to this building",
  "error": "Forbidden"
}
```

```json
{
  "statusCode": 403,
  "message": "Access denied: You do not own this resource",
  "error": "Forbidden"
}
```

#### 3. Not Found Errors (404 Not Found)

- Building not found
- User not found
- Committee member not found
- Resident not found

Example:
```json
{
  "statusCode": 404,
  "message": "Building with ID abc-123 not found",
  "error": "Not Found"
}
```

#### 4. Conflict Errors (409 Conflict)

- Duplicate committee membership (user already a committee member)

Example:
```json
{
  "statusCode": 409,
  "message": "User is already a committee member of this building",
  "error": "Conflict"
}
```

#### 5. Server Errors (500 Internal Server Error)

- Database connection failures
- External service failures (storage, cache, notifications)
- Unexpected exceptions
- Transaction rollback failures

Example:
```json
{
  "statusCode": 500,
  "message": "An unexpected error occurred",
  "error": "Internal Server Error"
}
```

### Error Handling Strategy

1. **Input Validation**: Use class-validator DTOs to validate all inputs before processing
2. **Business Logic Validation**: Throw domain-specific exceptions in command/query handlers
3. **Exception Filters**: Global exception filter catches all exceptions and formats responses
4. **Logging**: All errors are logged with correlation IDs for tracing
5. **User-Friendly Messages**: Error messages are clear and actionable
6. **Internationalization**: Error messages respect user's preferred language
7. **Audit Logging**: Authorization failures are logged in audit log

### Retry Logic

For transient failures:

1. **Cache Operations**: Retry up to 3 times with exponential backoff
2. **File Storage**: Support resumable uploads with chunking
3. **Database Operations**: Use Prisma's built-in retry logic
4. **Notifications**: Queue for retry if delivery fails

### Transaction Handling

For operations requiring atomicity:

1. **Balance Updates**: Wrap payment status change and balance update in database transaction
2. **Committee Member Changes**: Wrap database update and cache invalidation in transaction
3. **Rollback**: If any step fails, rollback all changes and return error

## Testing Strategy

### Dual Testing Approach

The testing strategy combines unit tests and property-based tests for comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and error conditions
- **Property Tests**: Verify universal properties across all inputs
- Together they provide comprehensive coverage: unit tests catch concrete bugs, property tests verify general correctness

### Unit Testing

Unit tests focus on:

1. **Specific Examples**: Concrete scenarios that demonstrate correct behavior
   - Adding a committee member with valid data
   - Generating an income report for a specific month
   - Exporting residents to CSV
   - Checking committee membership for a specific user

2. **Edge Cases**: Boundary conditions and special cases
   - Empty resident lists
   - No data for previous year in YoY comparison
   - Null budgeted amounts in budget comparison
   - Page size exactly at 100 limit
   - Date range spanning multiple years

3. **Error Conditions**: Invalid inputs and error handling
   - Missing required fields
   - Invalid date ranges (end before start)
   - Duplicate committee membership
   - Unauthorized access attempts
   - Missing authentication token

4. **Integration Points**: Interactions between components
   - Cache service integration (set, get, invalidate)
   - Audit log service integration
   - File storage service integration
   - Notification service integration
   - Database transaction handling

### Property-Based Testing

Property-based tests verify universal properties using randomized inputs:

1. **Test Configuration**:
   - Use `fast-check` library for TypeScript
   - Minimum 100 iterations per property test
   - Each test references its design document property

2. **Test Tagging Format**:
   ```typescript
   // Feature: remaining-hcm-features, Property 1: Resident Search Accuracy
   it('should return only residents matching search criteria', async () => {
     await fc.assert(
       fc.asyncProperty(
         buildingArbitrary(),
         residentListArbitrary(),
         searchCriteriaArbitrary(),
         async (building, residents, criteria) => {
           // Test implementation
         }
       ),
       { numRuns: 100 }
     );
   });
   ```

3. **Property Test Coverage**:
   - Each correctness property from the design document has one property-based test
   - Properties are tested with randomized inputs (buildings, residents, payments, date ranges, etc.)
   - Tests verify invariants, calculations, and business rules

### Test Organization

```
src/residents/
├── __tests__/
│   ├── unit/
│   │   ├── commands/
│   │   │   ├── add-committee-member.handler.spec.ts
│   │   │   └── remove-committee-member.handler.spec.ts
│   │   └── queries/
│   │       ├── list-residents.handler.spec.ts
│   │       ├── get-resident-profile.handler.spec.ts
│   │       ├── search-residents.handler.spec.ts
│   │       └── export-residents.handler.spec.ts
│   └── properties/
│       └── residents.properties.spec.ts

src/reports/
├── __tests__/
│   ├── unit/
│   │   └── queries/
│   │       ├── get-building-balance.handler.spec.ts
│   │       ├── get-transaction-history.handler.spec.ts
│   │       ├── get-income-report.handler.spec.ts
│   │       ├── get-expense-report.handler.spec.ts
│   │       ├── get-budget-comparison.handler.spec.ts
│   │       ├── get-payment-status-summary.handler.spec.ts
│   │       ├── get-year-over-year.handler.spec.ts
│   │       └── export-financial-report.handler.spec.ts
│   └── properties/
│       └── reports.properties.spec.ts

src/common/guards/
├── __tests__/
│   ├── unit/
│   │   ├── committee-member.guard.spec.ts
│   │   ├── building-member.guard.spec.ts
│   │   └── resource-owner.guard.spec.ts
│   └── properties/
│       └── guards.properties.spec.ts

src/common/decorators/
└── __tests__/
    └── unit/
        └── current-user.decorator.spec.ts
```

### Arbitraries for Property Testing

Custom arbitraries for generating test data:

```typescript
// Building arbitrary
const buildingArbitrary = () => fc.record({
  id: fc.uuid(),
  name: fc.string(),
  current_balance: fc.double({ min: 0, max: 1000000 }),
});

// Resident arbitrary
const residentArbitrary = () => fc.record({
  id: fc.uuid(),
  full_name: fc.string({ minLength: 1 }),
  phone_number: fc.option(fc.string()),
  user_type: fc.constantFrom('COMMITTEE', 'OWNER', 'TENANT'),
});

// Payment arbitrary
const paymentArbitrary = () => fc.record({
  id: fc.uuid(),
  amount: fc.double({ min: 0.01, max: 10000 }),
  status: fc.constantFrom('pending', 'paid', 'overdue'),
  payment_type: fc.constantFrom('monthly_fee', 'special_assessment'),
  due_date: fc.date(),
  paid_date: fc.option(fc.date()),
});

// Date range arbitrary
const dateRangeArbitrary = () => fc.record({
  startDate: fc.date(),
  endDate: fc.date(),
}).filter(({ startDate, endDate }) => startDate <= endDate);

// Search criteria arbitrary
const searchCriteriaArbitrary = () => fc.record({
  search: fc.option(fc.string()),
  userType: fc.option(fc.constantFrom('COMMITTEE', 'OWNER', 'TENANT')),
  apartmentNumber: fc.option(fc.string()),
  phoneNumber: fc.option(fc.string()),
});
```

### Testing Infrastructure

1. **Test Database**: Use separate test database with migrations
2. **Test Fixtures**: Factory functions for creating test data
3. **Mocking**: Mock external services (notifications, storage, cache) in unit tests
4. **Integration Tests**: Test with real database and Redis in CI/CD
5. **E2E Tests**: Test complete workflows with authentication

### Coverage Goals

- **Unit Test Coverage**: Minimum 80% code coverage
- **Property Test Coverage**: All 55 correctness properties implemented
- **Integration Test Coverage**: All API endpoints tested end-to-end
- **Guard Test Coverage**: All authorization scenarios tested

### Continuous Integration

1. **Pre-commit**: Run linting and formatting
2. **Pull Request**: Run all unit tests and property tests
3. **Main Branch**: Run full test suite including integration tests
4. **Nightly**: Run extended property tests with 1000 iterations

### Test Examples

#### Unit Test Example
```typescript
describe('AddCommitteeMemberHandler', () => {
  it('should add committee member and invalidate cache', async () => {
    const command = new AddCommitteeMemberCommand({
      buildingId: 'building-1',
      userId: 'user-1',
      role: 'Chairman',
    });

    const result = await handler.execute(command);

    expect(result.building_id).toBe('building-1');
    expect(result.user_id).toBe('user-1');
    expect(result.role).toBe('Chairman');
    expect(cacheService.delete).toHaveBeenCalledWith('committee:user-1:building-1');
    expect(auditLogService.log).toHaveBeenCalled();
  });

  it('should throw conflict error for duplicate membership', async () => {
    // Setup: User already a committee member
    await expect(handler.execute(command)).rejects.toThrow(ConflictException);
  });
});
```

#### Property Test Example
```typescript
// Feature: remaining-hcm-features, Property 8: Balance Calculation Accuracy
describe('Balance Calculation Properties', () => {
  it('should calculate balance as sum of paid payments minus expenses', async () => {
    await fc.assert(
      fc.asyncProperty(
        buildingArbitrary(),
        fc.array(paymentArbitrary()),
        fc.array(maintenanceRequestArbitrary()),
        async (building, payments, maintenanceRequests) => {
          // Setup: Create building, payments, maintenance requests
          await setupTestData(building, payments, maintenanceRequests);

          // Execute: Calculate balance
          const result = await queryBus.execute(
            new GetBuildingBalanceQuery({ buildingId: building.id })
          );

          // Verify: Balance equals sum of paid payments minus completed maintenance costs
          const expectedBalance = payments
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + p.amount, 0) -
            maintenanceRequests
              .filter(m => m.status === 'completed')
              .reduce((sum, m) => sum + (m.cost || 0), 0);

          expect(result.balance).toBeCloseTo(expectedBalance, 2);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```
