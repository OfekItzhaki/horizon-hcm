# Prisma Model Name Fixes - Bugfix Design

## Overview

This bugfix addresses 240+ TypeScript compilation errors caused by incorrect Prisma model and relation name usage throughout the backend codebase. The root cause is a fundamental misunderstanding of how Prisma generates TypeScript client code: model names in the schema (snake_case) are converted to camelCase for client accessors, while relation names remain exactly as defined in the schema (snake_case). The fix requires systematic correction of model accessors, relation names in include clauses, and property access on included relations across multiple modules.

## Glossary

- **Bug_Condition (C)**: The condition that triggers TypeScript compilation errors - when code uses incorrect naming conventions for Prisma model accessors or relation names
- **Property (P)**: The desired behavior - code compiles without errors using correct camelCase model accessors and snake_case relation names
- **Preservation**: Existing functionality in already-fixed modules (webhook, meetings, notifications, payments, sync, residents, users, polls) that must remain unchanged
- **Model Accessor**: The property on the Prisma client used to access a model (e.g., `prisma.userProfile` for the `user_profiles` model)
- **Relation Name**: The property name used in include clauses and on returned objects to access related data (e.g., `apartment_owners` in `include: { apartment_owners: true }`)
- **Prisma Client Generation**: The process by which Prisma converts schema definitions to TypeScript types and client methods

## Bug Details

### Fault Condition

The bug manifests when code uses incorrect naming conventions for Prisma operations. There are three distinct error patterns:

1. **Model Accessor Errors**: Using snake_case or plural forms instead of singular camelCase
2. **Include Clause Errors**: Using camelCase relation names instead of snake_case as defined in schema
3. **Property Access Errors**: Using camelCase to access included relation properties instead of snake_case

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type PrismaCodePattern
  OUTPUT: boolean
  
  RETURN (input.type == "model_accessor" AND input.name NOT IN camelCaseModelNames)
         OR (input.type == "include_relation" AND input.name NOT IN snake_case_relation_names)
         OR (input.type == "property_access" AND input.accessedProperty NOT IN snake_case_relation_names)
         AND TypeScriptCompiler.hasError(input)
