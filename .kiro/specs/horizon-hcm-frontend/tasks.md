# Implementation Plan: Horizon-HCM Frontend Applications

## Overview

This implementation plan breaks down the Horizon-HCM frontend applications (web and mobile) into discrete, implementable tasks. The plan follows a bottom-up approach: shared package first, then web application, then mobile application. Each task builds incrementally on previous work, with property-based tests integrated throughout to validate correctness properties from the design document.

The implementation uses TypeScript for all code, React 18 for web, React Native with Expo for mobile, and a shared package for common code. The backend API is already complete and running on http://localhost:3001.

## Tasks

- [x] 1. Project Setup and Monorepo Configuration
  - Initialize monorepo with Turborepo or npm workspaces
  - Create three packages: web, mobile, shared
  - Configure TypeScript with strict mode for all packages
  - Set up ESLint and Prettier with shared configuration
  - Configure Husky for pre-commit hooks
  - Create .env.example files for each package
  - Document environment variables in README
  - _Requirements: 43.1, 43.2, 43.3, 43.4, 43.5, 43.6, 68.8, 76.1_

- [x] 2. Shared Package - Core Infrastructure
  - [x] 2.1 Create TypeScript types and interfaces
    - Define all data model interfaces (User, Building, Apartment, Invoice, etc.)
    - Define API request and response types
    - Define enum types (UserRole, InvoiceStatus, etc.)
    - Export all types from shared package index
    - _Requirements: 43.11, 77.6, 79.7_

  - [x] 2.2 Create Zod validation schemas
    - Define schemas for all forms (login, register, invoice, etc.)
    - Define schemas matching backend validation rules
    - Export schemas from shared package
    - _Requirements: 39.11, 80.2_

  - [x] 2.3 Implement Axios API client
    - Create Axios instance with base URL configuration
    - Implement request interceptor for authentication tokens
    - Implement response interceptor for error handling and token refresh
    - Implement automatic retry logic with exponential backoff
    - _Requirements: 40.1, 40.2, 40.3, 40.4, 40.5, 40.6, 77.1, 77.2, 77.3, 77.4, 77.8_

  - [ ]* 2.4 Write property test for API client
    - **Property 3: Token Refresh Round Trip**
    - **Validates: Requirements 1.8, 40.6**
    - Test that expired tokens are automatically refreshed and requests retried

  - [x] 2.5 Create API service modules
    - Implement authApi (login, register, logout, 2FA, password reset)
    - Implement buildingsApi (CRUD operations)
    - Implement apartmentsApi (CRUD operations, bulk import)
    - Implement residentsApi (CRUD operations)
    - Implement invoicesApi (CRUD operations, bulk create)
    - Implement paymentsApi (CRUD operations, receipt download)
    - Implement reportsApi (balance, income/expense, budget, YoY, exports)
    - Implement announcementsApi (CRUD operations)
    - Implement messagesApi (fetch, send)
    - Implement pollsApi (CRUD operations, voting)
    - Implement maintenanceApi (CRUD operations, status updates)
    - Implement meetingsApi (CRUD operations, RSVP, minutes)
    - Implement documentsApi (CRUD operations, upload, download)
    - Implement notificationsApi (fetch, mark as read)
    - Implement usersApi (profile, preferences)
    - _Requirements: 77.5, 77.6_

  - [x] 2.6 Create utility functions
    - Implement date formatting utilities using date-fns
    - Implement currency formatting utilities
    - Implement file size formatting utilities
    - Implement validation helper functions
    - Implement error handling utilities
    - Implement storage utilities (localStorage, sessionStorage)
    - _Requirements: 28.9, 76.11_

  - [x] 2.7 Create application constants
    - Define API endpoints
    - Define validation rules (password strength, file size limits)
    - Define pagination defaults
    - Define date formats
    - Define supported file types
    - _Requirements: 76.11_

- [x] 3. Checkpoint - Shared package complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Web Application - Project Setup
  - [x] 4.1 Initialize React + Vite project
    - Create Vite project with React and TypeScript template
    - Configure Vite for development and production
    - Install Material-UI v5 and dependencies
    - Install React Router v6
    - Install Zustand, React Query, Axios
    - Install React Hook Form, Zod
    - Install Socket.io-client
    - Install next-intl for i18n
    - Install Recharts for data visualization
    - Install date-fns for date utilities
    - _Requirements: 43.1, 47.1_

  - [x] 4.2 Configure Material-UI theme
    - Create custom theme with brand colors
    - Configure typography and spacing
    - Configure breakpoints for responsive design
    - Implement light and dark theme variants
    - _Requirements: 47.3, 47.4, 47.9_

  - [x] 4.3 Configure React Router
    - Set up route structure (auth, protected, admin routes)
    - Implement ProtectedRoute component with authentication check
    - Configure route-based code splitting
    - _Requirements: 53.13, 53.14, 30.2_

  - [x] 4.4 Configure React Query
    - Create QueryClient with appropriate cache settings
    - Define query keys factory for all entities
    - Configure stale times and retry logic
    - _Requirements: 30.4, 40.10, 40.11, 78.2_

  - [x] 4.5 Create Zustand stores
    - Implement auth store (user, tokens, login, logout)
    - Implement app store (selectedBuilding, language, theme, sidebar)
    - Implement notification store (notifications, unread count)
    - Implement WebSocket store (connection, emit, on)
    - Configure localStorage persistence for auth and app stores
    - _Requirements: 41.1, 41.3, 41.4, 41.6, 78.1, 78.8_

  - [ ]* 4.6 Write property tests for stores
    - **Property 4: Session Data Clearing**
    - **Validates: Requirements 1.9, 41.7**
    - Test that logout clears all session data from all stores

