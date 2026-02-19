# Implementation Plan: Authentication and User Management

## Overview

This implementation plan breaks down the Authentication and User Management feature into discrete, incremental coding tasks. The approach follows a bottom-up strategy: starting with foundational services (password hashing, token generation), then building core authentication logic, followed by API endpoints, and finally guards and authorization. Each major component includes corresponding property-based tests to validate correctness properties from the design document.

The implementation uses NestJS framework with TypeScript, Prisma ORM for PostgreSQL database access, JWT for authentication tokens, and bcrypt for password hashing.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Create NestJS auth module structure
  - Install dependencies: @nestjs/jwt, @nestjs/passport, bcrypt, @fast-check/jest, nodemailer
  - Configure Prisma schema with User model and UserType enum
  - Set up environment variables for JWT secret, database URL, email configuration
  - Create base DTOs directory and validation pipe configuration
  - _Requirements: 10.1, 10.2_

- [ ] 2. Implement Password Service
  - [x] 2.1 Create PasswordService with hash and verify methods
    - Implement bcrypt hashing with configurable cost factor (default 12)
    - Implement password verification against hash
    - Implement password strength validation (minimum 8 characters)
    - _Requirements: 1.2, 1.7, 4.5, 8.1_
  
  - [ ]* 2.2 Write property test for password hashing
    - **Property 1: Password Security - Hashing**
    - **Validates: Requirements 1.2, 4.5, 8.1**
  
  - [ ]* 2.3 Write property test for password validation
    - **Property 2: Password Security - Validation**
    - **Validates: Requirements 1.7, 4.10**

- [ ] 3. Implement Token Service
  - [x] 3.1 Create TokenService for JWT and verification/reset tokens
    - Implement JWT token generation with user_id, email, user_type claims and 24-hour expiration
    - Implement JWT token verification and claim extraction
    - Implement cryptographically secure token generation (32 bytes) for verification/reset tokens
    - Implement token hashing using SHA-256 for database storage
    - Implement token expiration checking
    - _Requirements: 3.2, 3.7, 3.8, 4.1, 4.2, 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 3.2 Write property test for JWT token generation and validation
    - **Property 13: JWT Token - Signature Validation**
    - **Validates: Requirements 3.8, 6.3**
  
  - [ ]* 3.3 Write property test for JWT claims integrity
    - **Property 14: JWT Token - Claims Integrity**
    - **Validates: Requirements 6.2, 6.4**
  
  - [ ]* 3.4 Write property test for token randomness and storage
    - **Property 27: Security - Token Randomness**
    - **Validates: Requirements 8.2, 8.3, 8.5**
  
  - [ ]* 3.5 Write unit test for JWT secret strength validation
    - **Property 28: Security - JWT Secret Strength**
    - **Validates: Requirements 8.4**

- [ ] 4. Implement Email Service
  - [x] 4.1 Create EmailService with verification and reset email methods
    - Configure nodemailer with SMTP settings from environment
    - Implement sendVerificationEmail with token link
    - Implement sendPasswordResetEmail with token link
    - Add error handling for email sending failures
    - Create email templates with proper formatting
    - _Requirements: 1.4, 2.5, 4.3_
  
  - [ ]* 4.2 Write unit tests for email service
    - Test email sending with mocked nodemailer
    - Test email template rendering
    - Test error handling for failed sends
    - _Requirements: 1.4, 2.5, 4.3_

- [ ] 5. Create DTOs and validation
  - [x] 5.1 Create authentication DTOs
    - RegisterDto with validation (email format, password length, required fields)
    - LoginDto with validation
    - VerifyEmailDto with token validation
    - ForgotPasswordDto with email validation
    - ResetPasswordDto with token and password validation
    - _Requirements: 1.6, 1.7, 1.10, 4.10_
  
  - [x] 5.2 Create user profile DTOs
    - UpdateProfileDto with optional field validation
    - UserResponseDto for API responses (exclude sensitive fields)
    - _Requirements: 5.8_
  
  - [ ]* 5.3 Write property test for input validation
    - **Property 5: User Registration - Input Validation**
    - **Validates: Requirements 1.6, 1.10**
  
  - [ ]* 5.4 Write property test for profile update validation
    - **Property 23: Profile Update - Input Validation**
    - **Validates: Requirements 5.8**

