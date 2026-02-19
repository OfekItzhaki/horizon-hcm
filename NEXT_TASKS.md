# 🎯 Next Tasks - Horizon-HCM Development

**Current Progress**: 70% Complete  
**Remaining Work**: 30%  
**Estimated Time**: 5-7 days

---

## 🔥 High Priority Tasks

### Task 1: Residents Module (1-2 days)

**Goal**: Implement complete resident management system

**Endpoints to Create** (6 endpoints):
```
GET    /residents                    - List all residents
GET    /residents/search             - Search residents
GET    /residents/:id                - Get resident profile
POST   /residents/committee          - Add committee member
DELETE /residents/committee/:id      - Remove committee member
GET    /residents/export             - Export to CSV
```

**Files to Create**:
```
src/residents/
├── dto/
│   ├── search-residents.dto.ts
│   ├── add-committee-member.dto.ts
│   └── export-residents.dto.ts
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
│   │   ├── search-residents.query.ts
│   │   ├── get-resident.query.ts
│   │   └── export-residents.query.ts
│   └── handlers/
│       ├── list-residents.handler.ts
│       ├── search-residents.handler.ts
│       ├── get-resident.handler.ts
│       └── export-residents.handler.ts
├── residents.module.ts
└── residents.controller.ts
```

**Implementation Steps**:
1. Create module structure and DTOs
2. Implement queries (list, search, get, export)
3. Implement commands (add/remove committee member)
4. Create controller with all endpoints
5. Add ResidentsModule to AppModule
6. Test all endpoints
7. Commit: `feat(residents): implement residents module with CQRS`

**Requirements Reference**: Requirement 2 in `.kiro/specs/core-hcm-features/requirements.md`

**Key Features**:
- List all residents (committee, owners, tenants) for a building
- Search by name, phone, apartment number, user type
- View detailed resident profile with apartments and roles
- Add/remove committee members
- Export resident data to CSV
- Pagination support

---

### Task 2: Financial Reports Module (1-2 days)

**Goal**: Implement comprehensive financial reporting system

**Endpoints to Create** (6 endpoints):
```
GET /reports/balance                 - Current building balance
GET /reports/transactions            - Transaction history
GET /reports/income                  - Income by category
GET /reports/expenses                - Expenses by category
GET /reports/budget-comparison       - Budget vs actual
GET /reports/export                  - Export to PDF/CSV
```

**Files to Create**:
```
src/reports/
├── dto/
│   ├── date-range.dto.ts
│   ├── export-report.dto.ts
│   └── budget-comparison.dto.ts
├── queries/
│   ├── impl/
│   │   ├── get-balance.query.ts
│   │   ├── get-transactions.query.ts
│   │   ├── get-income.query.ts
│   │   ├── get-expenses.query.ts
│   │   ├── get-budget-comparison.query.ts
│   │   └── export-report.query.ts
│   └── handlers/
│       ├── get-balance.handler.ts
│       ├── get-transactions.handler.ts
│       ├── get-income.handler.ts
│       ├── get-expenses.handler.ts
│       ├── get-budget-comparison.handler.ts
│       └── export-report.handler.ts
├── reports.module.ts
└── reports.controller.ts
```

**Implementation Steps**:
1. Create module structure and DTOs
2. Implement balance query (calculate from payments)
3. Implement transaction history query
4. Implement income/expense queries with categorization
5. Implement budget comparison query
6. Implement export functionality (PDF/CSV)
7. Create controller with all endpoints
8. Add ReportsModule to AppModule
9. Test all endpoints
10. Commit: `feat(reports): implement financial reports module with CQRS`

**Requirements Reference**: Requirement 8 in `.kiro/specs/core-hcm-features/requirements.md`

**Key Features**:
- Calculate current building balance from all payments
- List all transactions with filtering by date range
- Calculate income by category (maintenance fees, special assessments)
- Calculate expenses by category (maintenance, utilities, services)
- Compare actual vs budgeted amounts
- Export reports to PDF or CSV
- Support date range filtering
- Year-over-year comparison

---

### Task 3: Authorization Guards (1 day)

**Goal**: Implement role-based access control for all endpoints

**Files to Create**:
```
src/common/guards/
├── committee-member.guard.ts        - Verify user is committee member
├── building-member.guard.ts         - Verify user belongs to building
└── resource-owner.guard.ts          - Verify user owns the resource
```