- [ ] 5. Web Application - Authentication Flow
  - [x] 5.1 Implement LoginPage and LoginForm component
    - Create login form with email and password fields
    - Implement form validation using React Hook Form + Zod
    - Implement "Remember Me" checkbox
    - Implement "Forgot Password" link
    - Handle login submission and token storage
    - Display error messages from API
    - Redirect to dashboard on success
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

  - [ ]* 5.2 Write property tests for authentication
    - **Property 1: Authentication Token Storage**
    - **Validates: Requirements 1.3**
    - Test that tokens are stored securely in httpOnly cookies
    - **Property 2: Error Message Display**
    - **Validates: Requirements 1.4, 33.2**
    - Test that API errors are parsed and displayed correctly
    - **Property 5: Protected Route Access Control**
    - **Validates: Requirements 1.10, 5.7**
    - Test that protected routes redirect to login without valid token

  - [ ] 5.3 Implement RegisterPage and RegisterForm component
    - Create registration form with email, password, name, phone
    - Implement password strength validation
    - Implement email format validation
    - Display terms of service and require acceptance
    - Handle registration submission
    - Display field-specific validation errors
    - Redirect to login on success
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

  - [ ]* 5.4 Write property tests for registration
    - **Property 6: Password Strength Validation**
    - **Validates: Requirements 2.2, 4.6**
    - Test password validation rules (8 chars, uppercase, lowercase, number)
    - **Property 7: Email Format Validation**
    - **Validates: Requirements 2.3, 27.3, 39.2**
    - Test email format validation (@ and domain required)
    - **Property 8: Field-Specific Validation Errors**
    - **Validates: Requirements 2.6**
    - Test that validation errors display next to corresponding fields

  - [ ] 5.5 Implement TwoFactorSetup and TwoFactorVerify components
    - Display QR code from backend
    - Display manual entry code
    - Implement 6-digit code input with validation
    - Display backup codes after setup
    - Handle 2FA verification during login
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

  - [ ]* 5.6 Write property test for 2FA
    - **Property 9: Two-Factor Code Validation**
    - **Validates: Requirements 3.4**
    - Test that only valid 6-digit numeric codes are accepted

  - [ ] 5.7 Implement ForgotPasswordPage and ResetPasswordPage
    - Create password reset request form
    - Validate reset token from URL
    - Create new password form with strength validation
    - Handle password reset submission
    - Display success and error messages
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_

  - [x] 5.8 Implement automatic token refresh logic
    - Detect 401 responses in Axios interceptor
    - Attempt token refresh using refresh token
    - Retry original request with new token
    - Redirect to login if refresh fails
    - _Requirements: 1.8, 40.6, 40.7_

  - [x] 5.9 Implement logout functionality
    - Clear all Zustand stores
    - Clear tokens from storage
    - Disconnect WebSocket
    - Redirect to login page
    - _Requirements: 1.9, 41.7_

- [ ] 6. Checkpoint - Authentication complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Web Application - Layout and Navigation
  - [x] 7.1 Implement DashboardLayout component
    - Create responsive layout with sidebar and header
    - Implement navigation sidebar with role-based menu items
    - Implement header with building selector, notifications, user menu
    - Implement mobile hamburger menu
    - Handle sidebar collapse/expand
    - _Requirements: 5.6, 5.8, 53.1, 53.2, 53.3, 53.4_

  - [x] 7.2 Implement building selector component
    - Display current building name
    - Provide dropdown with all user's buildings
    - Implement building search for many buildings
    - Persist selected building in store
    - Reload data when building changes
    - _Requirements: 6.10, 60.1, 60.2, 60.3, 60.4, 60.6, 60.8_

  - [x] 7.3 Implement NotificationBell and NotificationPanel
    - Display bell icon with unread count badge
    - Fetch notifications from API
    - Display notification list with type, message, timestamp
    - Mark notifications as read on click
    - Navigate to related content
    - Provide "Mark all as read" action
    - _Requirements: 26.1, 26.2, 26.3, 26.4, 26.5, 26.11_

  - [x] 7.4 Implement WebSocket client integration
    - Connect to WebSocket on login
    - Handle connection, disconnection, errors
    - Listen for real-time events (notifications, messages, announcements)
    - Update React Query cache on WebSocket events
    - Queue messages when disconnected
    - _Requirements: 17.2, 26.6, 40.12_

  - [x] 7.5 Implement language selector and i18n
    - Configure next-intl with English and Hebrew
    - Create translation files for all UI text
    - Implement language selector in settings
    - Switch to RTL layout for Hebrew
    - Persist language preference
    - _Requirements: 28.1, 28.2, 28.3, 28.4, 28.5, 28.6, 28.7, 28.8, 28.9, 66.1, 66.2, 66.6_

  - [x] 7.6 Implement theme toggle (light/dark mode)
    - Create theme toggle button
    - Switch between light and dark themes
    - Persist theme preference
    - _Requirements: 47.9, 47.10, 47.11_

- [ ] 8. Web Application - Dashboard Pages
  - [ ] 8.1 Implement CommitteeDashboard component
    - Display quick stats (pending invoices, maintenance requests, meetings)
    - Display recent activity feed
    - Provide quick action buttons
    - _Requirements: 5.1_

  - [ ] 8.2 Implement OwnerDashboard component
    - Display payment status and upcoming invoices
    - Display active polls
    - Display recent announcements
    - Display building financial summary
    - _Requirements: 5.2_

  - [ ] 8.3 Implement TenantDashboard component
    - Display payment obligations
    - Display announcements
    - Display maintenance requests
    - _Requirements: 5.3_

  - [ ] 8.4 Implement AdminDashboard component
    - Display platform statistics
    - Display system health metrics
    - Provide user management access
    - _Requirements: 5.4, 38.1_

  - [ ] 8.5 Implement role-based dashboard routing
    - Fetch user role from API
    - Route to appropriate dashboard based on role
    - Implement role switcher for multi-role users
    - _Requirements: 5.5, 5.7, 5.8, 5.9, 5.10_

- [ ] 9. Web Application - Building and Apartment Management
  - [ ] 9.1 Implement BuildingList and BuildingForm components
    - Display building list with search and filter
    - Implement building creation form
    - Implement building edit form
    - Validate required fields
    - Handle CRUD operations via API
    - Display building stats (apartment count, resident count)
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

  - [ ]* 9.2 Write property test for search
    - **Property 10: Search Result Filtering**
    - **Validates: Requirements 6.9, 35.2**
    - Test that search returns only matching items

  - [ ] 9.3 Implement ApartmentList and ApartmentForm components
    - Display apartment list for selected building
    - Implement apartment creation form
    - Implement apartment edit form
    - Validate unit number uniqueness
    - Display occupancy status
    - Implement bulk CSV import
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 7.10_

  - [ ]* 9.4 Write property test for apartment validation
    - **Property 11: Apartment Unit Number Uniqueness**
    - **Validates: Requirements 7.4**
    - Test that duplicate unit numbers are rejected within a building

  - [ ] 9.5 Implement ResidentList and ResidentForm components
    - Display resident list with search and filter
    - Implement resident creation form with role selection
    - Validate single owner per apartment
    - Allow multiple tenants per apartment
    - Handle resident CRUD operations
    - Display move-in/move-out dates
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_

  - [ ]* 9.6 Write property tests for resident management
    - **Property 12: Single Owner Per Apartment Invariant**
    - **Validates: Requirements 8.3**
    - Test that apartments can have at most one owner
    - **Property 13: Multiple Tenants Per Apartment**
    - **Validates: Requirements 8.4**
    - Test that apartments can have multiple tenants

