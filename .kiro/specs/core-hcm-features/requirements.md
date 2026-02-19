# Requirements Document: Core House Committee Management Features

## Introduction

This document specifies the core business features for Horizon-HCM, a mobile-first SaaS platform for residential building management. The system enables building committees to manage apartments, residents, payments, maintenance requests, meetings, documents, announcements, and financial reports. The platform is built on NestJS with CQRS + Clean Architecture, PostgreSQL with Prisma ORM, and integrates with existing infrastructure for notifications, file storage, real-time updates, and analytics.

## Glossary

- **System**: The Horizon-HCM platform
- **Committee_Member**: A user with committee role who manages building operations
- **Resident**: A user who is either an owner or tenant in a building
- **Owner**: A user who owns an apartment in a building
- **Tenant**: A user who rents an apartment in a building
- **Apartment**: A residential unit within a building
- **Building**: A residential building managed by the system
- **Payment**: A financial transaction for maintenance fees or special assessments
- **Maintenance_Request**: A request for building maintenance or repairs
- **Meeting**: A scheduled building committee or resident meeting
- **Document**: A file uploaded to the system (contract, invoice, minutes, regulation)
- **Announcement**: A message posted to all or specific residents
- **Financial_Report**: A report showing building finances, transactions, and budget

## Requirements

### Requirement 1: Apartment Management

**User Story:** As a committee member, I want to manage apartments within my building, so that I can maintain accurate records of all residential units and their occupants.

#### Acceptance Criteria

1. WHEN a committee member creates an apartment, THE System SHALL validate the apartment number is unique within the building and store the apartment details
2. WHEN a committee member updates apartment details, THE System SHALL update the apartment record and log the change in the audit log
3. WHEN a committee member assigns an owner to an apartment, THE System SHALL create an ownership record with ownership share and mark one owner as primary
4. WHEN a committee member assigns a tenant to an apartment, THE System SHALL create a tenancy record with move-in date and set the tenant as active
5. WHEN a committee member removes a tenant, THE System SHALL set the tenant's move-out date and mark the tenant as inactive
6. WHEN a committee member views apartment details, THE System SHALL display apartment information, all owners with ownership shares, and all active tenants
7. WHEN a committee member lists apartments, THE System SHALL return all apartments in the building with pagination and filtering by vacancy status
8. THE System SHALL validate that total ownership shares for an apartment do not exceed 100%
9. WHEN an apartment has no active tenants and no owners, THE System SHALL mark the apartment as vacant

### Requirement 2: Resident Management

**User Story:** As a committee member, I want to view and manage all residents in my building, so that I can maintain contact information and understand who lives in the building.

#### Acceptance Criteria

1. WHEN a committee member views the resident list, THE System SHALL return all committee members, owners, and active tenants for the building
2. WHEN a committee member searches residents, THE System SHALL filter by name, phone number, apartment number, or user type
3. WHEN a committee member views a resident profile, THE System SHALL display full name, contact information, user type, associated apartments, and role (if committee member)
4. WHEN a committee member adds a committee member, THE System SHALL create a committee membership record with the specified role
5. WHEN a committee member removes a committee member, THE System SHALL delete the committee membership record and log the action
6. THE System SHALL support pagination for resident lists with configurable page size
7. WHEN a committee member exports resident data, THE System SHALL generate a CSV file with all resident information

### Requirement 3: Payment Management

**User Story:** As a committee member, I want to manage maintenance fees and track payments, so that I can ensure the building has sufficient funds for operations and maintenance.

#### Acceptance Criteria

1. WHEN a committee member creates a payment record, THE System SHALL validate the amount is positive and store the payment with status "pending"
2. WHEN a committee member marks a payment as paid, THE System SHALL update the payment status to "paid", record the payment date, and update the building balance
3. WHEN a payment due date passes and status is "pending", THE System SHALL mark the payment as "overdue"
4. WHEN a payment becomes overdue, THE System SHALL send a notification to the responsible resident
5. WHEN a committee member views payment history, THE System SHALL return all payments for an apartment or resident with filtering by status and date range
6. WHEN a committee member generates a payment report, THE System SHALL calculate total pending, paid, and overdue amounts for the building or specific period
7. THE System SHALL support both monthly recurring payments and one-time special assessments
8. WHEN a committee member creates a recurring payment, THE System SHALL automatically generate payment records for each month
9. THE System SHALL send payment reminders 7 days before the due date to residents with pending payments

