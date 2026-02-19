# Design Document: Core House Committee Management Features

## Overview

This design document specifies the implementation of core business features for Horizon-HCM, a residential building management platform. The system follows CQRS + Clean Architecture patterns with NestJS, using separate command and query handlers for write and read operations. All features integrate with existing infrastructure including notifications, file storage, real-time updates, audit logging, and analytics.

The implementation is organized into feature modules (Apartments, Payments, Maintenance, Meetings, Documents, Announcements, Reports) that follow consistent patterns for API endpoints, data validation, authorization, and error handling.

## Architecture

### Module Structure

Each feature module follows this structure:

```
src/{feature}/
├── {feature}.module.ts          # Module definition with CQRS
├── {feature}.controller.ts      # REST API endpoints
├── commands/
│   ├── impl/                    # Command classes
│   └── handlers/                # Command handlers
├── queries/
│   ├── impl/                    # Query classes
│   └── handlers/                # Query handlers
├── dto/                         # Data Transfer Objects
└── entities/                    # Domain entities (if needed)
```

### CQRS Pattern

- **Commands**: Write operations (create, update, delete) that modify state
- **Queries**: Read operations that retrieve data without side effects
- **Handlers**: Execute commands/queries with business logic
- **Events**: Domain events emitted after state changes (for notifications, audit logs)

### Integration Points


- **NotificationService**: Send notifications for events (payment due, maintenance updates, meetings)
- **StorageService**: Upload and manage files (photos, documents)
- **AuditLogService**: Log all sensitive operations
- **AnalyticsService**: Track feature usage and events
- **CacheService**: Cache frequently accessed data
- **RealtimeGateway**: Broadcast real-time updates via WebSocket
- **TranslationService**: Internationalization support

## Components and Interfaces

### 1. Apartments Module

#### API Endpoints

**POST /apartments**
- Create a new apartment in a building
- Body: `{ buildingId, apartmentNumber, areaSqm?, floor? }`
- Authorization: Committee member of the building
- Returns: Created apartment

**GET /apartments/:id**
- Get apartment details with owners and tenants
- Authorization: Committee member, owner, or tenant of the apartment
- Returns: Apartment with owners and tenants

**PATCH /apartments/:id**
- Update apartment details
- Body: `{ apartmentNumber?, areaSqm?, floor?, isVacant? }`
- Authorization: Committee member of the building
- Returns: Updated apartment

**DELETE /apartments/:id**
- Delete an apartment (soft delete if has history)
- Authorization: Committee member of the building
- Returns: Success message

**GET /buildings/:buildingId/apartments**
- List all apartments in a building
- Query params: `page, limit, isVacant`
- Authorization: Committee member, owner, or tenant of the building
- Returns: Paginated apartment list

**POST /apartments/:id/owners**
- Assign an owner to an apartment
- Body: `{ userId, ownershipShare, isPrimary }`
- Authorization: Committee member of the building
- Returns: Created ownership record

**DELETE /apartments/:id/owners/:ownerId**
- Remove an owner from an apartment
- Authorization: Committee member of the building
- Returns: Success message

**POST /apartments/:id/tenants**
- Assign a tenant to an apartment
- Body: `{ userId, moveInDate }`
- Authorization: Committee member of the building
- Returns: Created tenancy record

**PATCH /apartments/:id/tenants/:tenantId**
- Update tenant details (e.g., set move-out date)
- Body: `{ moveOutDate?, isActive? }`
- Authorization: Committee member of the building
- Returns: Updated tenancy record


#### Commands

- **CreateApartmentCommand**: Create apartment with validation
- **UpdateApartmentCommand**: Update apartment details
- **DeleteApartmentCommand**: Delete apartment with dependency check
- **AssignOwnerCommand**: Assign owner with ownership share validation
- **RemoveOwnerCommand**: Remove owner
- **AssignTenantCommand**: Assign tenant with move-in date
- **UpdateTenantCommand**: Update tenant (move-out date, active status)

#### Queries

- **GetApartmentQuery**: Get apartment by ID with relations
- **ListApartmentsQuery**: List apartments with pagination and filters
- **GetApartmentOwnersQuery**: Get all owners for an apartment
- **GetApartmentTenantsQuery**: Get all tenants for an apartment

#### Business Logic

- Validate apartment number uniqueness within building
- Validate total ownership shares ≤ 100%
- Mark apartment as vacant when no owners and no active tenants
- Prevent deletion if apartment has active tenants or payment history
- Emit events for audit logging and notifications

### 2. Residents Module

#### API Endpoints

**GET /buildings/:buildingId/residents**
- List all residents (committee, owners, tenants)
- Query params: `page, limit, search, userType`
- Authorization: Committee member of the building
- Returns: Paginated resident list

**GET /residents/:id**
- Get resident profile with apartments
- Authorization: Committee member or the resident themselves
- Returns: Resident profile with associated apartments