- [ ] 10. Checkpoint - Building management complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Web Application - Financial Management
  - [ ] 11.1 Implement InvoiceList and InvoiceForm components
    - Display invoice list with status filters
    - Implement invoice creation form
    - Validate amount (positive) and due date (future)
    - Allow recipient selection (individual or all apartments)
    - Support document attachments
    - Implement bulk invoice creation
    - Handle invoice edit and cancellation
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10_

  - [ ]* 11.2 Write property test for invoice validation
    - **Property 14: Invoice Amount and Date Validation**
    - **Validates: Requirements 9.3**
    - Test that only positive amounts and future due dates are accepted

  - [ ] 11.3 Implement InvoiceCard and InvoiceDetailPage
    - Display invoice details with status indicators
    - Show payment button for residents
    - Show edit/cancel buttons for committee members
    - Display attached documents
    - _Requirements: 9.6, 9.7, 9.8_

  - [ ] 11.4 Implement PaymentForm component
    - Create payment form with card details
    - Validate card number using Luhn algorithm
    - Validate expiry date (future)
    - Validate CVV format (3-4 digits)
    - Never store card details in frontend
    - Display processing indicator
    - Handle payment success and failure
    - _Requirements: 10.3, 10.4, 10.5, 10.6, 58.2, 58.3, 58.4, 58.5, 58.6, 58.7, 58.8, 58.9_

  - [ ] 11.5 Implement PaymentHistory component
    - Display payment list with transaction IDs
    - Provide receipt download as PDF
    - Show payment confirmation details
    - _Requirements: 10.7, 10.8_

  - [ ] 11.6 Implement payment dashboard for residents
    - Display all invoices with status indicators
    - Show overdue warnings
    - Display payment history
    - _Requirements: 10.1, 10.2, 10.10_

- [ ] 12. Web Application - Financial Reports
  - [ ] 12.1 Implement BalanceReport component
    - Fetch balance data from API
    - Display total income, expenses, current balance
    - Render balance trend chart using Recharts
    - Allow date range filtering
    - Display category breakdown
    - Provide export to PDF and Excel
    - Show comparison to previous period
    - Display warning for negative balance
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10_

  - [ ] 12.2 Implement IncomeExpenseReport component
    - Display income and expense sections with totals
    - Show category breakdown with pie charts
    - Display trend line charts
    - Allow filtering by date range and category
    - Provide month-over-month comparison
    - Show top expense categories
    - Provide export to PDF and Excel
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.8, 12.9, 12.10_

  - [ ] 12.3 Implement BudgetComparisonReport component
    - Display budgeted vs actual amounts
    - Show variance with color coding (red/green)
    - Display percentage of budget used
    - Render comparison charts
    - Show alerts for categories exceeding budget by >10%
    - Provide export to PDF and Excel
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 13.10_

  - [ ] 12.4 Implement YearOverYearReport component
    - Display current and previous year data side by side
    - Calculate percentage change between years
    - Render year-over-year trend charts
    - Allow selecting specific years for comparison
    - Display monthly breakdown
    - Highlight significant changes (>20% variance)
    - Provide export to PDF and Excel
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8, 14.9, 14.10_

  - [ ] 12.5 Implement chart components using Recharts
    - Create reusable line chart component
    - Create reusable pie chart component
    - Create reusable bar chart component
    - Implement interactive tooltips
    - Make charts responsive
    - Use consistent color scheme
    - _Requirements: 48.1, 48.2, 48.3, 48.4, 48.5, 48.6, 48.7_

- [ ] 13. Checkpoint - Financial features complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Web Application - Communication Features
  - [ ] 14.1 Implement AnnouncementList and AnnouncementForm components
    - Create announcement creation form with rich text editor
    - Support target audience selection
    - Provide priority level selection
    - Allow scheduling for future publication
    - Display announcement list in reverse chronological order
    - Mark unread announcements
    - Filter by priority
    - Display read statistics for committee members
    - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.8, 15.9, 15.10_

  - [ ] 14.2 Implement AnnouncementCard and detail view
    - Display announcement with title, content, author, date
    - Show read confirmation button when required
    - Handle confirmation submission
    - Mark as read when opened
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.9_

  - [ ] 14.3 Implement ChatInterface component
    - Establish WebSocket connection for real-time messaging
    - Display message list with sender, timestamp, avatar
    - Implement MessageInput with character limit (2000)
    - Support image attachments with preview
    - Display typing indicators
    - Show online/offline status
    - Implement infinite scroll pagination
    - Support emoji picker and reactions
    - Queue messages when offline
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.7, 17.8, 17.9, 17.10, 17.11, 17.12, 17.13_

  - [ ]* 14.4 Write property tests for chat
    - **Property 15: Message Length Validation**
    - **Validates: Requirements 17.6**
    - Test that messages up to 2000 chars are accepted, longer rejected
    - **Property 16: Real-Time Message Transmission**
    - **Validates: Requirements 17.3, 17.4**
    - Test that messages are transmitted via WebSocket and displayed immediately

- [ ] 15. Web Application - Voting Features
  - [ ] 15.1 Implement PollList and PollForm components
    - Create poll creation form with question and options
    - Validate minimum 2 options
    - Allow single/multiple choice selection
    - Set poll duration with start/end dates
    - Configure voting rules (role restrictions, anonymity)
    - Display poll list with status filters
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8, 18.9, 18.10_

  - [ ]* 15.2 Write property test for poll validation
    - **Property 17: Poll Option Minimum Validation**
    - **Validates: Requirements 18.7**
    - Test that polls require at least 2 options

  - [ ] 15.3 Implement PollCard and voting interface
    - Display poll question, options, deadline
    - Allow user to select option(s) based on poll type
    - Prevent double voting
    - Allow vote change before poll closes
    - Display real-time vote counts and percentages
    - Show final results when closed
    - Display individual votes if public
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8, 19.9, 19.10, 19.11, 19.12_

  - [ ]* 15.4 Write property test for voting
    - **Property 18: Single Vote Per Poll Enforcement**
    - **Validates: Requirements 19.5**
    - Test that users can vote only once per poll (though can change vote)

