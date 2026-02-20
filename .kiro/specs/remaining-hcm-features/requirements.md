# Requirements Document: Remaining HCM Features

## Introduction

This document specifies the remaining core features for Horizon-HCM that need to be implemented to complete the backend system. The platform is built on NestJS with CQRS + Clean Architecture, PostgreSQL with Prisma ORM, and Redis for caching. This specification covers four main areas: Residents Module for managing building occupants, Financial Reports Module for tracking building finances, Authorization Guards for role-based access control, and User Context Integration for replacing placeholder authentication with real user data.

## Glossary

- **System**: The Horizon-HCM platform
- **Committee_Member**: A user with committee role who manages building operations
- **Resident**: A user who is either an owner or tenant in a building
- **Owner**: A user who owns an apartment in a building
- **Tenant**: A user who rents an apartment in a building
- **Building**: A residential building managed by the system
- **Apartment**: A residential unit within a building
- **User_Profile**: Extended user information stored in the System
- **Financial_Report**: A report showing building finances, transactions, income, expenses, and budget comparison
- **Transaction**: A financial record representing income or expense
- **Authorization_Guard**: A security component that verifies user permissions before allowing access to resources
- **Current_User**: The authenticated user making a request to the System
- **User_Context**: Information about the authenticated user available during request processing

## Requirements

### Requirement 1: Resident Management

**User Story:** As a committee member, I want to view and manage all residents in my building, so that I can maintain accurate contact information, understand building occupancy, and manage committee membership.

#### Acceptance Criteria

1. WHEN a committee member requests the resident list, THE System SHALL return all committee members, owners, and active tenants for the building with pagination support
2. WHEN a committee member searches residents by name, THE System SHALL filter residents where the full name contains the search term (case-insensitive)
3. WHEN a committee member searches residents by phone number, THE System SHALL filter residents where the phone number contains the search term
4. WHEN a committee member searches residents by apartment number, THE System SHALL filter residents associated with apartments matching the apartment number
5. WHEN a committee member searches residents by user type, THE System SHALL filter residents by the specified user type (committee, owner, tenant)
6. WHEN a committee member views a resident profile, THE System SHALL return full name, phone number, user type, all associated apartments with ownership shares or tenancy dates, and committee role if applicable
7. WHEN a committee member adds a committee member, THE System SHALL create a committee membership record linking the user to the building with the specified role
8. WHEN a committee member removes a committee member, THE System SHALL delete the committee membership record and log the action in the audit log
9. WHEN a committee member exports resident data, THE System SHALL generate a CSV file containing full name, phone number, user type, apartment numbers, and committee role for all residents
10. THE System SHALL support configurable page size for resident lists with a maximum of 100 items per page
11. WHEN a resident has multiple roles (owner and committee member), THE System SHALL display all roles in the resident profile
12. THE System SHALL order resident lists alphabetically by full name by default

### Requirement 2: Financial Balance Calculation

**User Story:** As a committee member, I want to view the current building balance, so that I can understand the financial health of the building and ensure sufficient funds for operations.

#### Acceptance Criteria

1. WHEN a committee member requests the building balance, THE System SHALL calculate the sum of all paid payments and subtract all recorded expenses
2. THE System SHALL include only payments with status "paid" in the balance calculation
3. THE System SHALL return the balance with exactly 2 decimal places
4. WHEN a payment status changes to "paid", THE System SHALL update the building balance in the Building record
5. THE System SHALL use database transactions to ensure atomic balance updates
6. WHEN the balance calculation completes, THE System SHALL cache the result with a TTL of 5 minutes
7. WHEN a payment or expense is created or updated, THE System SHALL invalidate the balance cache

### Requirement 3: Transaction History Report

**User Story:** As a committee member, I want to view all financial transactions for a date range, so that I can track money flow and identify specific transactions.

#### Acceptance Criteria