**POST /buildings/:buildingId/committee-members**
- Add a committee member
- Body: `{ userId, role }`
- Authorization: Committee member of the building
- Returns: Created committee membership

**DELETE /buildings/:buildingId/committee-members/:memberId**
- Remove a committee member
- Authorization: Committee member of the building
- Returns: Success message

**GET /buildings/:buildingId/residents/export**
- Export resident data as CSV
- Authorization: Committee member of the building
- Returns: CSV file

#### Queries

- **ListResidentsQuery**: List all residents with filters
- **GetResidentProfileQuery**: Get resident details
- **SearchResidentsQuery**: Search residents by name, phone, apartment
- **ExportResidentsQuery**: Generate CSV export

#### Commands

- **AddCommitteeMemberCommand**: Add committee member
- **RemoveCommitteeMemberCommand**: Remove committee member


### 3. Payments Module

#### API Endpoints

**POST /payments**
- Create a payment record
- Body: `{ apartmentId, amount, dueDate, type, description?, isRecurring? }`
- Authorization: Committee member of the building
- Returns: Created payment

**PATCH /payments/:id/status**
- Update payment status (mark as paid)
- Body: `{ status, paidDate? }`
- Authorization: Committee member of the building
- Returns: Updated payment

**GET /payments/:id**
- Get payment details
- Authorization: Committee member or responsible resident
- Returns: Payment details

**GET /apartments/:apartmentId/payments**
- List payments for an apartment
- Query params: `page, limit, status, startDate, endDate`
- Authorization: Committee member or apartment resident
- Returns: Paginated payment list

**GET /buildings/:buildingId/payments**
- List all payments for a building
- Query params: `page, limit, status, startDate, endDate`
- Authorization: Committee member of the building
- Returns: Paginated payment list

**GET /buildings/:buildingId/payments/summary**
- Get payment summary (total pending, paid, overdue)
- Query params: `startDate, endDate`
- Authorization: Committee member of the building
- Returns: Payment summary statistics

#### Commands

- **CreatePaymentCommand**: Create payment with validation
- **UpdatePaymentStatusCommand**: Update status and building balance
- **CreateRecurringPaymentCommand**: Generate monthly payment records
- **MarkPaymentOverdueCommand**: Mark overdue payments (scheduled job)

#### Queries

- **GetPaymentQuery**: Get payment by ID
- **ListPaymentsQuery**: List payments with filters
- **GetPaymentSummaryQuery**: Calculate payment statistics
- **GetOverduePaymentsQuery**: Get overdue payments for notifications

#### Business Logic

- Validate amount is positive
- Update building balance when payment is marked as paid
- Automatically mark payments as overdue when due date passes
- Send reminders 7 days before due date
- Send overdue notifications
- Support recurring payments (monthly maintenance fees)
- Support one-time payments (special assessments)


### 4. Maintenance Module

#### API Endpoints

**POST /maintenance-requests**
- Submit a maintenance request
- Body: `{ buildingId, apartmentId?, category, priority, description, photoIds? }`
- Authorization: Any resident of the building
- Returns: Created maintenance request

**PATCH /maintenance-requests/:id**
- Update maintenance request (assign, update status)
- Body: `{ status?, assignedTo?, priority? }`
- Authorization: Committee member of the building
- Returns: Updated maintenance request

**GET /maintenance-requests/:id**
- Get maintenance request details with comments
- Authorization: Requester or committee member
- Returns: Maintenance request with comments

**GET /buildings/:buildingId/maintenance-requests**
- List maintenance requests for a building
- Query params: `page, limit, status, category, priority, startDate, endDate`
- Authorization: Committee member of the building
- Returns: Paginated maintenance request list

**GET /users/:userId/maintenance-requests**
- List maintenance requests submitted by a user
- Authorization: The user or committee member
- Returns: Paginated maintenance request list

**POST /maintenance-requests/:id/comments**
- Add a comment to a maintenance request
- Body: `{ content }`
- Authorization: Requester or committee member
- Returns: Created comment

**POST /maintenance-requests/:id/photos**
- Upload photos for a maintenance request
- Body: FormData with files
- Authorization: Requester or committee member
- Returns: Uploaded file IDs

#### Commands

- **CreateMaintenanceRequestCommand**: Create request with validation
- **UpdateMaintenanceRequestCommand**: Update status, assignment, priority
- **AddCommentCommand**: Add comment and notify relevant parties
- **UploadMaintenancePhotoCommand**: Upload photo via storage service

#### Queries

- **GetMaintenanceRequestQuery**: Get request by ID with comments
- **ListMaintenanceRequestsQuery**: List requests with filters
- **GetUserMaintenanceRequestsQuery**: Get requests by user

#### Business Logic