- [ ] 16. Checkpoint - Communication and voting complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Web Application - Maintenance Requests
  - [ ] 17.1 Implement MaintenanceRequestList and MaintenanceRequestForm
    - Create maintenance request form with title, description, category, priority
    - Allow photo uploads (up to 5 images)
    - Validate required fields
    - Generate tracking number on submission
    - Display request list with status filters
    - Filter by status, category, priority, date
    - Show different views for residents vs committee
    - _Requirements: 20.1, 20.2, 20.3, 20.4, 20.5, 20.6, 20.7, 20.8, 20.9, 20.10, 21.1, 21.2_

  - [ ]* 17.2 Write property test for photo upload limit
    - **Property 19: Maintenance Photo Upload Limit**
    - **Validates: Requirements 20.2**
    - Test that up to 5 photos are allowed, more are rejected

  - [ ] 17.3 Implement MaintenanceRequestCard and detail view
    - Display request details with photo gallery
    - Show status history timeline
    - Allow committee members to update status
    - Allow adding comments (visible to requester)
    - Allow adding internal notes (committee only)
    - Display resolution time statistics
    - Show alert for urgent requests
    - _Requirements: 21.3, 21.4, 21.5, 21.6, 21.7, 21.8, 21.9, 21.10, 21.11_

- [ ] 18. Web Application - Meetings
  - [ ] 18.1 Implement MeetingList and MeetingForm components
    - Create meeting creation form with title, date, time, location, agenda
    - Validate future date
    - Allow attendee selection
    - Support agenda document attachment
    - Display meeting list with upcoming and past meetings
    - Provide calendar view option
    - _Requirements: 22.1, 22.2, 22.3, 22.4, 22.5, 22.6, 22.7, 22.8, 22.9, 22.10_

  - [ ] 18.2 Implement MeetingCard and RSVP interface
    - Display meeting details (date, time, location, agenda)
    - Provide RSVP buttons (attending, not attending, maybe)
    - Allow RSVP change before meeting date
    - Display attendee count and list
    - Show user's RSVP status
    - Allow downloading agenda as PDF
    - Display cancellation notice if cancelled
    - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 23.6, 23.7, 23.8, 23.9, 23.10_

  - [ ] 18.3 Implement MeetingMinutesEditor component
    - Provide rich text editor for minutes
    - Allow attaching minutes to completed meetings
    - Support document attachments
    - Display minutes on meeting detail page
    - Allow editing after publication
    - Show publication date and author
    - Provide search across all minutes
    - _Requirements: 24.1, 24.2, 24.3, 24.4, 24.5, 24.7, 24.8, 24.9_

  - [ ] 18.4 Implement calendar integration
    - Provide "Add to Calendar" button
    - Generate iCalendar (.ics) file
    - Include meeting details in calendar event
    - Support Google, Outlook, Apple Calendar
    - _Requirements: 57.1, 57.2, 57.3, 57.4, 57.5, 57.6, 57.7_

- [ ] 19. Web Application - Document Management
  - [ ] 19.1 Implement DocumentLibrary and DocumentUploadForm
    - Display document library organized by categories
    - Create upload form with drag-and-drop
    - Validate file size (10MB limit)
    - Validate file type (PDF, DOC, DOCX, XLS, XLSX, JPG, PNG)
    - Display upload progress
    - Show preview for images
    - Support multiple file selection
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5, 49.1, 49.2, 49.3, 49.4, 49.5, 49.6_

  - [ ]* 19.2 Write property test for document validation
    - **Property 20: Document File Size Validation**
    - **Validates: Requirements 25.3**
    - Test that files up to 10MB are accepted, larger rejected

  - [ ] 19.3 Implement DocumentCard and document viewer
    - Display document icon based on type
    - Show metadata (size, date, uploader)
    - Provide download action
    - Provide delete action with confirmation
    - Display version history
    - Enforce role-based access control
    - _Requirements: 25.6, 25.7, 25.8, 25.9, 25.10, 25.11, 25.12_

- [ ] 20. Checkpoint - Maintenance, meetings, documents complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 21. Web Application - User Profile and Settings
  - [ ] 21.1 Implement ProfileView and ProfileEditForm
    - Display user information (name, email, phone, avatar)
    - Show role and apartment associations
    - Create profile edit form
    - Validate email and phone formats
    - Allow avatar upload (2MB limit) with preview
    - Handle profile update submission
    - _Requirements: 27.1, 27.2, 27.3, 27.4, 27.5, 27.6, 27.7_

  - [ ] 21.2 Implement PasswordChangeForm
    - Require current password
    - Validate new password strength
    - Confirm password match
    - Handle password change submission
    - _Requirements: 27.8, 27.9_

  - [ ] 21.3 Implement NotificationPreferences component
    - Allow enabling/disabling notification types
    - Configure email notifications
    - Set push notification preferences
    - Persist preferences via API
    - _Requirements: 26.8, 26.9, 26.10, 27.11_

  - [ ] 21.4 Implement language and theme preferences
    - Allow updating language preference
    - Allow updating theme preference
    - Persist preferences via API
    - _Requirements: 27.12, 28.4_

- [ ] 22. Web Application - Search and Global Features
  - [ ] 22.1 Implement global search component
    - Create search input in navigation bar
    - Search across residents, apartments, announcements, documents
    - Display results grouped by content type
    - Highlight search terms in results
    - Provide autocomplete suggestions
    - Debounce search input (300ms)
    - Display "no results" message
    - Allow filtering by content type
    - Show recent searches
    - _Requirements: 35.1, 35.2, 35.3, 35.4, 35.5, 35.6, 35.7, 35.8, 35.9, 35.10_

  - [ ] 22.2 Implement data export functionality
    - Provide export to Excel for financial reports
    - Provide export to PDF for invoices and receipts
    - Provide export to CSV for resident lists and payment history
    - Display progress indicator during export
    - Auto-download generated files
    - Include export date and building name in filename
    - _Requirements: 36.1, 36.2, 36.3, 36.4, 36.5, 36.6, 36.7, 36.8, 36.9, 36.10_

  - [ ] 22.3 Implement bulk operations
    - Provide checkbox selection for list items
    - Provide "Select All" option
    - Display count of selected items
    - Implement bulk invoice creation
    - Implement bulk notification sending
    - Implement bulk document deletion
    - Display progress and summary
    - _Requirements: 37.1, 37.2, 37.3, 37.4, 37.5, 37.6, 37.7, 37.8, 37.9, 37.10_

  - [ ] 22.4 Implement keyboard shortcuts
    - Global search (Ctrl/Cmd + K)
    - Navigation menu toggle (Ctrl/Cmd + B)
    - Create invoice (Ctrl/Cmd + I)
    - Create announcement (Ctrl/Cmd + A)
    - Logout (Ctrl/Cmd + L)
    - Help modal (Ctrl/Cmd + /)
    - Escape to close modals
    - Tab for form navigation
    - Enter to submit forms
    - _Requirements: 70.1, 70.2, 70.3, 70.4, 70.5, 70.6, 70.7, 70.8, 70.9, 70.10_

