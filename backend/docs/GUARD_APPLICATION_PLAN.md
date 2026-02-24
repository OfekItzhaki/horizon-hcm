# Guard Application Plan for Horizon HCM

## Current Status

### Authentication (JwtAuthGuard)
- ✅ Available from `@ofeklabs/horizon-auth`
- ⚠️ **NOT consistently applied** across all controllers
- Some controllers use `@UseGuards(JwtAuthGuard)`, others don't

### Authorization Guards
- ✅ BuildingMemberGuard - implemented
- ✅ CommitteeMemberGuard - implemented
- ✅ ResourceOwnerGuard - implemented

## Required Changes

### 1. Apply JwtAuthGuard Globally or Per-Controller

**Option A: Global Application (Recommended)**
Apply JwtAuthGuard globally in `main.ts`:
```typescript
import { JwtAuthGuard } from '@ofeklabs/horizon-auth';

app.useGlobalGuards(new JwtAuthGuard(reflector));
```

**Option B: Controller-Level Application**
Add `@UseGuards(JwtAuthGuard)` to every controller class that requires authentication.

### 2. Guard Combinations by Endpoint Type

#### Public Endpoints (No Guards)
- Health check
- Registration
- Login/Logout
- Password reset request

#### Authenticated Only (JwtAuthGuard)
- User profile (own)
- User preferences (own)
- Notifications (own)

#### Building Member (JwtAuthGuard + BuildingMemberGuard)
- View announcements
- View documents
- View residents list
- View meetings
- View maintenance requests (all)
- View payments (all)
- View reports (read-only)

#### Committee Member (JwtAuthGuard + BuildingMemberGuard + CommitteeMemberGuard)
- Create/Update/Delete announcements
- Create/Update/Delete documents
- Manage residents
- Create/Update/Delete meetings
- Manage maintenance requests (assign, update status)
- Manage payments
- Financial reports (all operations)
- Building settings

#### Resource Owner (JwtAuthGuard + ResourceOwnerGuard)
- Update own maintenance request
- Delete own comment
- Update own document

## Controller-by-Controller Plan

### ✅ Already Correct
- `users.controller.ts` - Has JwtAuthGuard on all endpoints
- `polls.controller.ts` - Has JwtAuthGuard on controller
- `messages.controller.ts` - Has JwtAuthGuard on controller
- `invoices.controller.ts` - Has JwtAuthGuard on controller
- `notifications.controller.ts` - Has JwtAuthGuard on controller

### ⚠️ Needs JwtAuthGuard Added
- `reports.controller.ts` - Missing JwtAuthGuard
- `residents.controller.ts` - Missing JwtAuthGuard
- `payments.controller.ts` - Missing JwtAuthGuard
- `meetings.controller.ts` - Missing JwtAuthGuard
- `maintenance.controller.ts` - Missing JwtAuthGuard
- `documents.controller.ts` - Missing JwtAuthGuard
- `announcements.controller.ts` - Missing JwtAuthGuard
- `apartments.controller.ts` - Missing JwtAuthGuard
- `buildings.controller.ts` - Missing JwtAuthGuard (some endpoints)

### ⚠️ Needs Guard Order Verification
All controllers with multiple guards need verification that guards are in correct order:
1. JwtAuthGuard (first - populates request.user)
2. BuildingMemberGuard (second - broader check)
3. CommitteeMemberGuard (third - stricter check)
4. ResourceOwnerGuard (alternative to Committee for specific resources)

## Implementation Steps

### Step 1: Add JwtAuthGuard to All Protected Controllers
Add to controller class:
```typescript
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MyController {}
```

### Step 2: Verify Guard Order on Endpoints
For endpoints with multiple guards:
```typescript
@Get('endpoint')
@UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
async myEndpoint() {}
```

JwtAuthGuard executes first (from controller level), then BuildingMemberGuard, then CommitteeMemberGuard.

### Step 3: Test Guard Execution
1. Test with no auth token → should fail at JwtAuthGuard
2. Test with valid token but not building member → should fail at BuildingMemberGuard
3. Test with building member but not committee → should fail at CommitteeMemberGuard
4. Test with committee member → should succeed

## Files to Update

1. `backend/src/reports/reports.controller.ts`
2. `backend/src/residents/residents.controller.ts`
3. `backend/src/payments/payments.controller.ts`
4. `backend/src/meetings/meetings.controller.ts`
5. `backend/src/maintenance/maintenance.controller.ts`
6. `backend/src/documents/documents.controller.ts`
7. `backend/src/announcements/announcements.controller.ts`
8. `backend/src/apartments/apartments.controller.ts`
9. `backend/src/buildings/buildings.controller.ts`

## Testing Checklist

- [ ] All protected endpoints require authentication
- [ ] Building-specific endpoints check building membership
- [ ] Admin operations require committee membership
- [ ] Resource modifications check ownership
- [ ] Guards execute in correct order
- [ ] Authorization failures are logged
- [ ] Cache is used for performance
- [ ] Error messages are clear and consistent