- [ ] 6. Checkpoint - Ensure foundational services work
  - Run all tests for Password, Token, and Email services
  - Verify DTOs validate correctly
  - Ensure all tests pass, ask the user if questions arise

- [ ] 7. Implement User Repository
  - [x] 7.1 Create UserRepository with Prisma operations
    - Implement create user with transaction support
    - Implement find by email and find by ID
    - Implement update user with transaction support
    - Implement update verification token
    - Implement update reset token
    - Implement activate/deactivate user
    - Add proper error handling for database operations
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.6, 10.7_
  
  - [ ]* 7.2 Write property test for timestamp management
    - **Property 31: Database Operations - Timestamp Management**
    - **Validates: Requirements 10.3, 10.4**
  
  - [ ]* 7.3 Write property test for transaction atomicity
    - **Property 32: Database Operations - Transaction Atomicity**
    - **Validates: Requirements 10.6**
  
  - [ ]* 7.4 Write property test for error handling
    - **Property 33: Database Operations - Error Handling**
    - **Validates: Requirements 10.7**

- [ ] 8. Implement Auth Service - Registration
  - [x] 8.1 Create AuthService with register method
    - Validate registration data using DTOs
    - Check for duplicate email
    - Hash password using PasswordService
    - Generate verification token using TokenService
    - Create user record with is_active=true, email_verified=false
    - Send verification email using EmailService
    - Return user response (exclude sensitive data)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.8, 1.9, 6.1_
  
  - [ ]* 8.2 Write property test for complete registration flow
    - **Property 3: User Registration - Complete Flow**
    - **Validates: Requirements 1.1, 1.3, 1.4, 1.8, 1.9**
  
  - [ ]* 8.3 Write property test for duplicate prevention
    - **Property 4: User Registration - Duplicate Prevention**
    - **Validates: Requirements 1.5, 10.5**
  
  - [ ]* 8.4 Write property test for user type assignment
    - **Property 24: Role-Based Access Control - User Type Assignment**
    - **Validates: Requirements 6.1**

- [ ] 9. Implement Auth Service - Email Verification
  - [x] 9.1 Add email verification methods to AuthService
    - Implement verifyEmail method (validate token, update user, clear token)
    - Implement resendVerification method (generate new token, send email)
    - Handle already-verified users (idempotent operation)
    - Add proper error handling for invalid/expired tokens
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [ ]* 9.2 Write property test for token processing
    - **Property 6: Email Verification - Token Processing**
    - **Validates: Requirements 2.1, 2.2**
  
  - [ ]* 9.3 Write property test for idempotence
    - **Property 7: Email Verification - Idempotence**
    - **Validates: Requirements 2.6**
  
  - [ ]* 9.4 Write property test for invalid token handling
    - **Property 8: Email Verification - Invalid Token Handling**
    - **Validates: Requirements 2.3**
  
  - [ ]* 9.5 Write property test for token regeneration
    - **Property 9: Email Verification - Token Regeneration**
    - **Validates: Requirements 2.4, 2.5**

- [ ] 10. Implement Auth Service - Login
  - [x] 10.1 Add login method to AuthService
    - Validate credentials using PasswordService
    - Check email_verified status
    - Check is_active status
    - Generate JWT token using TokenService
    - Return token and user data
    - Implement proper error messages (generic for security)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  
  - [ ]* 10.2 Write property test for successful authentication
    - **Property 10: Login - Successful Authentication**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.7**
  
  - [ ]* 10.3 Write property test for invalid credentials
    - **Property 11: Login - Invalid Credentials**
    - **Validates: Requirements 3.4**
  
  - [ ]* 10.4 Write property test for account state validation
    - **Property 12: Login - Account State Validation**
    - **Validates: Requirements 3.5, 3.6, 7.1**