- [ ] 23. Web Application - Admin Features
  - [ ] 23.1 Implement admin dashboard
    - Display platform statistics
    - Show system health metrics
    - Provide user management access
    - _Requirements: 38.1, 38.7_

  - [ ] 23.2 Implement user management interface
    - Display all users with search and filter
    - Allow viewing all buildings and users
    - Allow deactivating user accounts
    - Allow resetting user passwords
    - Display audit log for security events
    - _Requirements: 38.2, 38.3, 38.4, 38.5, 38.9_

  - [ ] 23.3 Implement system configuration interface
    - Provide system settings management
    - Allow managing feature flags
    - Allow sending platform-wide announcements
    - _Requirements: 38.6, 38.8, 38.10, 72.4_

- [ ] 24. Checkpoint - Core web features complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 25. Web Application - Shared UI Components
  - [ ] 25.1 Implement DataTable component
    - Display tabular data with sorting
    - Implement pagination or infinite scroll
    - Support row selection for bulk operations
    - Provide responsive mobile view
    - _Requirements: 62.2, 62.3_

  - [ ] 25.2 Implement form components
    - Create reusable FormField wrapper
    - Create DateRangePicker with presets
    - Create FileUploader with drag-and-drop
    - Implement form validation display
    - _Requirements: 39.1, 39.6, 39.7, 39.8, 80.3, 80.6_

  - [ ] 25.3 Implement feedback components
    - Create LoadingSpinner component
    - Create ErrorBoundary component
    - Create ConfirmDialog component
    - Create EmptyState component
    - Create Toast notification system
    - _Requirements: 33.5, 33.6, 33.12_

  - [ ] 25.4 Implement OfflineIndicator component
    - Detect online/offline status
    - Display offline banner
    - Handle offline state gracefully
    - _Requirements: 34.2, 34.3, 34.8_

- [ ] 26. Web Application - Performance and Optimization
  - [ ] 26.1 Implement code splitting and lazy loading
    - Configure route-based code splitting
    - Implement lazy loading for below-the-fold images
    - Implement virtual scrolling for long lists
    - _Requirements: 30.2, 30.3, 30.7, 62.4_

  - [ ] 26.2 Implement caching and prefetching
    - Configure React Query cache times
    - Implement prefetching for likely navigation
    - Cache static assets with long expiration
    - _Requirements: 30.4, 30.5, 62.7_

  - [ ] 26.3 Implement optimistic updates
    - Use optimistic updates for user actions
    - Rollback on error
    - Provide immediate feedback
    - _Requirements: 30.9, 41.8, 41.9, 78.8, 78.9_

  - [ ] 26.4 Implement debouncing and throttling
    - Debounce search inputs (300ms)
    - Debounce form validation (200ms)
    - Throttle scroll events (100ms)
    - Throttle resize events (200ms)
    - _Requirements: 30.8, 62.5, 62.6, 69.1, 69.2, 69.3, 69.4_

  - [ ] 26.5 Optimize bundle size
    - Implement tree shaking
    - Optimize images (WebP format)
    - Minimize bundle to under 500KB initial load
    - _Requirements: 30.6, 62.10, 75.2_

- [ ] 27. Web Application - Accessibility and Responsive Design
  - [ ] 27.1 Implement accessibility features
    - Use semantic HTML elements
    - Provide ARIA labels for interactive elements
    - Ensure keyboard accessibility
    - Provide visible focus indicators
    - Maintain color contrast ratios (4.5:1 for normal, 3:1 for large text)
    - Provide alt text for images
    - Ensure form inputs have labels
    - Support screen reader navigation
    - _Requirements: 31.1, 31.2, 31.3, 31.4, 31.5, 31.6, 31.7, 31.9, 31.11_

  - [ ] 27.2 Implement responsive design
    - Test layouts on desktop (1920x1080+)
    - Test layouts on tablet (768x1024 to 1366x1024)
    - Test layouts on mobile (375x667 to 414x896)
    - Use responsive breakpoints
    - Provide mobile-optimized navigation
    - Ensure touch targets are 44x44px minimum
    - Optimize images for different screen sizes
    - _Requirements: 29.1, 29.2, 29.3, 29.4, 29.5, 29.6, 29.7, 29.9_

- [ ] 28. Web Application - Security and Error Handling
  - [ ] 28.1 Implement security measures
    - Store tokens in httpOnly cookies only
    - Never store sensitive data in localStorage
    - Sanitize all user input to prevent XSS
    - Validate all data client-side
    - Implement CSRF token validation
    - Use HTTPS in production
    - Implement Content Security Policy
    - Clear sensitive data on logout
    - Mask sensitive information in forms
    - Implement session timeout (30 minutes)
    - _Requirements: 32.1, 32.2, 32.3, 32.4, 32.5, 32.6, 32.7, 32.8, 32.10, 32.11, 71.1_

  - [ ] 28.2 Implement comprehensive error handling
    - Display user-friendly error messages
    - Parse and display API errors
    - Display connectivity errors
    - Provide retry mechanism
    - Display loading indicators
    - Display success messages
    - Log errors in development
    - Send error reports in production
    - Suggest corrective actions
    - _Requirements: 33.1, 33.2, 33.3, 33.4, 33.7, 33.9, 33.10, 33.11_

- [ ] 29. Web Application - PWA and Offline Support
  - [ ] 29.1 Implement Progressive Web App features
    - Create web app manifest file
    - Register service worker
    - Provide app icons for different sizes
    - Support "Add to Home Screen"
    - Display splash screen
    - Cache content for offline access
    - _Requirements: 67.1, 67.2, 67.3, 67.4, 67.5, 67.6, 67.15_

  - [ ] 29.2 Implement offline support
    - Cache recently viewed data
    - Display cached data with offline indicator
    - Prevent form submission when offline
    - Display offline message
    - Sync changes when connection restored
    - Queue failed requests for retry
    - _Requirements: 34.1, 34.2, 34.3, 34.4, 34.5, 34.9, 67.13_

  - [ ] 29.3 Implement draft saving
    - Auto-save form drafts every 30 seconds
    - Restore drafts when returning to form
    - Warn before navigating away from unsaved form
    - Provide "Save Draft" and "Discard Draft" buttons
    - Clear drafts after successful submission
    - _Requirements: 65.1, 65.2, 65.3, 65.4, 65.5, 65.6, 65.7, 65.8_