- Validate category (plumbing, electrical, general, other)
- Validate priority (low, medium, high, urgent)
- Send urgent notifications to all committee members
- Send status update notifications to requester
- Support photo uploads via file storage service
- Support comment threads with notifications
- Track request lifecycle (pending → in_progress → completed)


### 5. Meetings Module

#### API Endpoints

**POST /meetings**
- Create a meeting
- Body: `{ buildingId, title, description?, date, time, location?, attendeeIds }`
- Authorization: Committee member of the building
- Returns: Created meeting

**PATCH /meetings/:id**
- Update meeting details
- Body: `{ title?, description?, date?, time?, location? }`
- Authorization: Committee member of the building
- Returns: Updated meeting

**DELETE /meetings/:id**
- Cancel a meeting
- Authorization: Committee member of the building
- Returns: Success message

**GET /meetings/:id**
- Get meeting details with agenda and RSVPs
- Authorization: Attendee or committee member
- Returns: Meeting with agenda items and RSVPs

**GET /buildings/:buildingId/meetings**
- List meetings for a building
- Query params: `page, limit, startDate, endDate, status`
- Authorization: Committee member or resident of the building
- Returns: Paginated meeting list

**POST /meetings/:id/rsvp**
- Respond to meeting invitation
- Body: `{ status }` (attending, not_attending, maybe)
- Authorization: Invited attendee
- Returns: Updated RSVP

**POST /meetings/:id/agenda-items**
- Add agenda item
- Body: `{ title, description?, order }`
- Authorization: Committee member of the building
- Returns: Created agenda item

**POST /meetings/:id/minutes**
- Upload meeting minutes
- Body: `{ content, documentId? }`
- Authorization: Committee member of the building
- Returns: Updated meeting with minutes

**POST /meetings/:id/votes**
- Create a vote
- Body: `{ question, options[] }`
- Authorization: Committee member of the building
- Returns: Created vote

**POST /votes/:id/cast**
- Cast a vote
- Body: `{ optionId }`
- Authorization: Meeting attendee
- Returns: Recorded vote

#### Commands

- **CreateMeetingCommand**: Create meeting and send invitations
- **UpdateMeetingCommand**: Update meeting and notify attendees
- **CancelMeetingCommand**: Cancel meeting and notify attendees
- **RecordRSVPCommand**: Record RSVP response
- **AddAgendaItemCommand**: Add agenda item
- **RecordMinutesCommand**: Store meeting minutes
- **CreateVoteCommand**: Create voting item
- **CastVoteCommand**: Record vote with duplicate prevention

#### Queries

- **GetMeetingQuery**: Get meeting with agenda and RSVPs
- **ListMeetingsQuery**: List meetings with filters
- **GetMeetingAttendanceQuery**: Calculate attendance statistics
- **GetVoteResultsQuery**: Get vote results


#### Business Logic

- Send invitations when meeting is created
- Send update notifications when meeting is modified
- Track RSVP responses (attending, not_attending, maybe)
- Support agenda items with ordering
- Store meeting minutes as documents
- Support voting with duplicate prevention
- Calculate attendance statistics
- Mark meetings as completed after date passes
- Support recurring meetings (optional)

### 6. Documents Module

#### API Endpoints

**POST /documents**
- Upload a document
- Body: FormData with file + `{ buildingId, category, accessLevel, description? }`
- Authorization: Committee member of the building
- Returns: Created document record

**GET /documents/:id**
- Get document details
- Authorization: User with appropriate access level
- Returns: Document metadata

**GET /documents/:id/download**
- Download document file
- Authorization: User with appropriate access level
- Returns: File stream

**GET /buildings/:buildingId/documents**
- List documents for a building
- Query params: `page, limit, category, accessLevel, search`
- Authorization: Committee member or resident (filtered by access level)
- Returns: Paginated document list

**PATCH /documents/:id**
- Update document metadata
- Body: `{ category?, accessLevel?, description? }`
- Authorization: Committee member of the building
- Returns: Updated document

**DELETE /documents/:id**
- Delete a document
- Authorization: Committee member of the building
- Returns: Success message

**POST /documents/:id/versions**
- Upload a new version of a document
- Body: FormData with file
- Authorization: Committee member of the building
- Returns: New document record linked to previous version

#### Commands

- **UploadDocumentCommand**: Upload file and create document record
- **UpdateDocumentCommand**: Update document metadata
- **DeleteDocumentCommand**: Delete document and file
- **UploadDocumentVersionCommand**: Create new version

#### Queries

- **GetDocumentQuery**: Get document by ID
- **ListDocumentsQuery**: List documents with filters and access control
- **SearchDocumentsQuery**: Search documents by filename or description
- **GetDocumentVersionsQuery**: Get all versions of a document


#### Business Logic