### Requirement 4: Maintenance Request Management

**User Story:** As a resident, I want to submit and track maintenance requests, so that building issues are addressed promptly and I can monitor progress.

#### Acceptance Criteria

1. WHEN a resident submits a maintenance request, THE System SHALL validate the request has a description and category, then create the request with status "pending"
2. WHEN a committee member assigns a maintenance request, THE System SHALL update the request with the assigned service provider and change status to "in_progress"
3. WHEN a committee member or service provider updates request status, THE System SHALL update the status and send a notification to the requester
4. WHEN a resident adds a photo to a maintenance request, THE System SHALL upload the photo using the file storage service and link it to the request
5. WHEN a user adds a comment to a maintenance request, THE System SHALL create a comment record with timestamp and send notifications to relevant parties
6. WHEN a committee member views maintenance requests, THE System SHALL return all requests with filtering by status, category, priority, and date range
7. THE System SHALL support priority levels: low, medium, high, and urgent
8. WHEN a maintenance request is created with urgent priority, THE System SHALL send immediate notifications to all committee members
9. WHEN a maintenance request is marked as completed, THE System SHALL record the completion date and send a notification to the requester

### Requirement 5: Meeting Management

**User Story:** As a committee member, I want to schedule and manage building meetings, so that residents can participate in decision-making and stay informed about building matters.

#### Acceptance Criteria

1. WHEN a committee member creates a meeting, THE System SHALL validate the meeting has a title, date, and time, then create the meeting record
2. WHEN a meeting is created, THE System SHALL send meeting invitations to all specified attendees via notifications
3. WHEN a resident responds to a meeting invitation, THE System SHALL record the RSVP status (attending, not_attending, maybe)
4. WHEN a committee member updates meeting details, THE System SHALL update the meeting record and send update notifications to all attendees
5. WHEN a committee member adds an agenda item, THE System SHALL create the agenda item and link it to the meeting
6. WHEN a committee member records meeting minutes, THE System SHALL store the minutes as a document and link it to the meeting
7. WHEN a committee member creates a vote, THE System SHALL create a voting record with options and allow attendees to cast votes
8. WHEN a resident casts a vote, THE System SHALL record the vote and prevent duplicate voting by the same user
9. WHEN a meeting date passes, THE System SHALL mark the meeting as completed and calculate attendance statistics
10. THE System SHALL support recurring meetings with configurable frequency (weekly, monthly, quarterly)

### Requirement 6: Document Management

**User Story:** As a committee member, I want to organize and share building documents, so that important files are accessible to authorized residents and properly categorized.

#### Acceptance Criteria

1. WHEN a committee member uploads a document, THE System SHALL use the file storage service to store the file and create a document record with category and access level
2. WHEN a committee member categorizes a document, THE System SHALL validate the category is one of: contract, invoice, meeting_minutes, regulation, or other
3. WHEN a committee member sets document access level, THE System SHALL validate the level is either "committee_only" or "all_residents"
4. WHEN a resident views documents, THE System SHALL return only documents they have permission to access based on their role
5. WHEN a committee member uploads a new version of a document, THE System SHALL create a new document record and link it to the previous version
6. WHEN a user searches documents, THE System SHALL filter by category, filename, upload date, and access level
7. THE System SHALL support pagination for document lists with configurable page size
8. WHEN a user downloads a document, THE System SHALL log the download action in the audit log
9. THE System SHALL validate uploaded files for malware using the file storage service scanning capability

### Requirement 7: Announcement Management

**User Story:** As a committee member, I want to post announcements to residents, so that I can communicate important information and updates about the building.

#### Acceptance Criteria