1. WHEN a committee member requests transaction history, THE System SHALL return all payment records for the building
2. WHEN a committee member filters by date range, THE System SHALL return only transactions where the paid date or due date falls within the specified range
3. WHEN a committee member filters by transaction type, THE System SHALL return only transactions matching the specified payment type (monthly_fee, special_assessment)
4. THE System SHALL include transaction date, amount, type, description, apartment number, and status for each transaction
5. THE System SHALL order transactions by date in descending order (most recent first)
6. THE System SHALL support pagination with configurable page size up to 100 items
7. WHEN no date range is specified, THE System SHALL default to the current month

### Requirement 4: Income Report by Category

**User Story:** As a committee member, I want to see income broken down by category, so that I can understand revenue sources and track different types of income.

#### Acceptance Criteria

1. WHEN a committee member requests an income report, THE System SHALL calculate total income for each payment type (monthly_fee, special_assessment)
2. THE System SHALL include only payments with status "paid" in the income calculation
3. WHEN a committee member specifies a date range, THE System SHALL include only payments where paid date falls within the range
4. THE System SHALL return the category name, total amount, and count of transactions for each category
5. THE System SHALL calculate the grand total of all income categories
6. THE System SHALL return amounts with exactly 2 decimal places
7. WHEN no date range is specified, THE System SHALL default to the current month
8. THE System SHALL order categories by total amount in descending order

### Requirement 5: Expense Report by Category

**User Story:** As a committee member, I want to see expenses broken down by category, so that I can understand where building funds are being spent and identify cost-saving opportunities.

#### Acceptance Criteria

1. WHEN a committee member requests an expense report, THE System SHALL calculate total expenses for each maintenance request category (plumbing, electrical, hvac, structural, other)
2. THE System SHALL include only completed maintenance requests in the expense calculation
3. WHEN a committee member specifies a date range, THE System SHALL include only maintenance requests where completion date falls within the range
4. THE System SHALL return the category name, total amount, and count of transactions for each category
5. THE System SHALL calculate the grand total of all expense categories
6. THE System SHALL return amounts with exactly 2 decimal places
7. WHEN no date range is specified, THE System SHALL default to the current month
8. THE System SHALL order categories by total amount in descending order

### Requirement 6: Budget Comparison Report

**User Story:** As a committee member, I want to compare actual income and expenses against budgeted amounts, so that I can monitor financial performance and identify variances.

#### Acceptance Criteria

1. WHEN a committee member requests a budget comparison report, THE System SHALL calculate actual income and expenses for the specified period
2. THE System SHALL retrieve budgeted amounts for income and expense categories from the building configuration
3. THE System SHALL calculate the variance (actual minus budgeted) for each category
4. THE System SHALL calculate the variance percentage ((actual - budgeted) / budgeted * 100) for each category
5. THE System SHALL return category name, budgeted amount, actual amount, variance amount, and variance percentage for each category
6. THE System SHALL mark variances as favorable or unfavorable (income over budget is favorable, expenses over budget is unfavorable)
7. WHEN no budgeted amount exists for a category, THE System SHALL return null for variance calculations
8. THE System SHALL return amounts with exactly 2 decimal places and percentages with 1 decimal place

### Requirement 7: Financial Report Export

**User Story:** As a committee member, I want to export financial reports to PDF or CSV, so that I can share reports with residents and maintain offline records.

#### Acceptance Criteria

1. WHEN a committee member exports a report to CSV, THE System SHALL generate a CSV file with appropriate headers and data rows
2. WHEN a committee member exports a report to PDF, THE System SHALL generate a PDF file with formatted tables and building information header
3. THE System SHALL include the report title, building name, date range, and generation timestamp in the export
4. THE System SHALL format monetary amounts with currency symbol and 2 decimal places in exports
5. THE System SHALL format dates according to the user's preferred locale in exports
6. WHEN the export generation completes, THE System SHALL return a download URL valid for 24 hours
7. THE System SHALL store exported files using the file storage service with appropriate expiration
8. THE System SHALL log export actions in the audit log with user ID and report type

### Requirement 8: Payment Status Summary

**User Story:** As a committee member, I want to see a summary of payment statuses, so that I can quickly understand outstanding payments and collection rates.

#### Acceptance Criteria