- [ ] 30. Web Application - Additional Features
  - [ ] 30.1 Implement session management
    - Implement session timeout warning (2 minutes before expiry)
    - Provide "Extend Session" option
    - Clear session data on timeout
    - Detect user activity to reset timeout
    - _Requirements: 71.2, 71.3, 71.4, 71.6_

  - [ ] 30.2 Implement cross-tab communication
    - Use BroadcastChannel API for cross-tab sync
    - Sync logout across all tabs
    - Sync profile updates across tabs
    - Sync building selection across tabs
    - Sync notifications across tabs
    - _Requirements: 74.1, 74.2, 74.3, 74.4, 74.5, 74.6_

  - [ ] 30.3 Implement feature flags
    - Fetch feature flags from API on login
    - Hide disabled features
    - Check flags before rendering components
    - Cache flags in session
    - _Requirements: 72.1, 72.2, 72.3, 72.8_

  - [ ] 30.4 Implement onboarding and help
    - Create welcome tour for first-time users
    - Highlight key features
    - Allow skipping tour
    - Provide contextual help tooltips
    - Provide help icon linking to documentation
    - _Requirements: 54.1, 54.2, 54.3, 54.4, 54.5_

- [ ] 31. Checkpoint - Web application complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 32. Remaining Property-Based Tests for Web Application
  - [ ]* 32.1 Write property tests for correctness properties 21-45
    - **Property 21: Announcement Read Confirmation Requirement**
    - **Validates: Requirements 15.4, 16.5**
    - Test that announcements requiring confirmation display confirmation button
    
    - **Property 22: Poll Voting Deadline Enforcement**
    - **Validates: Requirements 19.2, 19.10**
    - Test that voting is prevented after poll closes
    
    - **Property 23: Meeting Date Future Validation**
    - **Validates: Requirements 22.2**
    - Test that only future dates are accepted for meeting creation
    
    - **Property 24: RSVP Change Before Meeting**
    - **Validates: Requirements 23.6**
    - Test that RSVP can be changed before meeting date
    
    - **Property 25: Document Access Control**
    - **Validates: Requirements 25.12**
    - Test that role-based access control is enforced for documents
    
    - **Property 26: Notification Mark as Read**
    - **Validates: Requirements 26.4**
    - Test that clicking notification marks it as read
    
    - **Property 27: Profile Email Validation**
    - **Validates: Requirements 27.3**
    - Test that profile email updates validate format
    
    - **Property 28: Language Preference Persistence**
    - **Validates: Requirements 28.4, 28.5**
    - Test that language preference persists across sessions
    
    - **Property 29: RTL Layout for Hebrew**
    - **Validates: Requirements 28.6**
    - Test that Hebrew language triggers RTL layout
    
    - **Property 30: Responsive Breakpoints**
    - **Validates: Requirements 29.4**
    - Test that layout adjusts at defined breakpoints
    
    - **Property 31: Touch Target Size**
    - **Validates: Requirements 29.6**
    - Test that touch targets are minimum 44x44 pixels on mobile
    
    - **Property 32: Code Splitting**
    - **Validates: Requirements 30.2**
    - Test that routes are lazy loaded
    
    - **Property 33: Cache Invalidation**
    - **Validates: Requirements 30.4**
    - Test that React Query cache respects stale times

    - **Property 34: Keyboard Accessibility**
    - **Validates: Requirements 31.3**
    - Test that all functionality is keyboard accessible
    
    - **Property 35: Color Contrast Ratio**
    - **Validates: Requirements 31.5, 31.6**
    - Test that color contrast meets WCAG requirements
    
    - **Property 36: Token Storage Security**
    - **Validates: Requirements 32.1**
    - Test that tokens are stored only in httpOnly cookies
    
    - **Property 37: XSS Prevention**
    - **Validates: Requirements 32.3**
    - Test that user input is sanitized
    
    - **Property 38: Session Timeout**
    - **Validates: Requirements 32.11, 71.1**
    - Test that session expires after 30 minutes of inactivity
    
    - **Property 39: Offline Data Display**
    - **Validates: Requirements 34.2**
    - Test that cached data is displayed when offline
    
    - **Property 40: Search Debouncing**
    - **Validates: Requirements 35.6, 69.1**
    - Test that search input is debounced to reduce API calls
    
    - **Property 41: Export Filename Format**
    - **Validates: Requirements 36.9**
    - Test that exported files include date and building name
    
    - **Property 42: Bulk Operation Progress**
    - **Validates: Requirements 37.8, 37.9**
    - Test that bulk operations display progress and summary
    
    - **Property 43: Form Validation Display**
    - **Validates: Requirements 39.6, 39.7, 39.8**
    - Test that validation errors display inline with red borders
    
    - **Property 44: Request Retry Logic**
    - **Validates: Requirements 40.4, 40.5**
    - Test that failed requests retry up to 3 times with exponential backoff
    
    - **Property 45: Optimistic Update Rollback**
    - **Validates: Requirements 41.9**
    - Test that optimistic updates rollback on error

- [ ] 33. Checkpoint - All web property tests complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 34. Mobile Application - Project Setup
  - [ ] 34.1 Initialize React Native + Expo project
    - Create Expo project with TypeScript template
    - Configure Expo for iOS and Android
    - Install React Native Paper and dependencies
    - Install React Navigation v6
    - Install Zustand, React Query, Axios (reuse from shared)
    - Install React Hook Form, Zod (reuse from shared)
    - Install Socket.io-client (reuse from shared)
    - Install Expo Notifications
    - Install Expo Camera
    - Install Expo LocalAuthentication
    - Install React Native Vector Icons
    - _Requirements: 43.2, 47.2, 29.1.1, 29.1.2_

  - [ ] 34.2 Configure React Native Paper theme
    - Create custom theme with brand colors
    - Configure typography and spacing
    - Implement light and dark theme variants
    - _Requirements: 47.3, 47.4, 47.9_

  - [ ] 34.3 Configure React Navigation
    - Set up navigation structure (auth, main, tab, stack)
    - Implement protected navigation with authentication check
    - Configure deep linking for notifications
    - _Requirements: 53.5, 53.6, 67.12_

  - [ ] 34.4 Reuse Zustand stores and React Query from shared package
    - Import and configure stores from shared package
    - Import and configure React Query client from shared package
    - Configure AsyncStorage persistence for mobile
    - _Requirements: 41.1, 41.2, 78.1, 78.2_

