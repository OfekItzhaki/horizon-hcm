# Implementation Plan: Remaining HCM Features

## Overview

This implementation plan completes the remaining 30% of Horizon-HCM backend features. The approach follows the established CQRS + Clean Architecture patterns with NestJS, building on the existing 70% complete system (Apartments, Payments, Maintenance, Meetings, Documents, Announcements modules).

The implementation is organized into four main areas:
1. **Residents Module**: CQRS module with commands for committee member management and queries for listing/searching residents
2. **Financial Reports Module**: Query-only module with 8 report types for comprehensive financial analysis
3. **Authorization Guards**: Three NestJS guards with Redis caching for role-based access control
4. **User Context Integration**: Replace placeholder authentication with real user data from @ofeklabs/horizon-auth

All features integrate with existing infrastructure (AuditLogService, CacheService, NotificationService, FileStorageService) and follow the exact patterns established in core-hcm-features.

## Tasks

- [x] 1. Implement Residents Module
  - [x] 1.1 Create module structure and DTOs
    - Create residents.module.ts with CQRS imports (CommandBus, QueryBus)
    - Create DTOs: AddCommitteeMemberDto, ListResidentsDto, SearchResidentsDto
    - Add validation decorators (@IsUUID, @IsString, @IsOptional, @IsEnum)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7_

  - [x] 1.2 Implement committee member commands
    - AddCommitteeMemberCommand and handler (validate user exists, check uniqueness, create record)
    - RemoveCommitteeMemberCommand and handler (delete record, invalidate cache)
    - Emit domain events for notifications
    - Integrate with AuditLogService for all operations
    - Invalidate cache keys: `committee:{userId}:{buildingId}` and `building-member:{userId}:{buildingId}`
    - _Requirements: 1.7, 1.8_

  - [x]* 1.3 Write property test for committee membership uniqueness
    - **Property 3: Committee Membership Uniqueness**
    - **Validates: Requirements 1.7**

  - [x]* 1.4 Write property test for committee member removal audit
    - **Property 4: Committee Member Removal Audit**
    - **Validates: Requirements 1.8**

  - [x] 1.5 Implement resident queries
    - ListResidentsQuery and handler (join BuildingCommitteeMember, ApartmentOwner, ApartmentTenant with UserProfile)
    - GetResidentProfileQuery and handler (get all associations for a user)
    - SearchResidentsQuery and handler (filter by name, phone, apartment, user type)
    - ExportResidentsQuery and handler (generate CSV, upload to FileStorageService with 24h expiration)
    - Support pagination with max 100 items per page
    - Default sort: alphabetical by full_name
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.9, 1.10, 1.11, 1.12_

  - [x]* 1.6 Write property test for resident search accuracy
    - **Property 1: Resident Search Accuracy**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5**

  - [x]* 1.7 Write property test for resident profile completeness
    - **Property 2: Resident Profile Completeness**
    - **Validates: Requirements 1.6, 1.11**

  - [x]* 1.8 Write property test for CSV export round trip
    - **Property 5: CSV Export Round Trip**
    - **Validates: Requirements 1.9**

  - [x]* 1.9 Write property test for pagination limit enforcement
    - **Property 6: Pagination Limit Enforcement**
    - **Validates: Requirements 1.10**

  - [x]* 1.10 Write property test for alphabetical sorting
    - **Property 7: Alphabetical Sorting**
    - **Validates: Requirements 1.12**

  - [x] 1.11 Create residents controller
    - GET /buildings/:buildingId/residents (list with filters)
    - GET /residents/:id (get profile)
    - POST /buildings/:buildingId/committee-members (add committee member)
    - DELETE /buildings/:buildingId/committee-members/:memberId (remove committee member)
    - GET /buildings/:buildingId/residents/export (export CSV)
    - Apply guards: CommitteeMemberGuard + BuildingMemberGuard for list/export
    - Apply guards: CommitteeMemberGuard OR ResourceOwnerGuard for profile (users can view their own)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9_

  - [ ]* 1.12 Write unit tests for residents module
    - Test command handlers with specific examples
    - Test query handlers with mock data
    - Test controller endpoints with authorization
    - Test error conditions (duplicate membership, user not found)
    - _Requirements: 1.1-1.12_

