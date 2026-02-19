# Design Document: Authentication and User Management

## Overview

The Authentication and User Management feature provides the security foundation for Horizon-HCM. It implements a JWT-based authentication system with email verification, password reset capabilities, and role-based access control. The system is built using NestJS framework with PostgreSQL database accessed through Prisma ORM.

The design follows a layered architecture with clear separation between controllers (API layer), services (business logic), and repositories (data access). Security is paramount, with bcrypt password hashing, cryptographically secure token generation, and comprehensive input validation.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        API Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Auth       │  │   User       │  │   Guards     │      │
│  │  Controller  │  │  Controller  │  │  (JWT Auth)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Service Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Auth       │  │   User       │  │   Email      │      │
│  │   Service    │  │   Service    │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Token      │  │   Password   │                        │
│  │   Service    │  │   Service    │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Data Access Layer                          │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │   Prisma     │  │   User       │                        │
│  │   Client     │  │  Repository  │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  PostgreSQL  │
                    │   Database   │
                    └──────────────┘
```

### Module Structure

The feature is organized into a NestJS module with the following structure:

- **AuthModule**: Main module that imports and configures all authentication components
- **Controllers**: Handle HTTP requests and responses
- **Services**: Implement business logic and orchestrate operations
- **Guards**: Protect routes and enforce authentication/authorization
- **DTOs**: Define data transfer objects for request/response validation
- **Entities**: Define Prisma models for database schema

## Components and Interfaces

### 1. Auth Controller

Handles authentication-related HTTP endpoints.

**Endpoints:**

```typescript
POST /auth/register
  Body: { full_name, email, password, user_type, phone_number?, national_id?, preferred_language? }
  Response: { message, user: { id, email, full_name, user_type } }

POST /auth/login
  Body: { email, password }
  Response: { access_token, user: { id, email, full_name, user_type, email_verified } }

POST /auth/verify-email
  Body: { token }
  Response: { message }

POST /auth/resend-verification
  Body: { email }
  Response: { message }

POST /auth/forgot-password
  Body: { email }
  Response: { message }

POST /auth/reset-password
  Body: { token, new_password }
  Response: { message }
```

### 2. User Controller

Handles user profile management endpoints.

**Endpoints:**

```typescript
GET /auth/profile
  Headers: { Authorization: "Bearer <jwt_token>" }
  Response: { id, full_name, email, phone_number, national_id, user_type, preferred_language, email_verified, is_active, created_at, updated_at }

PATCH /auth/profile
  Headers: { Authorization: "Bearer <jwt_token>" }
  Body: { full_name?, phone_number?, preferred_language?, email? }
  Response: { message, user: { id, email, full_name, ... } }
```

### 3. Auth Service

Core authentication business logic.

**Interface:**

```typescript
interface AuthService {
  // Registration
  register(dto: RegisterDto): Promise<UserResponse>
  
  // Login
  login(dto: LoginDto): Promise<LoginResponse>
  
  // Email verification
  verifyEmail(token: string): Promise<void>
  resendVerification(email: string): Promise<void>
  
  // Password reset
  forgotPassword(email: string): Promise<void>
  resetPassword(token: string, newPassword: string): Promise<void>
  
  // Token validation
  validateUser(email: string, password: string): Promise<User | null>
}
```

**Key Methods:**

- `register()`: Creates new user, hashes password, generates verification token, sends email
- `login()`: Validates credentials, checks email verification and active status, generates JWT
- `verifyEmail()`: Validates token, marks email as verified
- `forgotPassword()`: Generates reset token, sends reset email
- `resetPassword()`: Validates reset token, updates password

### 4. User Service

User profile and management operations.

**Interface:**

```typescript
interface UserService {
  // Profile operations
  getProfile(userId: string): Promise<User>
  updateProfile(userId: string, dto: UpdateProfileDto): Promise<User>
  