- [ ] 11. Implement Auth Service - Password Reset
  - [x] 11.1 Add password reset methods to AuthService
    - Implement forgotPassword method (generate token, set expiry, send email)
    - Implement resetPassword method (validate token, hash password, update user, clear token)
    - Handle non-existent emails securely (same response to prevent enumeration)
    - Check token expiration
    - Use transactions for atomic updates
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_
  
  - [ ]* 11.2 Write property test for token generation
    - **Property 15: Password Reset - Token Generation**
    - **Validates: Requirements 4.1, 4.2, 4.3**
  
  - [ ]* 11.3 Write property test for email enumeration prevention
    - **Property 16: Password Reset - Email Enumeration Prevention**
    - **Validates: Requirements 4.4, 8.8**
  
  - [ ]* 11.4 Write unit test for token expiration
    - **Property 17: Password Reset - Token Expiration**
    - **Validates: Requirements 4.9**
  
  - [ ]* 11.5 Write property test for complete reset flow
    - **Property 18: Password Reset - Complete Flow**
    - **Validates: Requirements 4.5, 4.6, 4.7**
  
  - [ ]* 11.6 Write property test for invalid token handling
    - **Property 19: Password Reset - Invalid Token Handling**
    - **Validates: Requirements 4.8**

- [ ] 12. Checkpoint - Ensure auth service works end-to-end
  - Run all auth service tests
  - Verify all authentication flows work correctly
  - Ensure all tests pass, ask the user if questions arise

- [ ] 13. Implement User Service
  - [x] 13.1 Create UserService with profile management methods
    - Implement getProfile method (fetch user by ID)
    - Implement updateProfile method (update fields, handle email changes)
    - Implement deactivateUser and activateUser methods
    - Implement findByEmail and findById helper methods
    - Add authorization checks (user can only update own profile)
    - Handle email updates (set email_verified=false, generate new token)
    - Update updated_at timestamp on all updates
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 7.1, 7.2, 7.3_
  
  - [ ]* 13.2 Write property test for field updates
    - **Property 20: Profile Update - Field Updates**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.7, 10.4**
  
  - [ ]* 13.3 Write property test for email change verification
    - **Property 21: Profile Update - Email Change Verification**
    - **Validates: Requirements 5.4, 5.5**
  
  - [ ]* 13.4 Write property test for authorization
    - **Property 22: Profile Update - Authorization**
    - **Validates: Requirements 5.6**
  
  - [ ]* 13.5 Write property test for user deactivation round trip
    - **Property 26: User Deactivation - Round Trip**
    - **Validates: Requirements 7.1, 7.2, 7.3**

- [ ] 14. Implement JWT Strategy and Auth Guard
  - [x] 14.1 Create JWT Strategy for Passport
    - Configure JWT strategy with secret and validation
    - Implement validate method to extract user from token
    - Attach user to request object
    - _Requirements: 6.3, 6.4, 6.5_
  
  - [x] 14.2 Create JwtAuthGuard
    - Extend AuthGuard('jwt') from Passport
    - Handle authentication errors (401 Unauthorized)
    - Extract and validate JWT from Authorization header
    - _Requirements: 6.5_
  
  - [ ]* 14.3 Write property test for protected endpoints
    - **Property 25: Role-Based Access Control - Protected Endpoints** (part 1: JWT validation)
    - **Validates: Requirements 6.5**

- [ ] 15. Implement Roles Guard
  - [x] 15.1 Create RolesGuard for role-based authorization
    - Create @Roles decorator to specify required roles
    - Implement canActivate to check user_type against required roles
    - Return 403 Forbidden for insufficient permissions
    - _Requirements: 6.6_
  
  - [ ]* 15.2 Write property test for role authorization
    - **Property 25: Role-Based Access Control - Protected Endpoints** (part 2: role checking)
    - **Validates: Requirements 6.6**

- [ ] 16. Implement Auth Controller
  - [x] 16.1 Create AuthController with authentication endpoints
    - POST /auth/register - call authService.register()
    - POST /auth/login - call authService.login()
    - POST /auth/verify-email - call authService.verifyEmail()
    - POST /auth/resend-verification - call authService.resendVerification()
    - POST /auth/forgot-password - call authService.forgotPassword()
    - POST /auth/reset-password - call authService.resetPassword()
    - Add proper HTTP status codes (200, 201, 400, 401, 409)
    - Add validation pipes for DTOs
    - Implement consistent error response format
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.9, 9.10_
  
  - [ ]* 16.2 Write integration tests for auth endpoints
    - Test each endpoint with valid and invalid inputs
    - Verify HTTP status codes and response formats
    - Test complete flows (register → verify → login)
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.9, 9.10_