- Upload files via storage service
- Validate file types and sizes
- Scan files for malware
- Support categories: contract, invoice, meeting_minutes, regulation, other
- Support access levels: committee_only, all_residents
- Filter documents by user's access level
- Support document versioning with links to previous versions
- Log document downloads in audit log
- Send notifications when documents are uploaded (if all_residents access)

### 7. Announcements Module

#### API Endpoints

**POST /announcements**
- Create an announcement
- Body: `{ buildingId, title, content, category, isUrgent? }`
- Authorization: Committee member of the building
- Returns: Created announcement

**GET /announcements/:id**
- Get announcement details with comments
- Authorization: Resident of the building
- Returns: Announcement with comments and read receipts

**GET /buildings/:buildingId/announcements**
- List announcements for a building
- Query params: `page, limit, category, isUrgent, startDate, endDate`
- Authorization: Resident of the building
- Returns: Paginated announcement list

**PATCH /announcements/:id**
- Update announcement
- Body: `{ title?, content?, category?, isUrgent? }`
- Authorization: Committee member (announcement author)
- Returns: Updated announcement

**DELETE /announcements/:id**
- Delete announcement (soft delete)
- Authorization: Committee member (announcement author)
- Returns: Success message

**POST /announcements/:id/read**
- Mark announcement as read
- Authorization: Resident of the building
- Returns: Read receipt

**POST /announcements/:id/comments**
- Add comment to announcement
- Body: `{ content }`
- Authorization: Resident of the building
- Returns: Created comment

**GET /announcements/:id/statistics**
- Get announcement statistics (read count, percentage)
- Authorization: Committee member of the building
- Returns: Statistics

#### Commands

- **CreateAnnouncementCommand**: Create announcement and send notifications
- **UpdateAnnouncementCommand**: Update announcement
- **DeleteAnnouncementCommand**: Soft delete announcement
- **MarkAnnouncementReadCommand**: Record read receipt
- **AddAnnouncementCommentCommand**: Add comment and notify author

#### Queries

- **GetAnnouncementQuery**: Get announcement with comments
- **ListAnnouncementsQuery**: List announcements with filters
- **GetAnnouncementStatisticsQuery**: Calculate read statistics


#### Business Logic

