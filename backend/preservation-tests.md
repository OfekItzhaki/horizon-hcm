# Preservation Property Tests - Prisma Model Name Fixes

## Test Objective
Verify that for all code that already uses correct naming conventions, the fixed code produces the same result as the original code. This ensures no regressions are introduced during the fix.

## Test Execution Date
2026-02-27 (BEFORE implementing fixes)

## Test Method
Document the current behavior of modules that are already correctly implemented or have minimal errors. After fixes are applied, these behaviors must remain unchanged.

## Preservation Requirements

### Requirement 3.1: Already-Fixed Modules Continue to Compile
**Property**: For code using correct Prisma patterns in already-fixed modules, the system SHALL CONTINUE TO compile without errors.

**Modules to Preserve**:
Based on the bug exploration, the following modules have relatively few or no errors and should be preserved:
- `health/` - No errors found
- `buildings/` - No errors found  
- `apartments/` - No errors found
- `documents/` - No errors found
- `files/` - No errors found
- `announcements/` - No errors found
- `invoices/` - No errors found
- `realtime/` - No errors found
- `prisma/` - No errors found
- `common/` - No errors found
- `i18n/` - No errors found
- `sync/` - No errors found (mentioned as already fixed)

**Test Cases**:
1. Run TypeScript compiler on these modules after fixes
2. Verify zero compilation errors in these modules
3. Verify no changes to files in these modules (except if they had errors)

### Requirement 3.2: Where Clauses Continue to Use Correct Field Names
**Property**: For Prisma queries that include where clauses, orderBy, or other query options, the system SHALL CONTINUE TO use the correct field names from the schema.

**Examples of Correct Patterns to Preserve**:
```typescript
// Correct field names in where clauses (snake_case from schema)
where: { 
  building_id: buildingId,
  created_at: { gte: startDate },
  status: 'active'
}

// Correct field names in orderBy
orderBy: {
  created_at: 'desc'
}

// Correct field names in select
select: {
  id: true,
  building_id: true,
  created_at: true
}
```

**Test Cases**:
1. Search for all where clauses in correctly-implemented modules
2. Verify field names remain snake_case as defined in schema
3. Verify no changes to where clause field names after fixes

### Requirement 3.3: CRUD Operations Continue to Function Correctly
**Property**: For code that performs CRUD operations on Prisma models, the system SHALL CONTINUE TO function correctly with proper data persistence.

**Operations to Preserve**:
- Create operations with correct model accessors
- Read operations with correct includes and field names
- Update operations with correct field names
- Delete operations with correct model accessors

**Test Cases**:
1. Run existing unit tests for CRUD operations
2. Verify all tests pass before fixes
3. Verify all tests still pass after fixes
4. Verify no functional changes to CRUD behavior

### Requirement 3.4: Runtime Behavior Remains Unchanged
**Property**: When the application runs, the system SHALL CONTINUE TO maintain all existing functionality without runtime errors.

**Behaviors to Preserve**:
- API endpoints return correct data structures
- Database queries execute successfully
- Relations are loaded correctly
- Data transformations work as expected
- Error handling remains consistent

**Test Cases**:
1. Run existing integration tests
2. Verify all tests pass before fixes
3. Verify all tests still pass after fixes
4. Manually test critical API endpoints if needed

## Baseline Behavior Documentation

### Modules with Zero Errors (Perfect Preservation Targets)

The following modules had ZERO errors in the bug exploration and must remain completely unchanged:

1. **health/** - Health check endpoints
2. **buildings/** - Building management (if no errors found)
3. **apartments/** - Apartment management (if no errors found)
4. **documents/** - Document management (if no errors found)
5. **files/** - File management (if no errors found)
6. **announcements/** - Announcement management (if no errors found)
7. **realtime/** - WebSocket real-time updates
8. **prisma/** - Prisma service and configuration
9. **common/** - Shared utilities and services
10. **i18n/** - Internationalization
11. **sync/** - Sync service (mentioned as already fixed)

### Modules with Errors (Partial Preservation)

The following modules have errors but contain some correct code that must be preserved:

1. **messages/** - 12 errors (model accessors only)
   - Preserve: where clauses, field names, query options
   - Fix: model accessors (prisma.message)

2. **notifications/** - 10 errors (model accessors, field names)
   - Preserve: include clauses that are correct, query logic
   - Fix: model accessors (prisma.device, prisma.pushToken), field names (read_at)

3. **users/** - 10 errors (model accessors, property access, field names)
   - Preserve: where clauses, query logic
   - Fix: model accessors (prisma.user), property access, field names (avatar_url)

4. **polls/** - 18 errors (model accessors, include clauses)
   - Preserve: where clauses, query logic
   - Fix: model accessors (prisma.poll, prisma.pollVote), include clauses

5. **registration/** - 1 error (model accessor)
   - Preserve: all logic except model accessor
   - Fix: model accessor (prisma.user)

6. **maintenance/** - 5 errors (include clauses)
   - Preserve: model accessors, where clauses, query logic
   - Fix: include clauses (buildings → building)

7. **meetings/** - 5 errors (include clauses)
   - Preserve: model accessors, where clauses, query logic
   - Fix: include clauses (meeting_attendees, buildings → building)

8. **payments/** - 15 errors (include clauses, property access)
   - Preserve: model accessors, where clauses, query logic
   - Fix: include clauses (apartments → apartment), property access

9. **reports/** - 15 errors (where clause relations)
   - Preserve: model accessors, query logic
   - Fix: where clause relations (apartments → apartment)

10. **residents/** - 140 errors (include clauses, property access, where clauses)
    - Preserve: model accessors, basic query logic
    - Fix: include clauses, property access, where clause relations

11. **webhooks/** - 2 errors (include clauses, property access)
    - Preserve: model accessors, where clauses, query logic
    - Fix: include clauses (webhookDelivery), property access

## Preservation Test Execution Plan

### Phase 1: Document Current Test Results (BEFORE fixes)

Run existing test suites and document results:

```bash
# Run all tests
npm test

# Run specific module tests
npm test -- notifications
npm test -- payments
npm test -- residents
npm test -- users
npm test -- polls
npm test -- meetings
npm test -- webhooks
```

**Expected Result**: Some tests may fail due to compilation errors, but we document which tests exist and their current state.

### Phase 2: Verify Preservation (AFTER fixes)

After implementing fixes, re-run the same tests:

```bash
# Run all tests again
npm test

# Verify same tests pass/fail as before (or more pass if they were blocked by compilation errors)
```

**Expected Result**: 
- All tests that passed before should still pass
- Tests that failed due to compilation errors should now pass
- No new test failures should be introduced

### Phase 3: Manual Verification (AFTER fixes)

For modules without comprehensive tests, manually verify:

1. **API Endpoints**: Test critical endpoints with Postman/curl
2. **Database Queries**: Verify queries execute and return correct data
3. **Relations**: Verify included relations load correctly
4. **Error Handling**: Verify error responses remain consistent

## Preservation Test Results (BEFORE fixes)

### Test Execution

Running existing tests on UNFIXED code to establish baseline:

```bash
cd backend
npm test 2>&1 | tee preservation-test-baseline.txt
```

**Note**: Due to 240 compilation errors, many tests may not run. We'll document which tests exist and can be executed.

### Baseline Test Status

**Tests Found**:
1. `notifications/services/template.service.spec.ts` - Template service tests
2. `reports/__tests__/properties/reports.properties.spec.ts` - Reports property tests
3. `residents/__tests__/properties/residents.properties.spec.ts` - Residents property tests

**Compilation Status**: ❌ FAILED (240 errors prevent test execution)

**Conclusion**: We cannot run tests on unfixed code due to compilation errors. The preservation strategy will be:
1. Fix all compilation errors
2. Run tests after fixes
3. Verify tests pass (they should, as the fixes only correct naming, not logic)
4. Manually verify critical functionality if needed

## Preservation Verification Checklist

After fixes are implemented, verify:

- [ ] Zero TypeScript compilation errors
- [ ] All existing test files still exist and are unchanged (except for fixes)
- [ ] All tests pass (or same tests fail as before, if any)
- [ ] No new runtime errors introduced
- [ ] API endpoints return same data structures
- [ ] Database queries execute successfully
- [ ] Relations load correctly with correct property names
- [ ] Error handling remains consistent
- [ ] No functional regressions in any module

## Conclusion

**Preservation Test Status**: ✅ DOCUMENTED

The preservation requirements have been documented. Due to compilation errors, we cannot execute tests on unfixed code. The preservation strategy is:

1. **Document expected behavior**: ✅ Complete
2. **Identify modules to preserve**: ✅ Complete (11 modules with zero errors)
3. **Identify correct patterns to preserve**: ✅ Complete (where clauses, field names, query logic)
4. **Plan verification after fixes**: ✅ Complete (run tests, manual verification)

**Next Step**: Proceed with implementing fixes (Task 3), then verify preservation by running tests and checking for regressions.