END FUNCTION
```

### Examples

**Model Accessor Errors:**
- `prisma.user_profiles.findUnique(...)` → Should be `prisma.userProfile.findUnique(...)`
- `prisma.apartment_owners.findMany(...)` → Should be `prisma.apartmentOwner.findMany(...)`
- `prisma.building_committee_members.create(...)` → Should be `prisma.buildingCommitteeMember.create(...)`

**Include Clause Errors:**
- `include: { apartmentOwners: true }` → Should be `include: { apartment_owners: true }`
- `include: { buildingCommitteeMembers: true }` → Should be `include: { building_committee_members: true }`
- `include: { pollVotes: true }` → Should be `include: { poll_votes: true }`

**Property Access Errors:**
- `profile.apartmentOwners.forEach(...)` → Should be `profile.apartment_owners.forEach(...)`
- `profile.buildingCommitteeMembers.length` → Should be `profile.building_committee_members.length`
- `poll.pollVotes.length` → Should be `poll.poll_votes.length`

**Edge Cases:**
- Models with single-word names like `User`, `Device` remain as-is (already camelCase)
- Relation names that reference these models use the schema definition exactly
- The PowerShell script `fix-prisma-names.ps1` incorrectly converts relation names, causing additional errors

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- All CRUD operations in already-fixed modules (webhook, meetings, notifications, payments, sync, residents, users, polls) must continue to work correctly
- Database queries with where clauses, orderBy, and other options must continue to use correct field names from the schema
- All existing functionality must maintain proper data persistence and retrieval
- Runtime behavior must remain unchanged - no functional regressions

**Scope:**
All code that already uses correct Prisma naming conventions should be completely unaffected by this fix. This includes:
- Correctly named model accessors (e.g., `prisma.user`, `prisma.meeting`, `prisma.poll`)
- Correctly named relation includes (e.g., `include: { meeting_attendees: true }`)
- Correctly named property access (e.g., `meeting.meeting_attendees`)
- Field names in where clauses, select statements, and orderBy clauses

## Hypothesized Root Cause

Based on the bug description and code analysis, the root causes are:

1. **Misunderstanding of Prisma Code Generation**: Developers assumed that snake_case model names in the schema would generate snake_case accessors, when Prisma actually converts them to camelCase (singular form)

2. **Inconsistent Naming Convention Application**: Developers applied camelCase to relation names in include clauses, not realizing that relation names remain exactly as defined in the schema (snake_case)

3. **Incorrect Automated Fix Script**: The PowerShell script `backend/fix-prisma-names.ps1` contains logic that converts relation names from camelCase to snake_case, but this was applied inconsistently and may have introduced new errors

4. **Lack of Type Checking During Development**: TypeScript compilation errors were not caught early, allowing incorrect patterns to proliferate across multiple modules

5. **Copy-Paste Propagation**: Once incorrect patterns were established in one module, they were copied to other modules, multiplying the errors

## Correctness Properties

Property 1: Fault Condition - Correct Prisma Naming Conventions

_For any_ Prisma operation where incorrect naming conventions are used (snake_case model accessors, camelCase relation names, or camelCase property access on relations), the fixed code SHALL use the correct conventions (camelCase model accessors, snake_case relation names, snake_case property access), causing TypeScript compilation to succeed without errors.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

Property 2: Preservation - Existing Correct Code

_For any_ Prisma operation that already uses correct naming conventions, the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing functionality in correctly-implemented modules.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

The fix requires systematic changes across multiple files in the following categories:

**Category 1: Model Accessor Corrections**

Convert all snake_case model accessors to singular camelCase:
- `prisma.user_profiles` → `prisma.userProfile`
- `prisma.apartment_owners` → `prisma.apartmentOwner`
- `prisma.apartment_tenants` → `prisma.apartmentTenant`
- `prisma.building_committee_members` → `prisma.buildingCommitteeMember`
- `prisma.announcement_comments` → `prisma.announcementComment`
- `prisma.announcement_reads` → `prisma.announcementRead`
- `prisma.maintenance_requests` → `prisma.maintenanceRequest`
- `prisma.agenda_items` → `prisma.agendaItem`
- `prisma.meeting_attendees` → `prisma.meetingAttendee`
- `prisma.poll_votes` → `prisma.pollVote`
- `prisma.vote_records` → `prisma.voteRecord`
- `prisma.notification_templates` → `prisma.notificationTemplate`
- `prisma.notification_preferences` → `prisma.notificationPreference`
- `prisma.notification_logs` → `prisma.notificationLog`

**Category 2: Include Clause Corrections**

Convert all camelCase relation names in include clauses to snake_case:
- `include: { apartmentOwners: true }` → `include: { apartment_owners: true }`
- `include: { apartmentTenants: true }` → `include: { apartment_tenants: true }`
- `include: { buildingCommitteeMembers: true }` → `include: { building_committee_members: true }`
- `include: { pollVotes: true }` → `include: { poll_votes: true }`
- `include: { meetingAttendees: true }` → `include: { meeting_attendees: true }`
- `include: { agendaItems: true }` → `include: { agenda_items: true }`
- `include: { voteRecords: true }` → `include: { vote_records: true }`
- `include: { announcementComments: true }` → `include: { announcement_comments: true }`
- `include: { announcementReads: true }` → `include: { announcement_reads: true }`
- `include: { webhookDeliveries: true }` → `include: { webhook_deliveries: true }`

**Category 3: Property Access Corrections**

Convert all camelCase property access on included relations to snake_case:
- `profile.apartmentOwners` → `profile.apartment_owners`
- `profile.apartmentTenants` → `profile.apartment_tenants`
- `profile.buildingCommitteeMembers` → `profile.building_committee_members`
- `poll.pollVotes` → `poll.poll_votes`
- `meeting.meetingAttendees` → `meeting.meeting_attendees`
- `meeting.agendaItems` → `meeting.agenda_items`
- `vote.voteRecords` → `vote.vote_records`

**Category 4: PowerShell Script Correction**

Update `backend/fix-prisma-names.ps1` to:
1. Remove incorrect relation name conversions that convert to camelCase
2. Add correct conversions that ensure snake_case relation names
3. Add property access pattern corrections
4. Add validation to prevent re-running on already-fixed files

**Category 5: Affected Modules**

Based on the requirements document, the following modules require fixes:
- `src/apartments/` - Model accessors and relation names
- `src/announcements/` - Model accessors and relation names
- `src/meetings/` - Remaining relation name issues
- `src/residents/` - Property access patterns
- `src/users/` - Property access patterns
- `src/invoices/` - Model accessor corrections
- Any other modules with remaining TypeScript errors

### Implementation Strategy

1. **Phase 1: Verify Current State**
   - Run TypeScript compiler to get exact error count and locations
   - Categorize errors by type (model accessor, include clause, property access)
   - Identify all affected files

2. **Phase 2: Fix Model Accessors**
   - Search for all `prisma.{snake_case_name}` patterns
   - Replace with correct camelCase singular forms
   - Verify no false positives (e.g., field names in where clauses)

3. **Phase 3: Fix Include Clauses**
   - Search for all `include: {` patterns
   - Identify camelCase relation names
   - Replace with snake_case as defined in schema

4. **Phase 4: Fix Property Access**
   - Search for property access on objects returned from Prisma queries
   - Identify camelCase property names for relations
   - Replace with snake_case

5. **Phase 5: Update PowerShell Script**
   - Correct the script logic
   - Add safeguards against re-running on fixed files
   - Document correct usage

6. **Phase 6: Verification**
   - Run TypeScript compiler to verify zero errors
   - Run existing tests to ensure no regressions
   - Manually test critical flows

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the compilation errors on unfixed code, then verify the fix resolves all errors and preserves existing behavior.

### Exploratory Fault Condition Checking

**Goal**: Surface counterexamples that demonstrate the TypeScript compilation errors BEFORE implementing the fix. Confirm the root cause analysis by examining actual error messages.

**Test Plan**: Run TypeScript compiler on unfixed code to capture all compilation errors. Categorize errors by type and identify patterns. This will confirm our understanding of the three error categories.

**Test Cases**:
1. **Model Accessor Errors**: Run `tsc --noEmit` and filter for errors containing snake_case model names (will fail on unfixed code)
2. **Include Clause Errors**: Search for errors related to relation names in include clauses (will fail on unfixed code)
3. **Property Access Errors**: Search for errors related to accessing properties on query results (will fail on unfixed code)
4. **Count Total Errors**: Verify we have ~240 errors as stated in requirements (baseline for measuring fix success)

**Expected Counterexamples**:
- "Property 'user_profiles' does not exist on type 'PrismaClient'"
- "Object literal may only specify known properties, and 'apartmentOwners' does not exist in type..."
- "Property 'apartmentOwners' does not exist on type..."
- Possible causes: incorrect naming conventions, misunderstanding of Prisma code generation

### Fix Checking

**Goal**: Verify that for all code patterns where the bug condition holds, the fixed code compiles without errors.

**Pseudocode:**
```
FOR ALL codePattern WHERE isBugCondition(codePattern) DO
  fixedCode := applyNamingFix(codePattern)
  ASSERT TypeScriptCompiler.compile(fixedCode).errors.length == 0
END FOR
```

**Test Plan**: After applying fixes, run TypeScript compiler and verify zero compilation errors related to Prisma naming.

**Test Cases**:
1. **Zero Compilation Errors**: Run `tsc --noEmit` and verify no errors (success on fixed code)
2. **All Model Accessors Correct**: Verify all `prisma.{modelName}` uses camelCase (success on fixed code)
3. **All Include Relations Correct**: Verify all include clauses use snake_case relation names (success on fixed code)
4. **All Property Access Correct**: Verify all property access on relations uses snake_case (success on fixed code)

### Preservation Checking

**Goal**: Verify that for all code that already uses correct naming conventions, the fixed code produces the same result as the original code.

**Pseudocode:**
```
FOR ALL codePattern WHERE NOT isBugCondition(codePattern) DO
  ASSERT originalCode.behavior == fixedCode.behavior
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across different query patterns
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all correctly-implemented code

**Test Plan**: Run existing test suites for already-fixed modules (webhook, meetings, notifications, payments, sync, residents, users, polls) to verify no regressions.

**Test Cases**:
1. **Webhook Module Tests**: Verify all webhook tests pass after fixes (should pass on both unfixed and fixed code)
2. **Meetings Module Tests**: Verify all meeting tests pass after fixes (should pass on both unfixed and fixed code)
3. **Notifications Module Tests**: Verify all notification tests pass after fixes (should pass on both unfixed and fixed code)
4. **Payments Module Tests**: Verify all payment tests pass after fixes (should pass on both unfixed and fixed code)
5. **Sync Module Tests**: Verify all sync tests pass after fixes (should pass on both unfixed and fixed code)
6. **Residents Module Tests**: Verify all resident tests pass after fixes (should pass on both unfixed and fixed code)
7. **Users Module Tests**: Verify all user tests pass after fixes (should pass on both unfixed and fixed code)
8. **Polls Module Tests**: Verify all poll tests pass after fixes (should pass on both unfixed and fixed code)

### Unit Tests

- Test that model accessors use correct camelCase naming
- Test that include clauses use correct snake_case relation names
- Test that property access on query results uses correct snake_case names
- Test edge cases with nested includes and complex queries
- Test that where clauses continue to use correct field names from schema

### Property-Based Tests

- Generate random Prisma query patterns and verify they compile without errors
- Generate random include clause combinations and verify correct relation names
- Test that all model accessor patterns use camelCase across the codebase
- Test that all relation access patterns use snake_case across the codebase

### Integration Tests

- Test full CRUD flows for each affected module after fixes
- Test complex queries with multiple includes and nested relations
- Test that data persistence and retrieval work correctly after fixes
- Test that all API endpoints continue to function correctly
- Test that no runtime errors occur in production-like scenarios