- [x] 2. Checkpoint - Residents Module Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Implement Financial Reports Module
  - [x] 3.1 Create module structure and DTOs
    - Create reports.module.ts with CQRS imports (QueryBus only, no commands)
    - Create DTOs for all report queries with date range filters
    - Add validation decorators for date ranges, report types, formats
    - _Requirements: 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1_

  - [x] 3.2 Implement building balance query
    - GetBuildingBalanceQuery and handler
    - Calculate: SUM(payments WHERE status='paid') - SUM(maintenance_requests WHERE status='completed')
    - Cache result with TTL 5 minutes (key: `balance:{buildingId}`)
    - Invalidate cache on payment/expense changes
    - Return balance with exactly 2 decimal places
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x]* 3.3 Write property test for balance calculation accuracy
    - **Property 8: Balance Calculation Accuracy**
    - **Validates: Requirements 2.1, 2.2**

  - [x]* 3.4 Write property test for decimal precision consistency
    - **Property 9: Decimal Precision Consistency**
    - **Validates: Requirements 2.3, 4.6, 5.6, 6.8, 7.4, 8.7, 9.7**

  - [x]* 3.5 Write property test for balance update atomicity
    - **Property 10: Balance Update Atomicity**
    - **Validates: Requirements 2.4, 2.5**

  - [x]* 3.6 Write property test for cache TTL consistency
    - **Property 11: Cache TTL Consistency**
    - **Validates: Requirements 2.6, 8.8, 10.5, 11.5, 13.7**

  - [x]* 3.7 Write property test for cache invalidation on update
    - **Property 12: Cache Invalidation on Update**
    - **Validates: Requirements 2.7, 10.6, 11.6, 13.8**

  - [x] 3.8 Implement transaction history query
    - GetTransactionHistoryQuery and handler
    - Query Payment table with date range and type filters
    - Join with Apartment to get apartment_number
    - Default date range: current month if not specified
    - Order by date DESC (most recent first)
    - Support pagination with max 100 items
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [x]* 3.9 Write property test for date range filter accuracy
    - **Property 13: Date Range Filter Accuracy**
    - **Validates: Requirements 3.2, 4.3, 5.3, 8.6**

  - [x]* 3.10 Write property test for transaction type filter accuracy
    - **Property 14: Transaction Type Filter Accuracy**
    - **Validates: Requirements 3.3**

  - [x]* 3.11 Write property test for transaction data completeness
    - **Property 15: Transaction Data Completeness**
    - **Validates: Requirements 3.4**

  - [x]* 3.12 Write property test for descending date sort
    - **Property 16: Descending Date Sort**
    - **Validates: Requirements 3.5**

  - [x]* 3.13 Write property test for default date range application
    - **Property 17: Default Date Range Application**
    - **Validates: Requirements 3.7, 4.7, 5.7**

  - [x] 3.14 Implement income report query
    - GetIncomeReportQuery and handler
    - Query Payment table, filter by status='paid' and date range
    - Group by payment_type, calculate SUM and COUNT
    - Calculate grand total
    - Order categories by total DESC
    - Default date range: current month
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [x]* 3.15 Write property test for income aggregation accuracy
    - **Property 18: Income Aggregation Accuracy**
    - **Validates: Requirements 4.1, 4.2, 4.5**

  - [x]* 3.16 Write property test for category data completeness
    - **Property 19: Category Data Completeness**
    - **Validates: Requirements 4.4, 5.4**

  - [x]* 3.17 Write property test for descending amount sort
    - **Property 20: Descending Amount Sort**
    - **Validates: Requirements 4.8, 5.8**

  - [x] 3.18 Implement expense report query
    - GetExpenseReportQuery and handler
    - Query MaintenanceRequest table, filter by status='completed' and completion_date in range
    - Group by category, calculate SUM and COUNT
    - Calculate grand total
    - Order categories by total DESC
    - Default date range: current month
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [x]* 3.19 Write property test for expense aggregation accuracy
    - **Property 21: Expense Aggregation Accuracy**
    - **Validates: Requirements 5.1, 5.2, 5.5**

  - [x] 3.20 Implement budget comparison query
    - GetBudgetComparisonQuery and handler
    - Calculate actual income/expenses for period
    - Retrieve budgeted amounts from Building.budget_config JSON field
    - Calculate variance: actual - budgeted
    - Calculate variance percentage: ((actual - budgeted) / budgeted) * 100
    - Mark favorable/unfavorable (income over = favorable, expenses over = unfavorable)
    - Handle null budgeted amounts (return null for variance)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8_

  - [x]* 3.21 Write property test for variance calculation accuracy
    - **Property 22: Variance Calculation Accuracy**
    - **Validates: Requirements 6.3, 6.4**

  - [x]* 3.22 Write property test for budget comparison data completeness
    - **Property 23: Budget Comparison Data Completeness**
    - **Validates: Requirements 6.5**

  - [x]* 3.23 Write property test for variance classification logic
    - **Property 24: Variance Classification Logic**
    - **Validates: Requirements 6.6**

  - [x] 3.24 Implement payment status summary query
    - GetPaymentStatusSummaryQuery and handler
    - Query Payment table, filter by date range
    - Group by status, calculate SUM and COUNT for each
    - Calculate collection rate: (paid_amount / total_amount) * 100
    - Cache result with TTL 10 minutes (key: `payment-summary:{buildingId}:{dateRange}`)
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

  - [x]* 3.25 Write property test for payment status aggregation accuracy
    - **Property 31: Payment Status Aggregation Accuracy**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**

  - [x]* 3.26 Write property test for collection rate calculation
    - **Property 32: Collection Rate Calculation**
    - **Validates: Requirements 8.5**

  - [x] 3.27 Implement year-over-year comparison query
    - GetYearOverYearQuery and handler
    - Calculate income/expenses for current year and previous year (same date range)
    - Calculate change amount: current - previous
    - Calculate change percentage: ((current - previous) / previous) * 100
    - Handle missing previous year data (return zero)
    - Generate monthly breakdown for 12-month trend
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8_

  - [x]* 3.28 Write property test for year-over-year change calculation
    - **Property 33: Year-over-Year Change Calculation**
    - **Validates: Requirements 9.3, 9.4**

  - [x]* 3.29 Write property test for year-over-year data completeness
    - **Property 34: Year-over-Year Data Completeness**
    - **Validates: Requirements 9.5**

  - [x]* 3.30 Write property test for monthly breakdown structure
    - **Property 35: Monthly Breakdown Structure**
    - **Validates: Requirements 9.8**

  - [x] 3.31 Implement financial report export query
    - ExportFinancialReportQuery and handler
    - Support report types: balance, transactions, income, expenses, budget, payment-status, yoy
    - Support formats: CSV and PDF
    - CSV: Generate headers + data rows with proper escaping
    - PDF: Generate formatted tables with building header
    - Include: report title, building name, date range, generation timestamp
    - Format amounts: currency symbol + 2 decimal places
    - Format dates: user's preferred locale (use FormattingService)
    - Upload to FileStorageService with 24-hour expiration
    - Log export in AuditLogService
    - Return download URL
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

  - [ ]* 3.32 Write property test for CSV export format validity
    - **Property 25: CSV Export Format Validity**
    - **Validates: Requirements 7.1**

  - [ ]* 3.33 Write property test for PDF export validity
    - **Property 26: PDF Export Validity**
    - **Validates: Requirements 7.2**

  - [ ]* 3.34 Write property test for export metadata completeness
    - **Property 27: Export Metadata Completeness**
    - **Validates: Requirements 7.3**

  - [ ]* 3.35 Write property test for locale-based date formatting
    - **Property 28: Locale-Based Date Formatting**
    - **Validates: Requirements 7.5**

  - [ ]* 3.36 Write property test for export URL expiration
    - **Property 29: Export URL Expiration**
    - **Validates: Requirements 7.6, 7.7**

  - [ ]* 3.37 Write property test for export audit logging
    - **Property 30: Export Audit Logging**
    - **Validates: Requirements 7.8**

  - [x] 3.38 Create reports controller
    - GET /buildings/:buildingId/reports/balance (get balance)
    - GET /buildings/:buildingId/reports/transactions (get transaction history)
    - GET /buildings/:buildingId/reports/income (get income report)
    - GET /buildings/:buildingId/reports/expenses (get expense report)
    - GET /buildings/:buildingId/reports/budget-comparison (get budget comparison)
    - GET /buildings/:buildingId/reports/payment-status (get payment status summary)
    - GET /buildings/:buildingId/reports/year-over-year (get YoY comparison)
    - GET /buildings/:buildingId/reports/export (export report)
    - Apply guards: CommitteeMemberGuard + BuildingMemberGuard for all endpoints
    - _Requirements: 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1_

  - [ ]* 3.39 Write unit tests for reports module
    - Test query handlers with specific examples
    - Test controller endpoints with authorization
    - Test error conditions (invalid date ranges, missing budget data)
    - Test caching behavior
    - _Requirements: 2.1-9.8_