- [ ] 35. Mobile Application - Authentication Screens
  - [ ] 35.1 Implement LoginScreen
    - Create login form with email and password
    - Implement form validation
    - Handle login submission
    - Support biometric authentication (Face ID, Touch ID, fingerprint)
    - Redirect to main navigation on success
    - _Requirements: 1.1, 1.2, 1.3, 1.7, 67.9_

  - [ ] 35.2 Implement RegisterScreen
    - Create registration form
    - Implement validation
    - Handle registration submission
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 35.3 Implement TwoFactorScreens
    - Implement 2FA setup screen
    - Implement 2FA verification screen
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ] 35.4 Implement PasswordResetScreens
    - Implement forgot password screen
    - Implement reset password screen
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7_

- [ ] 36. Mobile Application - Main Navigation and Dashboard
  - [ ] 36.1 Implement bottom tab navigation
    - Create tab navigator with Dashboard, Payments, Communication, More tabs
    - Implement tab icons and labels
    - Highlight active tab
    - _Requirements: 53.5, 53.7_

  - [ ] 36.2 Implement DashboardScreen
    - Display role-appropriate dashboard content
    - Show quick stats and recent activity
    - Provide quick action buttons
    - Implement pull-to-refresh
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 29.1.10_

  - [ ] 36.3 Implement building selector for mobile
    - Display current building in header
    - Provide building selector modal
    - Persist selected building
    - _Requirements: 60.1, 60.2, 60.4_

  - [ ] 36.4 Implement notification system for mobile
    - Display notification bell with badge
    - Implement notification list screen
    - Handle push notifications via Expo Notifications
    - Request notification permission
    - Handle notification taps with deep linking
    - _Requirements: 26.1, 26.2, 26.3, 26.4, 67.8, 67.14_

- [ ] 37. Mobile Application - Core Feature Screens
  - [ ] 37.1 Implement BuildingListScreen and BuildingFormScreen
    - Display building list
    - Implement building creation and editing
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 37.2 Implement ApartmentListScreen and ApartmentFormScreen
    - Display apartment list
    - Implement apartment creation and editing
    - _Requirements: 7.1, 7.2, 7.3_

  - [ ] 37.3 Implement ResidentListScreen and ResidentFormScreen
    - Display resident list
    - Implement resident creation and editing
    - _Requirements: 8.1, 8.2, 8.5, 8.6_

- [ ] 38. Mobile Application - Financial Screens
  - [ ] 38.1 Implement InvoiceListScreen and InvoiceDetailScreen
    - Display invoice list with filters
    - Show invoice details
    - Implement payment flow
    - _Requirements: 9.5, 9.6, 10.1, 10.2_

  - [ ] 38.2 Implement PaymentScreen
    - Create payment form
    - Validate card details
    - Handle payment submission
    - _Requirements: 10.3, 10.4, 10.5, 58.2, 58.3_

  - [ ] 38.3 Implement PaymentHistoryScreen
    - Display payment history
    - Allow downloading receipts
    - _Requirements: 10.7, 10.8_

  - [ ] 38.4 Implement FinancialReportsScreen
    - Display balance report
    - Display income/expense report
    - Display budget comparison
    - Display year-over-year report
    - Render charts using React Native chart library
    - _Requirements: 11.1, 11.2, 12.1, 12.2, 13.1, 13.2, 14.1, 14.2_

- [ ] 39. Mobile Application - Communication Screens
  - [ ] 39.1 Implement AnnouncementListScreen and AnnouncementDetailScreen
    - Display announcement list
    - Show announcement details
    - Handle read confirmation
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

  - [ ] 39.2 Implement ChatScreen
    - Display message list
    - Implement message input
    - Support image attachments via Expo Camera
    - Handle real-time messaging via WebSocket
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 67.10_

  - [ ] 39.3 Implement PollListScreen and PollDetailScreen
    - Display poll list
    - Show poll details
    - Implement voting interface
    - Display results
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.9_

- [ ] 40. Mobile Application - Additional Feature Screens
  - [ ] 40.1 Implement MaintenanceRequestListScreen and MaintenanceRequestFormScreen
    - Display maintenance request list
    - Create maintenance request form
    - Support photo uploads via Expo Camera
    - _Requirements: 20.1, 20.2, 20.6, 20.7, 67.10_

  - [ ] 40.2 Implement MeetingListScreen and MeetingDetailScreen
    - Display meeting list
    - Show meeting details
    - Implement RSVP interface
    - _Requirements: 22.6, 23.1, 23.2, 23.3_

  - [ ] 40.3 Implement DocumentLibraryScreen
    - Display document library
    - Support document upload via native file picker
    - Allow document download
    - _Requirements: 25.1, 25.6, 25.7, 67.11_

  - [ ] 40.4 Implement ProfileScreen and SettingsScreen
    - Display user profile
    - Allow profile editing
    - Implement settings (language, theme, notifications)
    - _Requirements: 27.1, 27.2, 27.11, 27.12_

- [ ] 41. Mobile Application - Native Features
  - [ ] 41.1 Implement biometric authentication
    - Use Expo LocalAuthentication for Face ID, Touch ID, fingerprint
    - Store biometric preference
    - Fallback to password if biometric fails
    - _Requirements: 67.9_

  - [ ] 41.2 Implement push notifications
    - Configure Expo Notifications
    - Request notification permission
    - Handle notification registration
    - Handle notification taps with deep linking
    - Display notifications in-app
    - _Requirements: 67.8, 67.12, 67.14_

  - [ ] 41.3 Implement camera access
    - Use Expo Camera for photo capture
    - Support image selection from gallery
    - Compress images before upload
    - _Requirements: 67.10_

  - [ ] 41.4 Implement native file picker
    - Use Expo DocumentPicker for file selection
    - Support multiple file types
    - Validate file size and type
    - _Requirements: 67.11_

  - [ ] 41.5 Implement app lifecycle handling
    - Handle app backgrounding
    - Handle app foregrounding
    - Persist app state
    - Reconnect WebSocket on foreground
    - _Requirements: 29.1.12, 29.1.13_

- [ ] 42. Mobile Application - Platform-Specific Features
  - [ ] 42.1 Implement iOS-specific features
    - Follow iOS Human Interface Guidelines
    - Support iOS 13.0 and above
    - Test on iPhone and iPad
    - Support split-screen multitasking on iPad
    - _Requirements: 29.1.3, 29.1.5, 29.1.1, 29.1.14_

  - [ ] 42.2 Implement Android-specific features
    - Follow Material Design guidelines
    - Support Android 6.0 (API 23) and above
    - Test on phones and tablets
    - Support split-screen multitasking
    - _Requirements: 29.1.4, 29.1.6, 29.1.2, 29.1.14_

  - [ ] 42.3 Implement responsive mobile layouts
    - Support device orientation changes
    - Optimize for different screen sizes and densities
    - Implement native gestures (swipe, pinch-to-zoom)
    - _Requirements: 29.1.7, 29.1.8, 29.1.11_