  // User management
  findByEmail(email: string): Promise<User | null>
  findById(id: string): Promise<User | null>
  deactivateUser(userId: string): Promise<void>
  activateUser(userId: string): Promise<void>
}
```

### 5. Token Service

JWT token generation and validation.

**Interface:**

```typescript
interface TokenService {
  // JWT operations
  generateAccessToken(payload: JwtPayload): string
  verifyAccessToken(token: string): JwtPayload | null
  
  // Verification token operations
  generateVerificationToken(): string
  hashToken(token: string): string
  
  // Reset token operations
  generateResetToken(): string
  isTokenExpired(expiresAt: Date): boolean
}

interface JwtPayload {
  sub: string        // user_id
  email: string
  user_type: UserType
  iat: number        // issued at
  exp: number        // expires at
}
```

**Implementation Details:**

- JWT tokens expire after 24 hours
- Verification and reset tokens are generated using `crypto.randomBytes(32)`
- Tokens stored in database are hashed using SHA-256
- JWT secret key must be at least 256 bits (32 bytes)

### 6. Password Service

Password hashing and verification.

**Interface:**

```typescript
interface PasswordService {
  hash(password: string): Promise<string>
  verify(password: string, hash: string): Promise<boolean>
  validateStrength(password: string): boolean
}
```

**Implementation Details:**

- Uses bcrypt with cost factor of 12 (configurable via environment)
- Minimum password length: 8 characters
- Password strength validation checks for minimum length

### 7. Email Service

Email sending abstraction.

**Interface:**

```typescript
interface EmailService {
  sendVerificationEmail(email: string, token: string, userName: string): Promise<void>
  sendPasswordResetEmail(email: string, token: string, userName: string): Promise<void>
}
```

**Implementation Details:**

- Uses nodemailer or similar email library
- Email templates include verification/reset links
- Links format: `${FRONTEND_URL}/verify-email?token=${token}`
- Handles email sending failures gracefully

### 8. JWT Auth Guard

Protects routes requiring authentication.

**Interface:**

```typescript
interface JwtAuthGuard {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>
}
```

**Behavior:**

- Extracts JWT from Authorization header (Bearer token)
- Validates token signature and expiration
- Attaches user payload to request object
- Returns 401 Unauthorized if token is invalid or missing

### 9. Roles Guard

Enforces role-based access control.

**Interface:**

```typescript
interface RolesGuard {
  canActivate(context: ExecutionContext): boolean | Promise<boolean>
}

// Usage with decorator
@Roles(UserType.ADMIN, UserType.COMMITTEE)
@UseGuards(JwtAuthGuard, RolesGuard)
async adminOnlyEndpoint() { }
```

## Data Models

### User Entity (Prisma Schema)

```prisma
model User {
  id                        String    @id @default(uuid())
  full_name                 String
  email                     String    @unique
  password_hash             String
  national_id               String?
  phone_number              String?
  user_type                 UserType
  preferred_language        String    @default("en")
  email_verified            Boolean   @default(false)
  email_verification_token  String?
  password_reset_token      String?
  password_reset_expires    DateTime?
  is_active                 Boolean   @default(true)
  created_at                DateTime  @default(now())
  updated_at                DateTime  @updatedAt

  @@index([email])
  @@index([email_verification_token])
  @@index([password_reset_token])
}