- [x] 4. Checkpoint - Financial Reports Module Complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement Authorization Guards
  - [x] 5.1 Create CommitteeMemberGuard
    - Implement CanActivate interface
    - Extract buildingId from request.params or request.body
    - Check cache first (key: `committee:{userId}:{buildingId}`, TTL: 15 minutes)
    - Query BuildingCommitteeMember table if cache miss
    - Cache result for 15 minutes
    - Log authorization failures in AuditLogService
    - Throw ForbiddenException with message "Access denied: Committee member role required"
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

  - [ ]* 5.2 Write property test for committee authorization verification
    - **Property 36: Committee Authorization Verification**
    - **Validates: Requirements 10.1, 10.2, 10.8**

  - [ ]* 5.3 Write property test for building ID extraction
    - **Property 37: Building ID Extraction**
    - **Validates: Requirements 10.3, 11.3, 12.3**

  - [ ]* 5.4 Write property test for committee membership query accuracy
    - **Property 38: Committee Membership Query Accuracy**
    - **Validates: Requirements 10.4**

  - [ ]* 5.5 Write property test for authorization failure audit logging
    - **Property 39: Authorization Failure Audit Logging**
    - **Validates: Requirements 10.7, 11.7, 12.7**

  - [x] 5.6 Create BuildingMemberGuard
    - Implement CanActivate interface
    - Extract buildingId from request.params or request.body
    - Check cache first (key: `building-member:{userId}:{buildingId}`, TTL: 15 minutes)
    - Query BuildingCommitteeMember, ApartmentOwner, ApartmentTenant tables if cache miss
    - Cache result for 15 minutes
    - Log authorization failures in AuditLogService
    - Throw ForbiddenException with message "Access denied: You do not belong to this building"
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

  - [ ]* 5.7 Write property test for building membership verification
    - **Property 40: Building Membership Verification**
    - **Validates: Requirements 11.1, 11.4, 11.8**

  - [ ]* 5.8 Write property test for building membership authorization error
    - **Property 41: Building Membership Authorization Error**
    - **Validates: Requirements 11.2**

  - [x] 5.9 Create ResourceOwnerGuard
    - Implement CanActivate interface
    - Extract resourceId from request.params (id, resourceId, or userId)
    - Extract resourceType from controller metadata using Reflect.getMetadata
    - Special case: Users can always modify their own UserProfile
    - Check if user is committee member for the resource's building (bypass ownership check)
    - Query resource table to verify ownership (requester_id, author_id, uploaded_by fields)
    - Log authorization failures in AuditLogService
    - Throw ForbiddenException with message "Access denied: You do not own this resource"
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8_

  - [ ]* 5.10 Write property test for resource ownership verification
    - **Property 42: Resource Ownership Verification**
    - **Validates: Requirements 12.1, 12.4, 12.5, 12.8**

  - [ ]* 5.11 Write property test for resource ownership authorization error
    - **Property 43: Resource Ownership Authorization Error**
    - **Validates: Requirements 12.2**

  - [ ]* 5.12 Write property test for user profile self-modification
    - **Property 44: User Profile Self-Modification**
    - **Validates: Requirements 12.6**

  - [x] 5.13 Create @ResourceType() decorator
    - Create custom decorator to set resource type metadata
    - Use Reflect.setMetadata to store resourceType on handler
    - Usage: @ResourceType('MaintenanceRequest')
    - _Requirements: 12.4_

  - [ ]* 5.14 Write unit tests for authorization guards
    - Test each guard with specific examples
    - Test cache hit/miss scenarios
    - Test error conditions (missing buildingId, user not found)
    - Test audit logging
    - _Requirements: 10.1-12.8_