- [ ] 17. Implement User Controller
  - [x] 17.1 Create UserController with profile endpoints
    - GET /auth/profile - call userService.getProfile() (protected with JwtAuthGuard)
    - PATCH /auth/profile - call userService.updateProfile() (protected with JwtAuthGuard)
    - Add proper HTTP status codes (200, 400, 401, 403)
    - Add validation pipes for DTOs
    - Extract user ID from JWT token in request
    - _Requirements: 9.6, 9.7, 9.9, 9.10_
  
  - [ ]* 17.2 Write integration tests for profile endpoints
    - Test profile retrieval with valid JWT
    - Test profile update with valid JWT
    - Test authorization (cannot update other users)
    - Test without JWT (401 error)
    - _Requirements: 9.6, 9.7, 9.9, 9.10_

- [ ] 18. Implement Global Exception Filter
  - [x] 18.1 Create GlobalExceptionFilter
    - Catch all unhandled exceptions
    - Transform to consistent error response format
    - Map common exceptions to appropriate HTTP status codes
    - Log errors server-side with appropriate severity
    - Prevent sensitive information leakage in error messages
    - _Requirements: 8.8, 9.10, 10.7_
  
  - [ ]* 18.2 Write unit tests for exception filter
    - Test various exception types
    - Verify error response format
    - Verify sensitive data is not exposed
    - _Requirements: 8.8, 9.10_

- [ ] 19. Implement Security Features
  - [ ] 19.1 Add input sanitization and validation
    - Configure class-validator for DTO validation
    - Add SQL injection prevention (verify Prisma parameterization)
    - Add XSS prevention (sanitize inputs, escape outputs)
    - Add rate limiting configuration (optional but recommended)
    - _Requirements: 8.6, 8.7_
  
  - [ ]* 19.2 Write property test for SQL injection prevention
    - **Property 29: Security - SQL Injection Prevention**
    - **Validates: Requirements 8.6**
  
  - [ ]* 19.3 Write property test for XSS prevention
    - **Property 30: Security - XSS Prevention**
    - **Validates: Requirements 8.7**

- [ ] 20. Wire everything together in Auth Module
  - [x] 20.1 Configure AuthModule
    - Import JwtModule with configuration
    - Import PassportModule
    - Register all services (AuthService, UserService, TokenService, PasswordService, EmailService)
    - Register all controllers (AuthController, UserController)
    - Register guards (JwtAuthGuard, RolesGuard)
    - Export services for use in other modules
    - _Requirements: All_
  
  - [ ] 20.2 Create Prisma migrations
    - Generate Prisma migration for User model
    - Apply migration to database
    - Verify schema matches design
    - _Requirements: 10.2_
  
  - [x] 20.3 Configure environment variables
    - Add JWT_SECRET (minimum 256 bits)
    - Add JWT_EXPIRATION (24h)
    - Add DATABASE_URL
    - Add EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD
    - Add FRONTEND_URL for email links
    - Add BCRYPT_COST_FACTOR (default 12)
    - _Requirements: 8.4_

- [ ] 21. Final checkpoint - End-to-end testing
  - [ ] 21.1 Run all unit tests and property tests
    - Verify all 33 correctness properties pass
    - Verify all unit tests pass
    - Check test coverage (target >80%)
    - _Requirements: All_
  
  - [ ] 21.2 Run integration tests
    - Test complete user registration flow
    - Test complete login flow
    - Test complete password reset flow
    - Test profile management flow
    - Test authorization and guards
    - _Requirements: All_
  
  - [ ] 21.3 Manual testing and verification
    - Test with Postman or similar API client
    - Verify email sending works (use mailtrap or similar for testing)
    - Verify JWT tokens work correctly
    - Verify error messages are appropriate
    - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP, but are highly recommended for production
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties across many generated inputs
- Unit tests validate specific examples, edge cases, and integration points
- The implementation follows a bottom-up approach: services → repositories → controllers → guards
- All sensitive operations (password hashing, token generation) are isolated in dedicated services for testability
- Database operations use Prisma ORM with transaction support for atomicity
- Security is built-in from the start with proper validation, sanitization, and error handling