**Files to Update**:
- All controller files (add `@UseGuards()` decorators)
- All command handlers (verify permissions)

**Implementation Steps**:
1. Create `CommitteeMemberGuard`
   - Check if user has committee membership for building
   - Throw UnauthorizedException if not
2. Create `BuildingMemberGuard`
   - Check if user is committee member, owner, or tenant in building
   - Throw UnauthorizedException if not
3. Create `ResourceOwnerGuard`
   - Check if user owns the resource (e.g., their own payment)
   - Throw UnauthorizedException if not
4. Apply guards to controllers:
   - Committee-only endpoints: `@UseGuards(CommitteeMemberGuard)`
   - Building-specific endpoints: `@UseGuards(BuildingMemberGuard)`
   - User-specific endpoints: `@UseGuards(ResourceOwnerGuard)`
5. Test authorization with different user roles
6. Commit: `feat(auth): implement authorization guards for role-based access control`

**Requirements Reference**: Requirement 9 in `.kiro/specs/core-hcm-features/requirements.md`

**Example Usage**:
```typescript
@Controller('apartments')
@UseGuards(BuildingMemberGuard)
export class ApartmentsController {
  
  @Post()
  @UseGuards(CommitteeMemberGuard)
  async createApartment() {
    // Only committee members can create apartments
  }
  
  @Get(':id')
  async getApartment() {
    // Any building member can view apartments
  }
}
```

---

### Task 4: User Context Integration (1 day)

**Goal**: Replace all placeholder user IDs with real authenticated user

**Files to Update**:
- All controller files with `'current-user-id'` placeholders
- All command handlers that need user context

**Implementation Steps**:
1. Install `@nestjs/passport` if not already installed
2. Create `@CurrentUser()` decorator (or use from auth package)
3. Update all controllers to use `@CurrentUser()` decorator
4. Replace all `'current-user-id'` with actual user from decorator
5. Test with real authentication tokens
6. Commit: `feat(auth): integrate user context from authentication`

**Example Before**:
```typescript
@Post()
async createAnnouncement(@Body() dto: CreateAnnouncementDto) {
  const authorId = 'current-user-id'; // Placeholder
  return this.commandBus.execute(
    new CreateAnnouncementCommand(dto.buildingId, authorId, ...)
  );
}
```

**Example After**:
```typescript
@Post()
async createAnnouncement(
  @Body() dto: CreateAnnouncementDto,
  @CurrentUser() user: User,
) {
  return this.commandBus.execute(
    new CreateAnnouncementCommand(dto.buildingId, user.id, ...)
  );
}
```

**Files with Placeholders** (search for `'current-user-id'`):
- `src/maintenance/maintenance.controller.ts`
- `src/meetings/meetings.controller.ts`
- `src/documents/documents.controller.ts`
- `src/announcements/announcements.controller.ts`

---

## 🔶 Medium Priority Tasks

### Task 5: Notification Triggers (1 day)

**Goal**: Implement notification sending for business events

**Files to Update**:
- All command handlers with `// TODO: Send notification` comments

**Implementation Steps**:
1. Review all TODO comments for notifications
2. Implement notification service calls in handlers
3. Configure notification templates
4. Test notification delivery
5. Commit: `feat(notifications): implement notification triggers for business events`

**Notification Triggers to Implement**:
- Payment due reminders (7 days before)
- Payment overdue notifications
- Maintenance request status changes
- Meeting invitations
- Announcement notifications
- Document upload notifications (if all_residents)

**Example**:
```typescript
// Before (in command handler)
// TODO: Send notifications to all residents in the building

// After
await this.notificationService.send({
  templateName: 'announcement_created',
  recipients: residents.map(r => r.user_id),
  data: {
    title: announcement.title,
    category: announcement.category,
    isUrgent: announcement.is_urgent,
  },
});
```

---

### Task 6: Unit Tests (2-3 days)

**Goal**: Add comprehensive test coverage

**Tests to Create**:
1. **Command Handler Tests**
   - Test each command handler with valid input
   - Test error cases (not found, validation errors)
   - Mock PrismaService and AuditLogService

2. **Query Handler Tests**
   - Test each query handler with mock data
   - Test pagination and filtering
   - Mock PrismaService