- [ ] 6. Checkpoint - Authorization Guards Complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement User Context Integration
  - [x] 7.1 Import @CurrentUser() decorator from @ofeklabs/horizon-auth
    - Add import statement: `import { CurrentUser } from '@ofeklabs/horizon-auth';`
    - Verify HorizonAuthModule is imported in AppModule
    - Verify AuthGuard is applied globally or per-controller
    - _Requirements: 13.1, 13.2, 13.5_

  - [ ]* 7.2 Write property test for current user decorator functionality
    - **Property 45: Current User Decorator Functionality**
    - **Validates: Requirements 13.1, 13.2, 13.4, 13.6**

  - [ ]* 7.3 Write property test for authentication requirement
    - **Property 46: Authentication Requirement**
    - **Validates: Requirements 13.5**

  - [x] 7.4 Update Maintenance controller
    - Import @CurrentUser() from @ofeklabs/horizon-auth
    - Replace 'current-user-id' placeholders with user.id
    - Pass user.preferredLanguage to command handlers for notifications
    - Apply authorization guards to all endpoints
    - File: src/maintenance/maintenance.controller.ts
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 14.1, 14.3, 14.6, 14.7, 14.8_

  - [x] 7.5 Update Meetings controller
    - Import @CurrentUser() from @ofeklabs/horizon-auth
    - Replace 'current-user-id' placeholders with user.id
    - Pass user.preferredLanguage to command handlers for notifications
    - Apply authorization guards to all endpoints
    - File: src/meetings/meetings.controller.ts
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 14.1, 14.3, 14.6, 14.7, 14.8_

  - [x] 7.6 Update Documents controller
    - Import @CurrentUser() from @ofeklabs/horizon-auth
    - Replace 'current-user-id' placeholders with user.id
    - Pass user.preferredLanguage to command handlers for notifications
    - Apply authorization guards to all endpoints
    - File: src/documents/documents.controller.ts
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 14.1, 14.3, 14.6, 14.7, 14.8_

  - [x] 7.7 Update Announcements controller
    - Import @CurrentUser() from @ofeklabs/horizon-auth
    - Replace 'current-user-id' placeholders with user.id
    - Pass user.preferredLanguage to command handlers for notifications
    - Apply authorization guards to all endpoints
    - File: src/announcements/announcements.controller.ts
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 14.1, 14.3, 14.6, 14.7, 14.8_

  - [x] 7.8 Update Apartments controller
    - Import @CurrentUser() from @ofeklabs/horizon-auth
    - Replace 'current-user-id' placeholders with user.id
    - Pass user.preferredLanguage to command handlers for notifications
    - Apply authorization guards to all endpoints
    - File: src/apartments/apartments.controller.ts
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 14.1, 14.3, 14.6, 14.7, 14.8_

  - [x] 7.9 Update Payments controller
    - Import @CurrentUser() from @ofeklabs/horizon-auth
    - Replace 'current-user-id' placeholders with user.id
    - Pass user.preferredLanguage to command handlers for notifications
    - Apply authorization guards to all endpoints
    - File: src/payments/payments.controller.ts
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 14.1, 14.3, 14.6, 14.7, 14.8_

  - [ ]* 7.10 Write property test for user context propagation
    - **Property 47: User Context Propagation**
    - **Validates: Requirements 14.1, 14.3**

  - [ ]* 7.11 Write property test for audit logging with real user
    - **Property 48: Audit Logging with Real User**
    - **Validates: Requirements 14.5**

  - [ ]* 7.12 Write property test for localized notifications
    - **Property 49: Localized Notifications**
    - **Validates: Requirements 14.6**

  - [ ]* 7.13 Write property test for guard application completeness
    - **Property 50: Guard Application Completeness**
    - **Validates: Requirements 14.7, 15.1, 15.2, 15.3**

  - [ ]* 7.14 Write property test for authentication enforcement
    - **Property 51: Authentication Enforcement**
    - **Validates: Requirements 14.8**

  - [ ]* 7.15 Write unit tests for updated controllers
    - Test @CurrentUser() decorator usage
    - Test user context propagation to handlers
    - Test authorization guard application
    - Test error conditions (missing authentication)
    - _Requirements: 13.1-14.8_