1. WHEN a committee member requests a payment status summary, THE System SHALL calculate total amount for payments with status "pending"
2. THE System SHALL calculate total amount for payments with status "paid"
3. THE System SHALL calculate total amount for payments with status "overdue"
4. THE System SHALL calculate the count of payments for each status
5. THE System SHALL calculate the collection rate (paid amount / total amount * 100)
6. WHEN a committee member specifies a date range, THE System SHALL include only payments where due date falls within the range
7. THE System SHALL return amounts with exactly 2 decimal places and percentages with 1 decimal place
8. THE System SHALL cache the summary result with a TTL of 10 minutes

### Requirement 9: Year-over-Year Comparison

**User Story:** As a committee member, I want to compare financial data year-over-year, so that I can identify trends and make informed budgeting decisions.

#### Acceptance Criteria

1. WHEN a committee member requests a year-over-year comparison, THE System SHALL calculate total income and expenses for the current year
2. THE System SHALL calculate total income and expenses for the previous year for the same date range
3. THE System SHALL calculate the change amount (current year minus previous year) for income and expenses
4. THE System SHALL calculate the change percentage ((current - previous) / previous * 100) for income and expenses
5. THE System SHALL return current year amount, previous year amount, change amount, and change percentage for both income and expenses
6. WHEN no data exists for the previous year, THE System SHALL return zero for previous year amounts
7. THE System SHALL return amounts with exactly 2 decimal places and percentages with 1 decimal place
8. THE System SHALL support month-by-month comparison showing trends across 12 months

### Requirement 10: Committee Member Authorization Guard

**User Story:** As a system administrator, I want to restrict committee-only actions to committee members, so that only authorized users can perform management operations.

#### Acceptance Criteria

1. WHEN a user attempts to access a committee-only endpoint, THE System SHALL verify the user has a committee membership record for the building
2. WHEN the user is not a committee member, THE System SHALL return HTTP 403 Forbidden with error message "Access denied: Committee member role required"
3. THE System SHALL extract the building ID from the request parameters or body
4. THE System SHALL query the BuildingCommitteeMember table to verify membership
5. THE System SHALL cache committee membership verification results with a TTL of 15 minutes
6. WHEN a committee membership is created or deleted, THE System SHALL invalidate the membership cache for the affected user
7. THE System SHALL log authorization failures in the audit log with user ID, endpoint, and timestamp
8. THE System SHALL allow the request to proceed when committee membership is verified

### Requirement 11: Building Member Authorization Guard

**User Story:** As a system administrator, I want to restrict building data access to building members, so that users can only view data for buildings they belong to.

#### Acceptance Criteria

1. WHEN a user attempts to access building data, THE System SHALL verify the user is associated with the building as a committee member, owner, or tenant
2. WHEN the user is not associated with the building, THE System SHALL return HTTP 403 Forbidden with error message "Access denied: You do not belong to this building"
3. THE System SHALL extract the building ID from the request parameters or body
4. THE System SHALL check if the user has a committee membership, apartment ownership, or active tenancy for the building
5. THE System SHALL cache building membership verification results with a TTL of 15 minutes
6. WHEN a user's building association changes, THE System SHALL invalidate the membership cache for the affected user
7. THE System SHALL log authorization failures in the audit log with user ID, building ID, and timestamp
8. THE System SHALL allow the request to proceed when building membership is verified

### Requirement 12: Resource Owner Authorization Guard

**User Story:** As a system administrator, I want to restrict resource modifications to resource owners, so that users can only modify their own data or data they are responsible for.

#### Acceptance Criteria

1. WHEN a user attempts to modify a resource, THE System SHALL verify the user is the owner of the resource or has appropriate permissions
2. WHEN the user is not the resource owner and not a committee member, THE System SHALL return HTTP 403 Forbidden with error message "Access denied: You do not own this resource"
3. THE System SHALL extract the resource ID from the request parameters
4. THE System SHALL retrieve the resource and check if the user ID matches the resource owner field
5. THE System SHALL allow committee members to modify any resource within their building
6. THE System SHALL allow users to modify their own user profile regardless of building membership
7. THE System SHALL log authorization failures in the audit log with user ID, resource type, resource ID, and timestamp
8. THE System SHALL allow the request to proceed when ownership is verified or user is a committee member