1. WHEN a committee member creates an announcement, THE System SHALL validate the announcement has a title and content, then create the announcement record
2. WHEN an announcement is created, THE System SHALL send notifications to all residents in the building
3. WHEN a committee member marks an announcement as urgent, THE System SHALL send high-priority notifications and display the announcement prominently
4. WHEN a committee member categorizes an announcement, THE System SHALL validate the category is one of: general, maintenance, financial, event, or emergency
5. WHEN a resident views an announcement, THE System SHALL record the read receipt with timestamp
6. WHEN a resident comments on an announcement, THE System SHALL create a comment record and send notifications to the announcement author
7. WHEN a committee member views announcement statistics, THE System SHALL calculate read count and percentage of residents who viewed the announcement
8. THE System SHALL support filtering announcements by category, urgency, and date range
9. WHEN a committee member deletes an announcement, THE System SHALL soft-delete the announcement and log the action

### Requirement 8: Financial Reporting

**User Story:** As a committee member, I want to generate financial reports, so that I can track building finances, monitor budget, and provide transparency to residents.

#### Acceptance Criteria

1. WHEN a committee member requests a balance report, THE System SHALL calculate the current building balance from all payment transactions
2. WHEN a committee member requests a transaction report, THE System SHALL return all income and expense transactions for the specified date range
3. WHEN a committee member requests an income report, THE System SHALL calculate total income by category (maintenance fees, special assessments, other) for the specified period
4. WHEN a committee member requests an expense report, THE System SHALL calculate total expenses by category (maintenance, utilities, services, other) for the specified period
5. WHEN a committee member requests a budget comparison report, THE System SHALL compare actual income and expenses against the budgeted amounts
6. WHEN a committee member exports a financial report, THE System SHALL generate a PDF or CSV file with the report data
7. THE System SHALL support filtering financial data by date range, transaction type, and category
8. WHEN a committee member views payment status summary, THE System SHALL calculate total pending, paid, and overdue payment amounts
9. THE System SHALL support year-over-year comparison reports showing financial trends

### Requirement 9: Authorization and Access Control

**User Story:** As a system administrator, I want to enforce role-based access control, so that users can only perform actions appropriate to their role and sensitive data is protected.

#### Acceptance Criteria

1. WHEN a user attempts to perform a committee-only action, THE System SHALL verify the user has a committee membership for the building
2. WHEN a user attempts to view building data, THE System SHALL verify the user is associated with the building as a committee member, owner, or tenant
3. WHEN a user attempts to modify data, THE System SHALL verify the user has appropriate permissions and log the action in the audit log
4. THE System SHALL allow committee members to perform all management operations (create, update, delete)
5. THE System SHALL allow residents to view data and submit requests but not modify building configuration
6. WHEN a user attempts to access another building's data, THE System SHALL deny the request and return an authorization error
7. THE System SHALL allow owners and tenants to view their own payment history and apartment details
8. THE System SHALL allow only committee members to view financial reports and all resident data

### Requirement 10: Notifications and Real-time Updates

**User Story:** As a resident, I want to receive timely notifications about important events, so that I stay informed about building matters and can respond promptly.

#### Acceptance Criteria

1. WHEN a payment becomes due, THE System SHALL send a notification to the responsible resident 7 days before the due date
2. WHEN a payment becomes overdue, THE System SHALL send a notification to the responsible resident
3. WHEN a maintenance request status changes, THE System SHALL send a notification to the requester
4. WHEN a meeting is scheduled, THE System SHALL send invitations to all attendees
5. WHEN an announcement is posted, THE System SHALL send notifications to all residents
6. WHEN a document is uploaded with "all_residents" access, THE System SHALL send notifications to all residents
7. THE System SHALL respect user notification preferences for each notification type
8. THE System SHALL use the notification service to deliver notifications via push, email, or in-app based on user preferences
9. WHEN a real-time event occurs (new comment, status update), THE System SHALL broadcast the update via WebSocket to connected clients

### Requirement 11: Data Validation and Integrity

**User Story:** As a system administrator, I want to ensure data integrity, so that the system maintains accurate and consistent information.

#### Acceptance Criteria