- [ ] 8. Checkpoint - User Context Integration Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement Guard Composition and Execution Order
  - [x] 9.1 Verify guard execution order
    - Ensure guards execute in order: AuthGuard, BuildingMemberGuard, CommitteeMemberGuard, ResourceOwnerGuard
    - Test short-circuit behavior (first failure stops execution)
    - Verify all guards must pass for request to proceed
    - _Requirements: 15.4, 15.5, 15.6_

  - [ ]* 9.2 Write property test for multiple guards composition
    - **Property 52: Multiple Guards Composition**
    - **Validates: Requirements 15.4**

  - [ ]* 9.3 Write property test for guard execution order
    - **Property 53: Guard Execution Order**
    - **Validates: Requirements 15.5**

  - [ ]* 9.4 Write property test for guard short-circuit behavior
    - **Property 54: Guard Short-Circuit Behavior**
    - **Validates: Requirements 15.6**

  - [ ]* 9.5 Write property test for authorization error message clarity
    - **Property 55: Authorization Error Message Clarity**
    - **Validates: Requirements 15.8**

  - [x] 9.2 Apply guard combinations to all endpoints
    - Review all controllers (Residents, Reports, Maintenance, Meetings, Documents, Announcements, Apartments, Payments)
    - Apply appropriate guard combinations based on endpoint type:
      - Read building data: AuthGuard + BuildingMemberGuard
      - Create/Update/Delete building data: AuthGuard + BuildingMemberGuard + CommitteeMemberGuard
      - Modify user-owned resource: AuthGuard + ResourceOwnerGuard (with @ResourceType decorator)
      - View own profile: AuthGuard only
    - _Requirements: 15.1, 15.2, 15.3, 15.7_

  - [ ]* 9.6 Write integration tests for guard combinations
    - Test all guard combinations with real database and Redis
    - Test authorization scenarios across all modules
    - Test error responses and audit logging
    - _Requirements: 15.1-15.8_

- [x] 10. Final Checkpoint - All Features Complete
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (55 total)
- Unit tests validate specific examples and edge cases
- All database tables already exist - no migrations needed
- Follow exact CQRS pattern from existing modules
- Use Prisma ORM with snake_case fields
- Guards use Redis caching with appropriate TTLs
- @CurrentUser() decorator is provided by @ofeklabs/horizon-auth (don't create custom)
- Must integrate with existing services: AuditLogService, CacheService, NotificationService, FileStorageService