### Requirement 13: Current User Decorator

**User Story:** As a developer, I want to easily access the authenticated user in controllers, so that I can use real user context instead of placeholder values.

#### Acceptance Criteria

1. THE System SHALL provide a @CurrentUser() decorator that extracts user information from the request
2. WHEN the decorator is applied to a controller parameter, THE System SHALL populate the parameter with the authenticated user's ID and profile
3. THE System SHALL integrate with the @ofeklabs/horizon-auth package to retrieve authenticated user information
4. THE System SHALL extract the user ID from the JWT token in the Authorization header
5. WHEN no valid authentication token is present, THE System SHALL return HTTP 401 Unauthorized
6. THE System SHALL retrieve the user profile from the UserProfile table using the user ID
7. THE System SHALL cache user profile data with a TTL of 30 minutes
8. WHEN a user profile is updated, THE System SHALL invalidate the user profile cache

### Requirement 14: Replace Placeholder User Context

**User Story:** As a developer, I want to replace all placeholder 'current-user-id' values with real authenticated user data, so that the system operates with actual user context.

#### Acceptance Criteria

1. WHEN a controller receives a request, THE System SHALL use the @CurrentUser() decorator to obtain the authenticated user
2. THE System SHALL replace all hardcoded 'current-user-id' strings with the actual user ID from the Current_User
3. THE System SHALL pass the user ID to command and query handlers through the execution context
4. THE System SHALL validate that the authenticated user has permission to perform the requested action
5. THE System SHALL use the authenticated user's ID for audit logging
6. THE System SHALL use the authenticated user's preferred language for notifications and responses
7. THE System SHALL apply appropriate authorization guards to all controller endpoints
8. THE System SHALL ensure no endpoint bypasses authentication unless explicitly marked as public

### Requirement 15: Authorization Guard Application

**User Story:** As a developer, I want to apply authorization guards to all controllers, so that access control is consistently enforced across the application.

#### Acceptance Criteria

1. THE System SHALL apply the CommitteeMemberGuard to all endpoints that perform create, update, or delete operations
2. THE System SHALL apply the BuildingMemberGuard to all endpoints that access building-specific data
3. THE System SHALL apply the ResourceOwnerGuard to all endpoints that modify user-owned resources
4. THE System SHALL allow multiple guards to be applied to a single endpoint
5. THE System SHALL execute guards in the order: authentication, building membership, committee membership, resource ownership
6. WHEN any guard fails, THE System SHALL short-circuit and return the authorization error without executing subsequent guards
7. THE System SHALL document required permissions in API documentation for each endpoint
8. THE System SHALL provide clear error messages indicating which permission check failed

## Requirements Quality Validation

### EARS Pattern Compliance

All acceptance criteria follow EARS patterns:
- Ubiquitous requirements use "THE System SHALL"
- Event-driven requirements use "WHEN [event], THE System SHALL"
- State-driven requirements use "WHILE [condition], THE System SHALL" (where applicable)
- All system names are defined in the Glossary

### INCOSE Quality Compliance

All requirements comply with INCOSE quality rules:
- Active voice with clear actors (THE System SHALL)
- No vague terms (specific metrics: 2 decimal places, 15 minutes TTL, 100 items per page)
- No pronouns (consistent use of "THE System", "THE Committee_Member")
- Consistent terminology from Glossary
- Explicit, measurable conditions (HTTP status codes, cache TTL values, decimal precision)
- No escape clauses (no "where possible", "if feasible")
- Positive statements (what the system should do)
- One testable requirement per criterion

### Testability

All acceptance criteria are testable with:
- Specific input conditions (user requests, date ranges, filters)
- Expected outputs (HTTP status codes, data formats, calculations)
- Measurable performance criteria (cache TTL, page sizes, decimal precision)
- Clear success conditions (verification steps, validation rules)

### Parser and Serializer Requirements

This specification includes serialization requirements:
- CSV export for resident data (Requirement 1, Criterion 9)
- CSV and PDF export for financial reports (Requirement 7)
- Round-trip properties should be tested: export then import should preserve data integrity