enum UserType {
  COMMITTEE
  OWNER
  TENANT
  ADMIN
}
```

### DTOs (Data Transfer Objects)

**RegisterDto:**
```typescript
{
  full_name: string          // required, min 2 chars
  email: string              // required, valid email format
  password: string           // required, min 8 chars
  user_type: UserType        // required, enum value
  phone_number?: string      // optional
  national_id?: string       // optional
  preferred_language?: string // optional, default "en"
}
```

**LoginDto:**
```typescript
{
  email: string              // required, valid email format
  password: string           // required
}
```

**UpdateProfileDto:**
```typescript
{
  full_name?: string         // optional, min 2 chars
  phone_number?: string      // optional
  preferred_language?: string // optional
  email?: string             // optional, triggers re-verification
}
```

**VerifyEmailDto:**
```typescript
{
  token: string              // required
}
```

**ForgotPasswordDto:**
```typescript
{
  email: string              // required, valid email format
}
```

**ResetPasswordDto:**
```typescript
{
  token: string              // required
  new_password: string       // required, min 8 chars
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

After analyzing all acceptance criteria, I've identified the following redundancies:

**Redundant Properties:**
- 5.5 is redundant with 5.4 (both test email update verification flow)
- 7.4 is redundant with 3.5 (both test deactivated user login error)
- 10.5 is redundant with 1.5 (both test unique email constraint)
- 1.8 and 1.9 can be combined into a single property about initial user state
- 3.2 and 3.3 can be combined (both test JWT token generation and return)
- 6.2 and 6.4 can be combined (both test JWT claims)
- 2.1 and 2.2 can be combined (both test verification token processing)
- 4.6 and 4.7 can be combined (both test password reset completion)
- 5.1, 5.2, 5.3 can be combined into a general profile update property
- 8.2 and 8.3 can be combined (both test token randomness)

**Combined Properties:**
- Password hashing properties (1.2, 4.5, 8.1) can be unified
- Token validation properties (2.3, 4.8) can be unified
- JWT validation properties (3.8, 6.3) can be unified
- Timestamp properties (10.3, 10.4, 5.7) can be unified

After reflection, we'll focus on unique, high-value properties that provide comprehensive coverage without redundancy.

### Core Correctness Properties

**Property 1: Password Security - Hashing**
*For any* valid password submitted during registration or password reset, the Auth_System should store a bcrypt hash (not plaintext) with cost factor ≥ 10, and the hash should successfully verify against the original password.
**Validates: Requirements 1.2, 4.5, 8.1**

**Property 2: Password Security - Validation**
*For any* password string with length < 8 characters, the Auth_System should reject it during registration or password reset with a validation error.
**Validates: Requirements 1.7, 4.10**

**Property 3: User Registration - Complete Flow**
*For any* valid registration data (valid email, password ≥ 8 chars, required fields), the Auth_System should create a user record with email_verified=false, is_active=true, a unique verification token, and trigger a verification email.
**Validates: Requirements 1.1, 1.3, 1.4, 1.8, 1.9**

**Property 4: User Registration - Duplicate Prevention**
*For any* email address, if a user with that email already exists, attempting to register with the same email should return an error and not create a duplicate user record.
**Validates: Requirements 1.5, 10.5**

**Property 5: User Registration - Input Validation**
*For any* registration attempt missing required fields (full_name, email, password, user_type) or with invalid email format, the Auth_System should return a validation error and not create a user record.
**Validates: Requirements 1.6, 1.10**

**Property 6: Email Verification - Token Processing**
*For any* valid verification token, submitting it should set email_verified=true and clear the email_verification_token field in a single atomic operation.
**Validates: Requirements 2.1, 2.2**

**Property 7: Email Verification - Idempotence**
*For any* user with email_verified=true, attempting to verify again should succeed without modifying the user record (idempotent operation).
**Validates: Requirements 2.6**

**Property 8: Email Verification - Invalid Token Handling**
*For any* invalid, expired, or non-existent verification token, the Auth_System should return an error and not modify any user records.
**Validates: Requirements 2.3**

**Property 9: Email Verification - Token Regeneration**
*For any* user requesting a new verification email, the Auth_System should generate a new unique token (different from the previous token) and send it via email.
**Validates: Requirements 2.4, 2.5**

**Property 10: Login - Successful Authentication**
*For any* user with valid credentials, email_verified=true, and is_active=true, login should return a JWT token containing user_id and user_type claims, with expiration set to 24 hours from issuance.
**Validates: Requirements 3.1, 3.2, 3.3, 3.7**

**Property 11: Login - Invalid Credentials**
*For any* login attempt with incorrect password, the Auth_System should return an authentication error without revealing whether the email exists.
**Validates: Requirements 3.4**

**Property 12: Login - Account State Validation**
*For any* user with is_active=false, login attempts should fail with a "deactivated account" error, and for any user with email_verified=false, login attempts should fail with a "verification required" error.
**Validates: Requirements 3.5, 3.6, 7.1**

**Property 13: JWT Token - Signature Validation**
*For any* JWT token, it should be verifiable with the correct secret key and fail verification with an incorrect secret key, and expired tokens should fail validation.
**Validates: Requirements 3.8, 6.3**

**Property 14: JWT Token - Claims Integrity**
*For any* generated JWT token, decoding it should yield user_id, email, and user_type claims that exactly match the authenticated user's data.
**Validates: Requirements 6.2, 6.4**

**Property 15: Password Reset - Token Generation**
*For any* valid email requesting password reset, the Auth_System should generate a unique reset token, set password_reset_expires to 1 hour from current time, and send a reset email.
**Validates: Requirements 4.1, 4.2, 4.3**

**Property 16: Password Reset - Email Enumeration Prevention**
*For any* email address (whether it exists or not), password reset requests should return the same success response, preventing email enumeration attacks.
**Validates: Requirements 4.4, 8.8**

**Property 17: Password Reset - Token Expiration**
*For any* reset token where current time > password_reset_expires, the Auth_System should reject the token with an expiration error.
**Validates: Requirements 4.9**

**Property 18: Password Reset - Complete Flow**
*For any* valid reset token and new password (≥ 8 chars), the Auth_System should hash the new password, update password_hash, clear password_reset_token and password_reset_expires, and allow login with the new password.
**Validates: Requirements 4.5, 4.6, 4.7**

**Property 19: Password Reset - Invalid Token Handling**
*For any* invalid, expired, or non-existent reset token, the Auth_System should return an error and not modify any user records.
**Validates: Requirements 4.8**

**Property 20: Profile Update - Field Updates**
*For any* authenticated user updating their profile fields (full_name, phone_number, preferred_language), the Auth_System should update those specific fields and set updated_at to the current timestamp.
**Validates: Requirements 5.1, 5.2, 5.3, 5.7, 10.4**

**Property 21: Profile Update - Email Change Verification**
*For any* authenticated user updating their email address, the Auth_System should set email_verified=false, generate a new verification token, and require re-verification before the new email is fully active.
**Validates: Requirements 5.4, 5.5**

**Property 22: Profile Update - Authorization**
*For any* two distinct users A and B, user A should not be able to update user B's profile, and attempts should return an authorization error.
**Validates: Requirements 5.6**

**Property 23: Profile Update - Input Validation**
*For any* profile update with invalid data (e.g., invalid email format, empty required fields), the Auth_System should return validation errors and not modify the user record.
**Validates: Requirements 5.8**

**Property 24: Role-Based Access Control - User Type Assignment**
*For any* created user, the user_type field should be exactly one of the valid enum values (COMMITTEE, OWNER, TENANT, ADMIN).
**Validates: Requirements 6.1**

**Property 25: Role-Based Access Control - Protected Endpoints**
*For any* protected endpoint, requests without a valid JWT token should be rejected with 401 Unauthorized, and requests with valid tokens but insufficient role permissions should be rejected with 403 Forbidden.
**Validates: Requirements 6.5, 6.6**

**Property 26: User Deactivation - Round Trip**
*For any* user, setting is_active=false should prevent login, and subsequently setting is_active=true should restore login capability, with all other user data preserved throughout.
**Validates: Requirements 7.1, 7.2, 7.3**

**Property 27: Security - Token Randomness**
*For any* generated verification or reset token, it should have at least 32 bytes of cryptographic randomness, and tokens should be stored hashed (not plaintext) in the database.
**Validates: Requirements 8.2, 8.3, 8.5**

**Property 28: Security - JWT Secret Strength**
*The* JWT secret key should be at least 256 bits (32 bytes) in length.
**Validates: Requirements 8.4**

**Property 29: Security - SQL Injection Prevention**
*For any* input containing SQL injection payloads (e.g., `' OR '1'='1`), the Auth_System should safely handle the input through parameterized queries without executing malicious SQL.
**Validates: Requirements 8.6**

**Property 30: Security - XSS Prevention**
*For any* input containing XSS payloads (e.g., `<script>alert('xss')</script>`), the Auth_System should sanitize or escape the input to prevent script execution.
**Validates: Requirements 8.7**

**Property 31: Database Operations - Timestamp Management**
*For any* user creation, created_at should be set to the current timestamp, and for any user update, updated_at should be set to the current timestamp and be greater than or equal to created_at.
**Validates: Requirements 10.3, 10.4**

**Property 32: Database Operations - Transaction Atomicity**
*For any* operation that modifies multiple user fields (e.g., password reset clearing token and updating password), either all changes should succeed together or all should fail together, preventing partial updates.
**Validates: Requirements 10.6**

**Property 33: Database Operations - Error Handling**
*For any* database operation failure (e.g., connection error, constraint violation), the Auth_System should return an appropriate error response to the client without exposing internal database details.
**Validates: Requirements 10.7**

## Error Handling

### Error Categories

**1. Validation Errors (400 Bad Request)**
- Invalid email format
- Password too short (< 8 characters)
- Missing required fields
- Invalid user type enum value
- Invalid data types

**2. Authentication Errors (401 Unauthorized)**
- Invalid credentials (wrong password)
- Missing JWT token
- Invalid JWT token (malformed, expired, wrong signature)
- Email not verified
- Account deactivated

**3. Authorization Errors (403 Forbidden)**
- Insufficient role permissions
- Attempting to modify another user's profile

**4. Not Found Errors (404 Not Found)**
- User not found (internal use only, not exposed to prevent enumeration)

**5. Conflict Errors (409 Conflict)**
- Email already exists during registration

**6. Server Errors (500 Internal Server Error)**
- Database connection failures
- Email service failures
- Unexpected system errors

### Error Response Format

All errors follow a consistent format:

```typescript
{
  statusCode: number
  message: string | string[]
  error: string
  timestamp: string
  path: string
}
```

**Examples:**

```typescript
// Validation Error
{
  statusCode: 400,
  message: ["email must be a valid email", "password must be at least 8 characters"],
  error: "Bad Request",
  timestamp: "2024-01-15T10:30:00.000Z",
  path: "/auth/register"
}

// Authentication Error
{
  statusCode: 401,
  message: "Invalid credentials",
  error: "Unauthorized",
  timestamp: "2024-01-15T10:30:00.000Z",
  path: "/auth/login"
}

// Authorization Error
{
  statusCode: 403,
  message: "Insufficient permissions",
  error: "Forbidden",
  timestamp: "2024-01-15T10:30:00.000Z",
  path: "/auth/profile/other-user-id"
}
```

### Security Considerations for Error Messages

- Never reveal whether an email exists in the system (prevents enumeration)
- Use generic "Invalid credentials" for login failures
- Return same response for password reset regardless of email existence
- Don't expose internal error details (database errors, stack traces)
- Log detailed errors server-side for debugging

### Error Handling Strategy

**Service Layer:**
- Throw specific exceptions (e.g., `InvalidCredentialsException`, `EmailAlreadyExistsException`)
- Include error codes for programmatic handling
- Log errors with appropriate severity levels

**Controller Layer:**
- Catch service exceptions
- Transform to appropriate HTTP responses
- Use NestJS exception filters for consistent formatting

**Global Exception Filter:**
- Catch unhandled exceptions
- Return 500 Internal Server Error
- Log full error details server-side
- Return generic message to client

## Testing Strategy

### Dual Testing Approach

The authentication system requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of valid inputs
- Edge cases (empty strings, boundary values)
- Error conditions and exception handling
- Integration points between components
- Mock external dependencies (email service, database)

**Property-Based Tests** focus on:
- Universal properties that hold for all inputs
- Comprehensive input coverage through randomization
- Invariants that must always be true
- Round-trip properties (hash/verify, encode/decode)
- Security properties across many generated inputs

### Property-Based Testing Configuration

**Framework:** Use `@fast-check/jest` for TypeScript/NestJS

**Configuration:**
- Minimum 100 iterations per property test
- Each test tagged with feature name and property number
- Tag format: `Feature: auth-and-user-management, Property {N}: {property_text}`

**Example Property Test Structure:**

```typescript
import * as fc from 'fast-check';

describe('Auth System Properties', () => {
  // Feature: auth-and-user-management, Property 1: Password Security - Hashing
  it('should hash all passwords with bcrypt cost ≥ 10', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 8, maxLength: 100 }), // random passwords
        async (password) => {
          const hash = await passwordService.hash(password);
          
          // Verify it's a bcrypt hash
          expect(hash).toMatch(/^\$2[aby]\$\d{2}\$/);
          
          // Verify cost factor ≥ 10
          const costFactor = parseInt(hash.split('$')[2]);
          expect(costFactor).toBeGreaterThanOrEqual(10);
          
          // Verify it verifies correctly
          const isValid = await passwordService.verify(password, hash);
          expect(isValid).toBe(true);
          
          // Verify plaintext is not stored
          expect(hash).not.toBe(password);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Test Coverage Requirements

**Unit Test Coverage:**
- All service methods
- All controller endpoints
- All guard logic
- All DTO validation rules
- Error handling paths

**Property Test Coverage:**
- All 33 correctness properties defined above
- Each property maps to specific requirements
- Focus on security-critical properties (password hashing, token generation, authorization)

### Testing External Dependencies

**Email Service:**
- Mock in unit tests
- Verify correct method calls and parameters
- Test email sending failures

**Database:**
- Use in-memory database or test database for integration tests
- Mock Prisma client for unit tests
- Test transaction rollback scenarios

**JWT Library:**
- Test with known secret keys
- Verify token structure and claims
- Test expiration and signature validation

### Integration Testing

**API Integration Tests:**
- Test complete flows (register → verify → login)
- Test password reset flow end-to-end
- Test profile update flow
- Use real HTTP requests to controllers
- Verify response formats and status codes

**Database Integration Tests:**
- Test Prisma schema migrations
- Test unique constraints
- Test cascade operations
- Test transaction atomicity

### Security Testing

**Specific Security Tests:**
- SQL injection attempts (Property 29)
- XSS payload handling (Property 30)
- Email enumeration prevention (Property 16)
- Token randomness and uniqueness (Property 27)
- JWT signature tampering detection (Property 13)
- Brute force protection (rate limiting - future enhancement)

### Performance Testing

While not part of correctness properties, consider:
- Password hashing performance (bcrypt is intentionally slow)
- Database query performance with indexes
- JWT token generation/validation performance
- Concurrent user registration handling

### Test Organization

```
src/
  auth/
    __tests__/
      unit/
        auth.service.spec.ts
        user.service.spec.ts
        token.service.spec.ts
        password.service.spec.ts
      properties/
        auth-properties.spec.ts
        security-properties.spec.ts
        profile-properties.spec.ts
      integration/
        auth-flow.spec.ts
        api-endpoints.spec.ts
```

### Continuous Testing

- Run unit tests on every commit
- Run property tests on every pull request
- Run integration tests before deployment
- Monitor test execution time
- Maintain test coverage above 80%
