# Implementation Plan: Core House Committee Management Features

## Overview

This implementation plan breaks down the core HCM features into incremental, testable tasks. The approach follows CQRS + Clean Architecture patterns with NestJS, building feature modules one at a time. Each module includes commands, queries, DTOs, and integrates with existing infrastructure (notifications, file storage, audit logs, real-time updates).

The implementation is organized to deliver value incrementally, starting with foundational features (apartments, residents) and building up to more complex features (payments, maintenance, meetings, documents, announcements, reports).

## Tasks

- [x] 1. Database Schema Updates
  - Update Prisma schema with new models (Payment, MaintenanceRequest, Meeting, Document, Announcement, etc.)
  - Add relations to existing models (Building, Apartment, File)
  - Generate Prisma client
  - Create and run database migrations
  - _Requirements: All requirements depend on database schema_

- [x] 2. Implement Apartments Module
  - [x] 2.1 Create module structure and DTOs
    - Create apartments.module.ts with CQRS imports
    - Create DTOs for apartment operations (CreateApartmentDto, UpdateApartmentDto, AssignOwnerDto, AssignTenantDto)
    - Add validation decorators to DTOs
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.2 Implement apartment commands
    - CreateApartmentCommand and handler (validate uniqueness, create apartment)
    - UpdateApartmentCommand and handler (update details, log audit)
    - DeleteApartmentCommand and handler (check dependencies, soft delete)
    - AssignOwnerCommand and handler (validate ownership shares ≤ 100%)
    - RemoveOwnerCommand and handler
    - AssignTenantCommand and handler (set move-in date, mark active)
    - UpdateTenantCommand and handler (set move-out date, mark inactive)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.8_

  - [x]* 2.3 Write property test for apartment number uniqueness
    - **Property 1: Apartment Number Uniqueness**
    - **Validates: Requirements 1.1**

  - [x]* 2.4 Write property test for ownership share invariant
    - **Property 2: Ownership Share Invariant**
    - **Validates: Requirements 1.8**

  - [x]* 2.5 Write property test for vacancy status consistency
    - **Property 3: Vacancy Status Consistency**
    - **Validates: Requirements 1.9**

  - [x] 2.6 Implement apartment queries
    - GetApartmentQuery and handler (get by ID with owners and tenants)
    - ListApartmentsQuery and handler (pagination, filter by vacancy)
    - GetApartmentOwnersQuery and handler
    - GetApartmentTenantsQuery and handler
    - _Requirements: 1.6, 1.7_

  - [x] 2.7 Create apartments controller
    - POST /apartments (create)
    - GET /apartments/:id (get details)
    - PATCH /apartments/:id (update)
    - DELETE /apartments/:id (delete)
    - GET /apartments/building/:buildingId (list)
    - POST /apartments/:id/owners (assign owner)
    - DELETE /apartments/:id/owners/:ownerId (remove owner)
    - POST /apartments/:id/tenants (assign tenant)
    - PATCH /apartments/:id/tenants/:tenantId (update tenant)
    - Add authorization guards (committee member only)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 9.1_

  - [x]* 2.8 Write unit tests for apartment module
    - Test command handlers with specific examples
    - Test query handlers with mock data
    - Test controller endpoints with authorization
    - _Requirements: 1.1-1.9_

- [x] 3. Checkpoint - Apartments Module Complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Payments Module
  - [x] 4.1 Create module structure and DTOs
    - Create payments.module.ts with CQRS imports
    - Create DTOs for payment operations (CreatePaymentDto)
    - Add validation decorators to DTOs
    - _Requirements: 3.1, 3.2, 3.7_

  - [x] 4.2 Implement payment commands
    - CreatePaymentCommand and handler (validate amount, create payment)
    - MarkPaymentPaidCommand and handler (update status, update building balance)
    - _Requirements: 3.1, 3.2_

  - [x] 4.3 Implement payment queries
    - GetPaymentQuery and handler (get by ID with apartment details)
    - ListPaymentsQuery and handler (pagination, filter by status, apartment, building)
    - GetPaymentSummaryQuery and handler (calculate totals by status)
    - _Requirements: 3.5, 3.6_

  - [x] 4.4 Create payments controller
    - POST /payments (create)
    - PATCH /payments/:id/mark-paid (mark as paid)
    - GET /payments/:id (get details)
    - GET /payments (list with filters)
    - GET /payments/building/:buildingId/summary (get summary)
    - _Requirements: 3.1, 3.2, 3.5, 3.6_

- [x] 5. Checkpoint - Payments Module Complete