- Send notifications to all residents when announcement is created
- Send high-priority notifications for urgent announcements
- Support categories: general, maintenance, financial, event, emergency
- Track read receipts with timestamps
- Support comment threads
- Calculate read statistics (count and percentage)
- Soft delete announcements (mark as deleted, don't remove from DB)
- Notify announcement author when comments are added

### 8. Reports Module

#### API Endpoints

**GET /buildings/:buildingId/reports/balance**
- Get current building balance
- Authorization: Committee member of the building
- Returns: Current balance

**GET /buildings/:buildingId/reports/transactions**
- Get transaction report
- Query params: `startDate, endDate, type, category`
- Authorization: Committee member of the building
- Returns: List of transactions

**GET /buildings/:buildingId/reports/income**
- Get income report
- Query params: `startDate, endDate, groupBy` (month, category)
- Authorization: Committee member of the building
- Returns: Income breakdown

**GET /buildings/:buildingId/reports/expenses**
- Get expense report
- Query params: `startDate, endDate, groupBy` (month, category)
- Authorization: Committee member of the building
- Returns: Expense breakdown

**GET /buildings/:buildingId/reports/budget-comparison**
- Get budget vs actual comparison
- Query params: `startDate, endDate`
- Authorization: Committee member of the building
- Returns: Budget comparison data

**GET /buildings/:buildingId/reports/payment-status**
- Get payment status summary
- Query params: `startDate, endDate`
- Authorization: Committee member of the building
- Returns: Payment status summary (pending, paid, overdue totals)

**GET /buildings/:buildingId/reports/export**
- Export financial report
- Query params: `reportType, format` (pdf, csv), `startDate, endDate`
- Authorization: Committee member of the building
- Returns: File download

#### Queries

- **GetBalanceReportQuery**: Calculate current balance
- **GetTransactionReportQuery**: Get transactions with filters
- **GetIncomeReportQuery**: Calculate income by category/period
- **GetExpenseReportQuery**: Calculate expenses by category/period
- **GetBudgetComparisonQuery**: Compare budget vs actual
- **GetPaymentStatusQuery**: Calculate payment status summary
- **ExportFinancialReportQuery**: Generate PDF or CSV export

#### Business Logic

- Calculate building balance from all payment transactions
- Support filtering by date range, transaction type, category
- Group data by month or category
- Compare actual vs budgeted amounts
- Calculate payment status (pending, paid, overdue)
- Generate PDF reports with charts and tables
- Generate CSV exports for spreadsheet analysis
- Support year-over-year comparisons


## Data Models

### New Database Tables

The following tables need to be added to the Prisma schema:

#### Payment

```prisma
model Payment {
  id              String    @id @default(uuid())
  building_id     String
  apartment_id    String
  amount          Decimal   @db.Decimal(12, 2)
  due_date        DateTime
  paid_date       DateTime?
  status          String    // "pending", "paid", "overdue"
  type            String    // "monthly_fee", "special_assessment"
  description     String?   @db.Text
  is_recurring    Boolean   @default(false)
  created_by      String
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  building Building @relation(fields: [building_id], references: [id], onDelete: Cascade)
  apartment Apartment @relation(fields: [apartment_id], references: [id], onDelete: Cascade)

  @@index([building_id, status])
  @@index([apartment_id, status])
  @@index([due_date])
  @@index([status])
  @@map("payments")
}
```

#### MaintenanceRequest

```prisma
model MaintenanceRequest {
  id              String    @id @default(uuid())
  building_id     String
  apartment_id    String?
  requester_id    String
  category        String    // "plumbing", "electrical", "general", "other"
  priority        String    // "low", "medium", "high", "urgent"
  status          String    // "pending", "in_progress", "completed"
  description     String    @db.Text
  assigned_to     String?
  completed_at    DateTime?
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  building Building @relation(fields: [building_id], references: [id], onDelete: Cascade)
  apartment Apartment? @relation(fields: [apartment_id], references: [id], onDelete: SetNull)
  comments MaintenanceComment[]
  photos MaintenancePhoto[]

  @@index([building_id, status])
  @@index([requester_id])
  @@index([status])
  @@index([priority])
  @@map("maintenance_requests")
}
```

#### MaintenanceComment

```prisma
model MaintenanceComment {
  id          String    @id @default(uuid())
  request_id  String
  user_id     String
  content     String    @db.Text
  created_at  DateTime  @default(now())

  request MaintenanceRequest @relation(fields: [request_id], references: [id], onDelete: Cascade)

  @@index([request_id, created_at])
  @@map("maintenance_comments")
}
```

#### MaintenancePhoto

```prisma
model MaintenancePhoto {
  id          String    @id @default(uuid())
  request_id  String
  file_id     String
  created_at  DateTime  @default(now())

  request MaintenanceRequest @relation(fields: [request_id], references: [id], onDelete: Cascade)
  file File @relation(fields: [file_id], references: [id], onDelete: Cascade)

  @@index([request_id])
  @@map("maintenance_photos")
}
```


#### Meeting

```prisma
model Meeting {
  id              String    @id @default(uuid())
  building_id     String
  title           String
  description     String?   @db.Text
  date            DateTime
  time            String
  location        String?
  status          String    @default("scheduled") // "scheduled", "completed", "cancelled"
  minutes_content String?   @db.Text
  minutes_doc_id  String?
  created_by      String
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  building Building @relation(fields: [building_id], references: [id], onDelete: Cascade)
  agenda_items MeetingAgendaItem[]
  rsvps MeetingRSVP[]
  votes MeetingVote[]

  @@index([building_id, date])
  @@index([status])
  @@map("meetings")
}
```

#### MeetingAgendaItem

```prisma
model MeetingAgendaItem {
  id          String    @id @default(uuid())
  meeting_id  String
  title       String
  description String?   @db.Text
  order       Int
  created_at  DateTime  @default(now())

  meeting Meeting @relation(fields: [meeting_id], references: [id], onDelete: Cascade)

  @@index([meeting_id, order])
  @@map("meeting_agenda_items")
}
```

#### MeetingRSVP

```prisma
model MeetingRSVP {
  id          String    @id @default(uuid())
  meeting_id  String
  user_id     String
  status      String    // "attending", "not_attending", "maybe"
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt

  meeting Meeting @relation(fields: [meeting_id], references: [id], onDelete: Cascade)

  @@unique([meeting_id, user_id])
  @@index([meeting_id])
  @@map("meeting_rsvps")
}
```

#### MeetingVote

```prisma
model MeetingVote {
  id          String    @id @default(uuid())
  meeting_id  String
  question    String    @db.Text
  options     Json      // Array of options: [{id, text, votes}]
  created_at  DateTime  @default(now())

  meeting Meeting @relation(fields: [meeting_id], references: [id], onDelete: Cascade)
  votes VoteCast[]

  @@index([meeting_id])
  @@map("meeting_votes")
}
```

#### VoteCast

```prisma
model VoteCast {
  id          String    @id @default(uuid())
  vote_id     String
  user_id     String
  option_id   String
  created_at  DateTime  @default(now())

  vote MeetingVote @relation(fields: [vote_id], references: [id], onDelete: Cascade)

  @@unique([vote_id, user_id])
  @@index([vote_id])
  @@map("votes_cast")
}
```


#### Document

```prisma
model Document {
  id              String    @id @default(uuid())
  building_id     String
  file_id         String
  category        String    // "contract", "invoice", "meeting_minutes", "regulation", "other"
  access_level    String    // "committee_only", "all_residents"
  description     String?   @db.Text
  previous_version_id String?
  uploaded_by     String
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  building Building @relation(fields: [building_id], references: [id], onDelete: Cascade)
  file File @relation(fields: [file_id], references: [id], onDelete: Cascade)
  previous_version Document? @relation("DocumentVersions", fields: [previous_version_id], references: [id])
  next_versions Document[] @relation("DocumentVersions")

  @@index([building_id, category])
  @@index([access_level])
  @@map("documents")
}
```

#### Announcement

```prisma
model Announcement {
  id              String    @id @default(uuid())
  building_id     String
  title           String
  content         String    @db.Text
  category        String    // "general", "maintenance", "financial", "event", "emergency"
  is_urgent       Boolean   @default(false)
  is_deleted      Boolean   @default(false)
  created_by      String
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt

  building Building @relation(fields: [building_id], references: [id], onDelete: Cascade)
  read_receipts AnnouncementReadReceipt[]
  comments AnnouncementComment[]

  @@index([building_id, created_at])
  @@index([category])
  @@index([is_urgent])
  @@map("announcements")
}
```

#### AnnouncementReadReceipt

```prisma
model AnnouncementReadReceipt {
  id              String    @id @default(uuid())
  announcement_id String
  user_id         String
  read_at         DateTime  @default(now())

  announcement Announcement @relation(fields: [announcement_id], references: [id], onDelete: Cascade)

  @@unique([announcement_id, user_id])
  @@index([announcement_id])
  @@map("announcement_read_receipts")
}
```

#### AnnouncementComment

```prisma
model AnnouncementComment {
  id              String    @id @default(uuid())
  announcement_id String
  user_id         String
  content         String    @db.Text
  created_at      DateTime  @default(now())

  announcement Announcement @relation(fields: [announcement_id], references: [id], onDelete: Cascade)

  @@index([announcement_id, created_at])
  @@map("announcement_comments")
}
```

### Schema Updates

The existing `Building` model needs to be updated to include relations:

```prisma
model Building {
  // ... existing fields ...
  payments Payment[]
  maintenance_requests MaintenanceRequest[]
  meetings Meeting[]
  documents Document[]
  announcements Announcement[]
}
```

The existing `Apartment` model needs to be updated:

```prisma
model Apartment {
  // ... existing fields ...
  payments Payment[]
  maintenance_requests MaintenanceRequest[]
}
```

The existing `File` model needs to be updated:

```prisma
model File {
  // ... existing fields ...
  documents Document[]
  maintenance_photos MaintenancePhoto[]
}
```


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated:

1. **Validation Properties**: Many requirements validate similar patterns (enum validation, format validation). These can be combined into comprehensive validation properties.

2. **Audit Logging Properties**: Multiple requirements specify audit logging for different operations. These can be combined into a single property about audit logging for all sensitive operations.

3. **Notification Properties**: Many requirements trigger notifications. These can be consolidated into properties about notification triggering for specific event types.

4. **Access Control Properties**: Multiple requirements specify role-based access control. These can be combined into comprehensive authorization properties.

5. **CRUD Properties**: Basic create/read/update operations follow similar patterns and can be consolidated where appropriate.

### Core Properties

#### Property 1: Apartment Number Uniqueness
*For any* building and apartment number, attempting to create two apartments with the same number in the same building should result in the second creation being rejected with a validation error.
**Validates: Requirements 1.1**

#### Property 2: Ownership Share Invariant
*For any* apartment, the sum of all ownership shares assigned to that apartment should never exceed 100%.
**Validates: Requirements 1.8**

#### Property 3: Vacancy Status Consistency
*For any* apartment, if the apartment has no owners and no active tenants, then the apartment should be marked as vacant.
**Validates: Requirements 1.9**

#### Property 4: Tenant Status Transition
*For any* active tenant, when a move-out date is set, the tenant should be marked as inactive and the move-out date should be recorded.
**Validates: Requirements 1.5**

#### Property 5: Payment Amount Validation
*For any* payment creation attempt, if the amount is not a positive number with at most 2 decimal places, the creation should be rejected with a validation error.
**Validates: Requirements 3.1, 11.5**

#### Property 6: Payment Status and Balance Update
*For any* payment with status "pending", when the status is changed to "paid", the building balance should increase by the payment amount and the paid date should be recorded.
**Validates: Requirements 3.2**

#### Property 7: Maintenance Request Status Notification
*For any* maintenance request, when the status changes, a notification should be sent to the requester.
**Validates: Requirements 4.3, 10.3**

#### Property 8: Urgent Maintenance Broadcast
*For any* maintenance request created with "urgent" priority, notifications should be sent to all committee members of the building.
**Validates: Requirements 4.8**

#### Property 9: Meeting Invitation Broadcast
*For any* meeting creation, invitations should be sent to all specified attendees.
**Validates: Requirements 5.2, 10.4**

#### Property 10: Vote Duplicate Prevention
*For any* vote and user, attempting to cast two votes for the same vote should result in the second vote being rejected.
**Validates: Requirements 5.8**

#### Property 11: Document Access Control
*For any* document with access level "committee_only", when a non-committee user attempts to view the document, the request should be denied with an authorization error.
**Validates: Requirements 6.4, 9.2**

#### Property 12: Document Version Linking
*For any* document, when a new version is uploaded, the new document record should have a reference to the previous version's ID.
**Validates: Requirements 6.5**

#### Property 13: Announcement Notification Broadcast
*For any* announcement creation, notifications should be sent to all residents in the building.
**Validates: Requirements 7.2, 10.5**

#### Property 14: Announcement Read Receipt Recording
*For any* announcement and user, when the user views the announcement, a read receipt should be created with the current timestamp.
**Validates: Requirements 7.5**

#### Property 15: Announcement Soft Delete
*For any* announcement, when deleted, the announcement record should remain in the database with is_deleted set to true, and an audit log entry should be created.
**Validates: Requirements 7.9**

#### Property 16: Balance Calculation Accuracy
*For any* building, the calculated balance should equal the sum of all payments with status "paid" minus all expenses.
**Validates: Requirements 8.1**

#### Property 17: Payment Summary Aggregation
*For any* building and date range, the payment summary should correctly aggregate payments by status (pending, paid, overdue) and the sum of all status totals should equal the total of all payments in the range.
**Validates: Requirements 3.6, 8.8**

#### Property 18: Committee Authorization
*For any* committee-only operation, when a user without committee membership for the building attempts the operation, the request should be denied with an authorization error.
**Validates: Requirements 9.1, 9.4, 9.8**

#### Property 19: Cross-Building Access Prevention
*For any* user and building, when the user attempts to access data for a building they are not associated with (not a committee member, owner, or tenant), the request should be denied with an authorization error.
**Validates: Requirements 9.6**

#### Property 20: Audit Log Completeness
*For any* create, update, or delete operation performed by a committee member, an audit log entry should be created containing the user ID, action type, resource type, resource ID, IP address, and timestamp.
**Validates: Requirements 1.2, 2.5, 9.3, 12.1, 12.5**

#### Property 21: Sensitive Data Access Logging
*For any* access to financial reports or full resident data, an audit log entry should be created recording the access.
**Validates: Requirements 12.2**

#### Property 22: Document Download Logging
*For any* document download, an audit log entry should be created with the document ID and user ID.
**Validates: Requirements 6.8, 12.3**

#### Property 23: Notification Preference Respect
*For any* notification type and user, if the user has disabled that notification type in their preferences, no notification should be sent to that user for events of that type.
**Validates: Requirements 10.7**

#### Property 24: Required Field Validation
*For any* entity creation or update, if any required field is missing or has an invalid value, the operation should be rejected with a descriptive validation error.
**Validates: Requirements 11.1**

#### Property 25: Email Format Validation
*For any* email address input, if the email does not match a valid email format pattern, the operation should be rejected with a validation error.
**Validates: Requirements 11.2**

#### Property 26: Referential Integrity Protection
*For any* entity with dependent records, attempting to delete the entity should be rejected with an error indicating the dependencies.
**Validates: Requirements 11.6**

#### Property 27: Cache Invalidation on Update
*For any* cached entity, when the entity is updated or deleted, the cache entry for that entity should be invalidated.
**Validates: Requirements 13.4**

#### Property 28: Language Preference Persistence
*For any* user, when the preferred language is set, the value should be stored in the user profile and used for all subsequent notifications and content.
**Validates: Requirements 14.2, 14.3**

#### Property 29: Locale-Based Formatting
*For any* date, time, or monetary amount, when displayed to a user, the value should be formatted according to the user's locale settings.
**Validates: Requirements 14.4, 14.5**

#### Property 30: Field Filtering Support
*For any* API request with field filters specified, the response should contain only the requested fields and no additional fields.
**Validates: Requirements 15.1**

#### Property 31: ETag Conditional Request
*For any* resource with an ETag, when a request includes an If-None-Match header with a matching ETag, the response should be 304 Not Modified with no body.
**Validates: Requirements 15.4**

#### Property 32: Pagination Consistency
*For any* paginated list request, the total count of items across all pages should equal the total count returned in the pagination metadata.
**Validates: Requirements 2.6, 6.7, 13.5**

#### Property 33: Search Filter Accuracy
*For any* search query with filters, all returned results should match all specified filter criteria.
**Validates: Requirements 2.2, 4.6, 6.6, 7.8, 8.7**

#### Property 34: Transaction Atomicity
*For any* multi-step operation (e.g., payment status update with balance change), if any step fails, all changes should be rolled back and the system should return to its previous state.
**Validates: Requirements 11.8**


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

- Missing required fields
- Invalid field formats (email, phone, date)
- Invalid enum values
- Business rule violations (ownership shares > 100%)
- Invalid date ranges

Example:
```json
{
  "statusCode": 400,
  "message": ["amount must be a positive number", "dueDate must be a valid date"],
  "error": "Bad Request"
}
```

#### 2. Authorization Errors (401 Unauthorized, 403 Forbidden)

- Missing or invalid JWT token (401)
- Insufficient permissions (403)
- Cross-building access attempts (403)
- Non-committee user attempting committee-only action (403)

Example:
```json
{
  "statusCode": 403,
  "message": "You do not have permission to perform this action",
  "error": "Forbidden"
}
```

#### 3. Not Found Errors (404 Not Found)

- Entity does not exist
- Resource not found

Example:
```json
{
  "statusCode": 404,
  "message": "Apartment with ID abc-123 not found",
  "error": "Not Found"
}
```

#### 4. Conflict Errors (409 Conflict)

- Duplicate apartment number in building
- Duplicate vote from same user
- Referential integrity violations

Example:
```json
{
  "statusCode": 409,
  "message": "Apartment number 5A already exists in this building",
  "error": "Conflict"
}
```

#### 5. Server Errors (500 Internal Server Error)

- Database connection failures
- External service failures (storage, notifications)
- Unexpected exceptions

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
2. **Business Logic Validation**: Throw domain-specific exceptions in command handlers
3. **Exception Filters**: Global exception filter catches all exceptions and formats responses
4. **Logging**: All errors are logged with correlation IDs for tracing
5. **User-Friendly Messages**: Error messages are clear and actionable
6. **Internationalization**: Error messages respect user's preferred language

### Retry Logic

For transient failures (external services, database timeouts):

1. **Notifications**: Retry up to 3 times with exponential backoff
2. **File Uploads**: Support resumable uploads with chunking
3. **Database Operations**: Use Prisma's built-in retry logic
4. **Background Jobs**: BullMQ handles retries automatically


## Testing Strategy

### Dual Testing Approach

The testing strategy combines unit tests and property-based tests for comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, and error conditions
- **Property Tests**: Verify universal properties across all inputs
- Together they provide comprehensive coverage: unit tests catch concrete bugs, property tests verify general correctness

### Unit Testing

Unit tests focus on:

1. **Specific Examples**: Concrete scenarios that demonstrate correct behavior
   - Creating an apartment with valid data
   - Marking a payment as paid
   - Submitting a maintenance request

2. **Edge Cases**: Boundary conditions and special cases
   - Empty lists
   - Maximum ownership share (100%)
   - Minimum payment amount (0.01)

3. **Error Conditions**: Invalid inputs and error handling
   - Missing required fields
   - Invalid enum values
   - Authorization failures

4. **Integration Points**: Interactions between components
   - Notification service integration
   - File storage service integration
   - Audit log service integration

### Property-Based Testing

Property-based tests verify universal properties using randomized inputs:

1. **Test Configuration**:
   - Use `fast-check` library for TypeScript
   - Minimum 100 iterations per property test
   - Each test references its design document property

2. **Test Tagging Format**:
   ```typescript
   // Feature: core-hcm-features, Property 1: Apartment Number Uniqueness
   it('should reject duplicate apartment numbers in the same building', async () => {
     await fc.assert(
       fc.asyncProperty(
         buildingArbitrary(),
         apartmentNumberArbitrary(),
         async (building, apartmentNumber) => {
           // Test implementation
         }
       ),
       { numRuns: 100 }
     );
   });
   ```

3. **Property Test Coverage**:
   - Each correctness property from the design document has one property-based test
   - Properties are tested with randomized inputs (buildings, apartments, users, payments, etc.)
   - Tests verify invariants, state transitions, and business rules

### Test Organization

```
src/{feature}/
├── __tests__/
│   ├── unit/
│   │   ├── commands/
│   │   │   └── {command}.handler.spec.ts
│   │   └── queries/
│   │       └── {query}.handler.spec.ts
│   └── properties/
│       └── {feature}.properties.spec.ts
```

### Testing Infrastructure

1. **Test Database**: Use separate test database with migrations
2. **Test Fixtures**: Factory functions for creating test data
3. **Mocking**: Mock external services (notifications, storage) in unit tests
4. **Integration Tests**: Test with real database and services in CI/CD

### Coverage Goals

- **Unit Test Coverage**: Minimum 80% code coverage
- **Property Test Coverage**: All 34 correctness properties implemented
- **Integration Test Coverage**: All API endpoints tested end-to-end

### Continuous Integration

1. **Pre-commit**: Run linting and formatting
2. **Pull Request**: Run all unit tests and property tests
3. **Main Branch**: Run full test suite including integration tests
4. **Nightly**: Run extended property tests with 1000 iterations

