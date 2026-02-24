# Guard Execution Order in Horizon HCM

## Overview

NestJS executes guards in the following order:
1. Global guards (applied in `main.ts` or `app.module.ts`)
2. Controller-level guards (applied with `@UseGuards()` on the controller class)
3. Route-level guards (applied with `@UseGuards()` on individual methods)

Within each level, guards execute in the order they are listed in the `@UseGuards()` decorator.

## Guard Execution Behavior

- **Short-circuit**: If any guard returns `false` or throws an exception, execution stops immediately
- **All must pass**: All guards must return `true` for the request to proceed
- **Sequential**: Guards execute one after another, not in parallel

## Horizon HCM Guards

### 1. AuthGuard (from @ofeklabs/horizon-auth)
- **Purpose**: Validates JWT token and populates `request.user`
- **Applied**: Globally via `@ApiBearerAuth()` or per-controller
- **Must execute first**: Other guards depend on `request.user`

### 2. BuildingMemberGuard
- **Purpose**: Verifies user belongs to the building (committee, owner, or tenant)
- **Caching**: 15-minute TTL with key `building-member:{userId}:{buildingId}`
- **Checks**: Committee membership, apartment ownership, active tenancy
- **Error**: "Access denied: You do not belong to this building"

### 3. CommitteeMemberGuard
- **Purpose**: Verifies user is a committee member for the building
- **Caching**: 15-minute TTL with key `committee:{userId}:{buildingId}`
- **Checks**: BuildingCommitteeMember table
- **Error**: "Access denied: Committee member role required"

### 4. ResourceOwnerGuard
- **Purpose**: Verifies user owns the specific resource or is a committee member
- **No caching**: Direct database queries
- **Special cases**:
  - Users can always modify their own UserProfile
  - Committee members can modify any resource in their building
- **Checks**: Resource-specific ownership fields (requester_id, author_id, uploaded_by)
- **Error**: "Access denied: You do not own this resource"

## Recommended Guard Combinations

### Read Building Data
```typescript
@UseGuards(BuildingMemberGuard)
```
- User must belong to the building (any role)
- Examples: View announcements, view documents, view residents list

### Create/Update/Delete Building Data
```typescript
@UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
```
- User must be a committee member
- BuildingMemberGuard executes first (broader check)
- CommitteeMemberGuard executes second (stricter check)
- Examples: Create announcements, manage residents, financial reports

### Modify User-Owned Resource
```typescript
@UseGuards(ResourceOwnerGuard)
@ResourceType('MaintenanceRequest')
```
- User must own the resource OR be a committee member
- Requires `@ResourceType()` decorator to specify resource type
- Examples: Update own maintenance request, delete own comment

### View Own Profile
```typescript
// No additional guards needed beyond AuthGuard
```
- Only authentication required
- User can always view their own profile

## Execution Order Example

For endpoint with `@UseGuards(BuildingMemberGuard, CommitteeMemberGuard)`:

1. **AuthGuard** (global) validates JWT → populates `request.user`
2. **BuildingMemberGuard** checks if user belongs to building
   - If false → throws ForbiddenException, stops execution
   - If true → continues to next guard
3. **CommitteeMemberGuard** checks if user is committee member
   - If false → throws ForbiddenException, stops execution
   - If true → request proceeds to controller

## Cache Invalidation

Guards use Redis caching to improve performance. Cache keys must be invalidated when:

- **Committee membership changes**: Invalidate both `committee:{userId}:{buildingId}` and `building-member:{userId}:{buildingId}`
- **Apartment ownership changes**: Invalidate `building-member:{userId}:{buildingId}`
- **Tenancy status changes**: Invalidate `building-member:{userId}:{buildingId}`

## Testing Guard Execution Order

To verify guard execution order:

1. Add logging to each guard's `canActivate` method
2. Make a request to an endpoint with multiple guards
3. Verify logs show guards executing in correct order
4. Verify execution stops at first failure

Example test:
```typescript
// Endpoint: GET /buildings/:buildingId/reports/balance
// Guards: BuildingMemberGuard, CommitteeMemberGuard

// Test 1: User not in building
// Expected: BuildingMemberGuard fails, CommitteeMemberGuard never executes

// Test 2: User in building but not committee
// Expected: BuildingMemberGuard passes, CommitteeMemberGuard fails

// Test 3: User is committee member
// Expected: Both guards pass, request proceeds
```

## Current Implementation Status

✅ All guards implemented with proper error messages
✅ Caching implemented for BuildingMemberGuard and CommitteeMemberGuard
✅ Audit logging for authorization failures
✅ ResourceOwnerGuard supports committee member bypass
✅ @ResourceType() decorator created

⚠️ Need to verify guard order is correct across all controllers
⚠️ Need to ensure AuthGuard is applied globally or per-controller