3. **Controller Tests**
   - Test each endpoint with valid requests
   - Test authorization (with guards)
   - Mock CommandBus and QueryBus

4. **Integration Tests**
   - Test complete flows (create → update → delete)
   - Test with real database (test database)
   - Test authentication and authorization

**Implementation Steps**:
1. Set up test infrastructure (Jest configuration)
2. Create test utilities and mocks
3. Write unit tests for each module
4. Write integration tests for critical flows
5. Achieve >80% code coverage
6. Commit: `test: add comprehensive unit and integration tests`

**Example Test**:
```typescript
describe('CreateAnnouncementHandler', () => {
  let handler: CreateAnnouncementHandler;
  let prisma: PrismaService;
  let auditLog: AuditLogService;

  beforeEach(() => {
    prisma = mock<PrismaService>();
    auditLog = mock<AuditLogService>();
    handler = new CreateAnnouncementHandler(prisma, auditLog);
  });

  it('should create announcement successfully', async () => {
    // Arrange
    const command = new CreateAnnouncementCommand(...);
    prisma.building.findUnique.mockResolvedValue(mockBuilding);
    prisma.announcement.create.mockResolvedValue(mockAnnouncement);

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result).toEqual(mockAnnouncement);
    expect(auditLog.log).toHaveBeenCalled();
  });
});
```

---

## 🔵 Low Priority Tasks

### Task 7: Performance Optimization (1-2 days)

**Goal**: Optimize database queries and add caching

**Optimizations**:
1. Add caching to frequently accessed queries
2. Optimize database queries with proper joins
3. Add database indexes where needed
4. Implement query result caching
5. Add Redis caching for expensive operations

**Example**:
```typescript
@Cacheable('apartments', 300) // Cache for 5 minutes
async listApartments(buildingId: string) {
  return this.prisma.apartment.findMany({
    where: { building_id: buildingId },
    include: { owners: true, tenants: true },
  });
}
```

---

### Task 8: API Documentation Improvements (1 day)

**Goal**: Enhance Swagger documentation

**Improvements**:
1. Add detailed descriptions to all endpoints
2. Add request/response examples
3. Document error responses
4. Add authentication requirements
5. Group endpoints by feature
6. Add API versioning documentation

---

### Task 9: Error Handling Improvements (1 day)

**Goal**: Standardize error handling across the application

**Improvements**:
1. Create custom exception classes
2. Implement global exception filter
3. Standardize error response format
4. Add error codes for client handling
5. Improve error messages

---

## 📊 Progress Tracking

### Current Status
- ✅ Infrastructure: 100%
- ✅ Business Features: 70%
- ⏳ Authorization: 0%
- ⏳ Testing: 0%

### After Completing High Priority Tasks
- ✅ Infrastructure: 100%
- ✅ Business Features: 100%
- ✅ Authorization: 100%
- ⏳ Testing: 0%

### After Completing All Tasks
- ✅ Infrastructure: 100%
- ✅ Business Features: 100%
- ✅ Authorization: 100%
- ✅ Testing: 80%+

---

## 🎯 Recommended Order

1. **Day 1-2**: Residents Module
2. **Day 3-4**: Financial Reports Module
3. **Day 5**: Authorization Guards
4. **Day 6**: User Context Integration
5. **Day 7**: Notification Triggers
6. **Day 8-10**: Unit Tests
7. **Day 11**: Performance Optimization
8. **Day 12**: Documentation & Error Handling

**Total Estimated Time**: 10-12 days to 100% completion

---

## 📝 Notes

### Before Starting Each Task
1. Read the requirements in `.kiro/specs/core-hcm-features/requirements.md`
2. Review existing similar modules for patterns
3. Check Prisma schema for available models
4. Plan the file structure

### After Completing Each Task
1. Test all endpoints manually
2. Run `npm run build` to check for errors
3. Update `docs/IMPLEMENTATION_STATUS.md`
4. Commit with descriptive message
5. Push to GitHub

### Testing Checklist
- [ ] All endpoints return correct status codes
- [ ] Validation works for invalid input
- [ ] Authorization works correctly
- [ ] Audit logs are created
- [ ] Database transactions work
- [ ] Error handling works

---

## 🚀 Ready to Start?

Pick Task 1 (Residents Module) and start building! Follow the CQRS pattern used in existing modules, and you'll be done in no time.

**Good luck!** 🎉