- [ ] 43. Checkpoint - Mobile application complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 44. Testing and Quality Assurance
  - [ ] 44.1 Write unit tests for shared package
    - Test utility functions
    - Test validation schemas
    - Test API client logic
    - _Requirements: 42.1, 42.5_

  - [ ] 44.2 Write component tests for web application
    - Test critical components using Testing Library
    - Test form validation
    - Test user interactions
    - _Requirements: 42.2, 42.5_

  - [ ] 44.3 Write integration tests
    - Test critical user flows (login, create invoice, make payment)
    - Test API integration with mocked responses
    - Test error handling scenarios
    - _Requirements: 42.3, 42.6, 42.7_

  - [ ] 44.4 Write accessibility tests
    - Test with axe-core
    - Verify keyboard navigation
    - Verify screen reader compatibility
    - _Requirements: 42.8_

  - [ ]* 44.5 Run all property-based tests
    - Execute all 45 property tests
    - Verify all properties pass
    - Fix any failing properties

  - [ ] 44.6 Achieve code coverage targets
    - Achieve minimum 80% coverage for business logic
    - Generate coverage reports
    - _Requirements: 42.4_

  - [ ] 44.7 Test browser compatibility
    - Test on Chrome 90+
    - Test on Firefox 88+
    - Test on Safari 14+
    - Test on Edge 90+
    - Test on mobile browsers (iOS Safari, Android Chrome)
    - _Requirements: 61.1, 61.2, 61.3, 61.4, 61.7, 61.9_

  - [ ] 44.8 Test mobile application on devices
    - Test on iOS devices (iPhone, iPad)
    - Test on Android devices (phones, tablets)
    - Test with Expo Go for rapid testing
    - _Requirements: 43.8, 29.1.1, 29.1.2_

- [ ] 45. Checkpoint - Testing complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 46. Documentation
  - [ ] 46.1 Write README files
    - Create root README with monorepo setup instructions
    - Create web package README
    - Create mobile package README
    - Create shared package README
    - Document environment variables
    - _Requirements: 46.1, 46.7_

  - [ ] 46.2 Write architecture documentation
    - Document monorepo structure
    - Document component architecture
    - Document state management patterns
    - Document API integration
    - _Requirements: 46.2, 46.3_

  - [ ] 46.3 Create component documentation with Storybook
    - Set up Storybook for web application
    - Document all reusable components
    - Provide usage examples
    - _Requirements: 46.4_

  - [ ] 46.4 Write deployment documentation
    - Document web deployment process (Vercel/Netlify)
    - Document mobile deployment process (EAS Build, App Store, Google Play)
    - Document environment configuration
    - _Requirements: 46.8_

  - [ ] 46.5 Write troubleshooting guide
    - Document common issues and solutions
    - Document debugging techniques
    - _Requirements: 46.9_

- [ ] 47. Build and Deployment Configuration
  - [ ] 47.1 Configure web application build
    - Configure Vite production build
    - Enable code splitting and optimizations
    - Optimize images (WebP, AVIF)
    - Generate source maps
    - _Requirements: 44.1, 44.2, 44.3, 44.4_

  - [ ] 47.2 Configure web deployment
    - Set up deployment to Vercel or Netlify
    - Configure environment variables
    - Set up automatic deployment on main branch
    - Configure preview deployments for PRs
    - _Requirements: 44.5, 44.9, 44.10, 44.12_

  - [ ] 47.3 Configure mobile application build
    - Configure EAS Build for iOS and Android
    - Set up build profiles (development, preview, production)
    - Configure app signing
    - _Requirements: 44.6, 44.7_

  - [ ] 47.4 Configure mobile deployment
    - Set up App Store Connect for iOS
    - Set up Google Play Console for Android
    - Configure app metadata and screenshots
    - _Requirements: 44.8_

  - [ ] 47.5 Set up CI/CD pipeline
    - Configure GitHub Actions or similar
    - Run tests before deployment
    - Run linting and type checking
    - _Requirements: 42.10, 44.11_

- [ ] 48. Monitoring and Analytics
  - [ ] 48.1 Integrate error tracking
    - Set up Sentry or similar service
    - Configure error reporting for JavaScript errors
    - Configure error reporting for API errors
    - Include user context in error reports
    - _Requirements: 45.1, 45.2, 45.3, 45.4_

  - [ ] 48.2 Integrate analytics
    - Set up Google Analytics or similar
    - Track page views and navigation
    - Track user actions
    - Track performance metrics
    - Respect user privacy and GDPR
    - Allow opt-out
    - _Requirements: 45.5, 45.6, 45.7, 45.8, 45.9, 45.10_

- [ ] 49. Final Integration and Polish
  - [ ] 49.1 Perform end-to-end testing
    - Test complete user flows across web and mobile
    - Verify all features work with backend API
    - Test real-time features (WebSocket)
    - Test offline functionality

  - [ ] 49.2 Optimize performance
    - Run Lighthouse audits
    - Achieve performance score above 90
    - Optimize bundle sizes
    - Optimize image loading
    - _Requirements: 30.1, 30.10_

  - [ ] 49.3 Verify accessibility compliance
    - Run accessibility audits
    - Fix any accessibility issues
    - Test with screen readers
    - _Requirements: 31.1-31.12_

  - [ ] 49.4 Verify security implementation
    - Review security measures
    - Test authentication flows
    - Test authorization checks
    - Verify sensitive data handling
    - _Requirements: 32.1-32.12_

  - [ ] 49.5 Polish UI and UX
    - Review all screens for consistency
    - Verify theme implementation
    - Test responsive layouts
    - Verify translations
    - Test error messages
    - Verify loading states

  - [ ] 49.6 Create demo data and user guide
    - Prepare demo data for testing
    - Create user guide for key features
    - Record demo videos if needed

- [ ] 50. Final Checkpoint - Complete implementation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout implementation
- Property tests validate universal correctness properties from the design document
- The implementation follows a bottom-up approach: shared package → web → mobile
- All code uses TypeScript with strict mode enabled
- The backend API is already complete and running on http://localhost:3001
- Real-time features use WebSocket (Socket.io) for live updates
- The monorepo structure allows code sharing between web and mobile applications
- Testing is integrated throughout the implementation, not as a separate phase
- Documentation is created alongside implementation for better accuracy
