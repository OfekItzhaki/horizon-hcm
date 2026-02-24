# API Conventions

**Last Updated**: 2026-02-24  
**Version**: 1.0  
**Status**: Active

This document defines the API design standards and conventions for Horizon-HCM.

---

## Table of Contents

1. [RESTful Naming Conventions](#restful-naming-conventions)
2. [HTTP Methods](#http-methods)
3. [Response Format](#response-format)
4. [Error Handling](#error-handling)
5. [Pagination](#pagination)
6. [Filtering and Sorting](#filtering-and-sorting)
7. [API Versioning](#api-versioning)
8. [Authentication](#authentication)
9. [Rate Limiting](#rate-limiting)

---

## RESTful Naming Conventions

### Resource Naming

- Use **plural nouns** for collections: `/apartments`, `/residents`, `/payments`
- Use **kebab-case** for multi-word resources: `/maintenance-requests`, `/committee-members`
- Avoid verbs in URLs (use HTTP methods instead)

### URL Structure

```
/api/v1/{resource}
/api/v1/{resource}/{id}
/api/v1/{resource}/{id}/{sub-resource}
/api/v1/{resource}/{id}/{sub-resource}/{sub-id}
```

### Examples

```
GET    /api/v1/buildings                    # List all buildings
GET    /api/v1/buildings/{id}               # Get specific building
POST   /api/v1/buildings                    # Create building
PUT    /api/v1/buildings/{id}               # Update building
DELETE /api/v1/buildings/{id}               # Delete building

GET    /api/v1/buildings/{id}/apartments    # List apartments in building
POST   /api/v1/apartments/{id}/owners       # Assign owner to apartment
GET    /api/v1/residents/search             # Search residents
POST   /api/v1/reports/export               # Export report
```

---

## HTTP Methods

### Standard Methods

| Method | Purpose | Idempotent | Safe |
|--------|---------|------------|------|
| GET | Retrieve resource(s) | Yes | Yes |
| POST | Create resource | No | No |
| PUT | Update/replace resource | Yes | No |
| PATCH | Partial update | No | No |
| DELETE | Remove resource | Yes | No |

### Method Usage

```typescript
// GET - Retrieve
@Get('apartments/:id')
async getApartment(@Param('id') id: string) { }

// POST - Create
@Post('apartments')
async createApartment(@Body() dto: CreateApartmentDto) { }

// PUT - Full update
@Put('apartments/:id')
async updateApartment(@Param('id') id: string, @Body() dto: UpdateApartmentDto) { }

// PATCH - Partial update
@Patch('apartments/:id/status')
async updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) { }

// DELETE - Remove
@Delete('apartments/:id')
async deleteApartment(@Param('id') id: string) { }
```

---

## Response Format

### Success Response

All successful responses follow this structure:

```json
{
  "data": { ... },           // Single resource
  "data": [ ... ],           // Multiple resources
  "pagination": { ... },     // For paginated responses
  "meta": { ... }            // Optional metadata
}
```

### Examples

**Single Resource:**
```json
{
  "data": {
    "id": "apt-123",
    "apartmentNumber": "12A",
    "areaSqm": 85.5,
    "floor": 3,
    "isVacant": false
  }
}
```

**Collection:**
```json
{
  "data": [
    { "id": "apt-123", "apartmentNumber": "12A" },
    { "id": "apt-124", "apartmentNumber": "12B" }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Error Handling

### Standard Error Format

All errors follow this structure:

```json
{
  "statusCode": 400,
  "message": "Apartment 12A already exists in this building",
  "error": "Bad Request",
  "timestamp": "2024-02-24T10:30:00.000Z",
  "path": "/api/v1/apartments",
  "correlationId": "uuid-here"
}
```

### HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH, DELETE |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE with no response body |
| 400 | Bad Request | Invalid input, validation errors |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource conflict (duplicate, etc.) |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Temporary unavailability |

### Error Messages

- Be **specific** and **actionable**
- Include what went wrong and how to fix it
- Don't expose sensitive information or stack traces in production

```typescript
// Good
throw new BadRequestException('Apartment 12A already exists in this building');
throw new NotFoundException('Building with ID building-123 not found');
throw new ForbiddenException('Access denied: Committee member role required');

// Bad
throw new BadRequestException('Invalid input');
throw new NotFoundException('Not found');
throw new ForbiddenException('Access denied');
```

---

## Pagination

### Standard Pagination

Horizon-HCM supports **offset-based pagination** for most endpoints.

#### Query Parameters

```
?page=1          # Page number (1-indexed)
?limit=20        # Items per page (default: 20, max: 100)
```

#### Response Format

```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

#### Implementation

```typescript
import { PaginationService } from '../common/services/pagination.service';

async execute(query: ListItemsQuery) {
  return this.paginationService.paginateOffset(
    this.prisma.items,
    { page: query.page, limit: query.limit },
    { is_active: true },
    { created_at: 'desc' }
  );
}
```

### Cursor-Based Pagination

For large datasets or real-time data, use **cursor-based pagination**.

#### Query Parameters

```
?cursor=base64-encoded-cursor
?limit=20
```

#### Response Format

```json
{
  "data": [ ... ],
  "pagination": {
    "limit": 20,
    "hasNext": true,
    "hasPrev": true,
    "nextCursor": "eyJ2YWx1ZSI6IjEyMyJ9",
    "prevCursor": "eyJ2YWx1ZSI6Ijk4In0="
  }
}
```

#### Implementation

```typescript
async execute(query: ListItemsQuery) {
  return this.paginationService.paginateCursor(
    this.prisma.items,
    { cursor: query.cursor, limit: query.limit },
    'id',
    { is_active: true },
    { created_at: 'desc' }
  );
}
```

---

## Filtering and Sorting

### Filtering

Use query parameters for filtering:

```
GET /api/v1/residents?userType=OWNER
GET /api/v1/residents?apartmentNumber=12A
GET /api/v1/residents?search=John
GET /api/v1/payments?status=paid&startDate=2024-01-01&endDate=2024-12-31
```

### Sorting

Use `sortBy` and `sortOrder` parameters:

```
GET /api/v1/apartments?sortBy=apartmentNumber&sortOrder=asc
GET /api/v1/payments?sortBy=createdAt&sortOrder=desc
```

### Field Selection

Use `fields` parameter to select specific fields:

```
GET /api/v1/residents?fields=id,fullName,phoneNumber
```

Response:
```json
{
  "data": [
    { "id": "123", "fullName": "John Doe", "phoneNumber": "050-1234567" }
  ]
}
```

---

## API Versioning

### URL-Based Versioning

Horizon-HCM uses **URL-based versioning**:

```
/api/v1/apartments
/api/v2/apartments
```

### Version Lifecycle

1. **Active**: Current version, fully supported
2. **Deprecated**: Old version, still works but discouraged
3. **Sunset**: Version will be removed on specific date

### Deprecation Headers

When a version is deprecated, the API returns these headers:

```
X-API-Deprecated: true
X-API-Sunset-Date: 2025-12-31T00:00:00.000Z
X-API-Deprecation-Message: API v1 will be sunset on December 31, 2025. Please migrate to v2.
Deprecation: true
Sunset: Fri, 31 Dec 2025 00:00:00 GMT
```

### Implementation

The `ApiVersioningMiddleware` automatically handles version detection and deprecation warnings.

```typescript
// To deprecate a version
const middleware = app.get(ApiVersioningMiddleware);
middleware.addDeprecatedVersion(
  'v1',
  new Date('2025-12-31'),
  'Please migrate to v2'
);
```

### Migration Guide

When introducing a new version:

1. Document breaking changes
2. Provide migration guide
3. Set deprecation timeline (minimum 6 months)
4. Add deprecation headers to old version
5. Monitor usage of old version
6. Remove old version after sunset date

---

## Authentication

### Firebase Authentication

All protected endpoints require Firebase authentication token:

```
Authorization: Bearer <firebase-id-token>
```

### User Context

Authenticated user is available in request:

```typescript
@Get('profile')
async getProfile(@Request() req) {
  const user = req.user; // { id, email, ... }
  return this.profileService.getProfile(user.id);
}
```

### Authorization Guards

Use guards for role-based access control:

```typescript
@UseGuards(CommitteeMemberGuard)
@Post('buildings/:buildingId/announcements')
async createAnnouncement() { }

@UseGuards(BuildingMemberGuard)
@Get('buildings/:buildingId/residents')
async listResidents() { }
```

---

## Rate Limiting

### Default Limits

- **Anonymous**: 100 requests per 15 minutes
- **Authenticated**: 1000 requests per 15 minutes
- **Premium**: 5000 requests per 15 minutes

### Rate Limit Headers

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1614556800
```

### Rate Limit Exceeded

```json
{
  "statusCode": 429,
  "message": "Too many requests. Please try again in 15 minutes.",
  "error": "Too Many Requests",
  "retryAfter": 900
}
```

---

## Best Practices

### 1. Use Consistent Naming

```
✅ /apartments
❌ /apartment
❌ /Apartments

✅ /maintenance-requests
❌ /maintenanceRequests
❌ /maintenance_requests
```

### 2. Return Appropriate Status Codes

```typescript
// 201 for creation
@Post()
@HttpCode(201)
async create(@Body() dto: CreateDto) { }

// 204 for deletion
@Delete(':id')
@HttpCode(204)
async delete(@Param('id') id: string) { }
```

### 3. Include Correlation IDs

All responses include `X-Correlation-ID` header for request tracing.

### 4. Use DTOs for Validation

```typescript
export class CreateApartmentDto {
  @IsString()
  @IsNotEmpty()
  apartmentNumber: string;

  @IsNumber()
  @Min(0)
  areaSqm: number;
}
```

### 5. Document with Swagger

```typescript
@ApiTags('Apartments')
@ApiOperation({ summary: 'Create a new apartment' })
@ApiResponse({ status: 201, description: 'Apartment created successfully' })
@ApiResponse({ status: 400, description: 'Invalid input' })
@Post()
async create(@Body() dto: CreateApartmentDto) { }
```

---

## Additional Resources

- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) - Development guidelines
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [API_VERSIONING.md](./API_VERSIONING.md) - Detailed versioning guide
- [Swagger Documentation](http://localhost:3001/api/docs) - Interactive API docs

---

**Questions?** Contact the development team or check the documentation.