1. WHEN creating or updating any entity, THE System SHALL validate all required fields are present and have valid values
2. WHEN a user provides an email address, THE System SHALL validate the email format
3. WHEN a user provides a phone number, THE System SHALL validate the phone number format
4. WHEN a user provides a date, THE System SHALL validate the date is in the correct format and is a valid date
5. WHEN a user provides a monetary amount, THE System SHALL validate the amount is a positive number with at most 2 decimal places
6. THE System SHALL prevent deletion of entities that have dependent records (e.g., cannot delete apartment with active tenants)
7. WHEN a database constraint is violated, THE System SHALL return a descriptive error message
8. THE System SHALL use database transactions to ensure atomic operations for multi-step processes

### Requirement 12: Audit Logging and Compliance

**User Story:** As a system administrator, I want to maintain audit logs of all sensitive operations, so that I can track changes, investigate issues, and ensure compliance.

#### Acceptance Criteria

1. WHEN a committee member creates, updates, or deletes any entity, THE System SHALL log the action in the audit log with user ID, timestamp, and affected resource
2. WHEN a user accesses sensitive data (financial reports, resident contact information), THE System SHALL log the access in the audit log
3. WHEN a user downloads a document, THE System SHALL log the download action with document ID and user ID
4. WHEN a payment status changes, THE System SHALL log the status change with old and new values
5. THE System SHALL include IP address and user agent in audit log entries
6. THE System SHALL support querying audit logs by user, action type, resource type, and date range
7. THE System SHALL retain audit logs for at least 7 years for compliance purposes
8. WHEN a user requests their personal data (GDPR), THE System SHALL use the GDPR service to export all data associated with the user

### Requirement 13: Performance and Scalability

**User Story:** As a system administrator, I want the system to perform efficiently under load, so that users have a responsive experience even as the platform grows.

#### Acceptance Criteria

1. WHEN a user requests a list of entities, THE System SHALL return results within 500ms for lists under 1000 items
2. WHEN a user creates or updates an entity, THE System SHALL complete the operation within 1000ms
3. THE System SHALL use caching for frequently accessed data (building details, apartment lists) with appropriate TTL
4. THE System SHALL invalidate caches when underlying data changes
5. WHEN a user requests paginated data, THE System SHALL support configurable page sizes up to 100 items
6. THE System SHALL use database indexes for all frequently queried fields
7. WHEN generating reports, THE System SHALL use efficient queries with appropriate joins and aggregations
8. THE System SHALL support at least 1000 concurrent users per building without performance degradation

### Requirement 14: Internationalization and Localization

**User Story:** As a resident, I want to use the system in my preferred language, so that I can understand all content and interact with the platform comfortably.

#### Acceptance Criteria

1. THE System SHALL support Hebrew and English languages
2. WHEN a user sets their preferred language, THE System SHALL store the preference in their user profile
3. WHEN the System sends notifications, THE System SHALL use the recipient's preferred language
4. WHEN the System displays dates and times, THE System SHALL format them according to the user's locale
5. WHEN the System displays monetary amounts, THE System SHALL format them according to the user's locale (currency symbol, decimal separator)
6. THE System SHALL use the translation service for all user-facing text
7. WHEN a translation is missing, THE System SHALL fall back to English
8. THE System SHALL support right-to-left (RTL) layout for Hebrew language

### Requirement 15: Mobile Optimization

**User Story:** As a mobile user, I want the system to work efficiently on my mobile device, so that I can manage building matters on the go without excessive data usage or slow performance.

#### Acceptance Criteria

1. WHEN a mobile client requests data, THE System SHALL support field filtering to reduce payload size
2. WHEN a mobile client uploads files, THE System SHALL support chunked uploads for large files
3. THE System SHALL compress API responses using gzip or brotli
4. THE System SHALL support ETags for conditional requests to reduce bandwidth usage
5. WHEN a mobile client is offline, THE System SHALL support the sync service for offline data access
6. THE System SHALL optimize image uploads by generating thumbnails and compressed versions
7. WHEN a mobile client requests lists, THE System SHALL support cursor-based pagination for efficient scrolling
8. THE System SHALL limit API response sizes to 1MB for mobile clients
