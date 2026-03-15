# Bugfix Requirements Document

## Introduction

The backend codebase has 240+ TypeScript compilation errors caused by incorrect Prisma model and relation name usage. The root cause is a mismatch between how Prisma generates client accessors (camelCase for model names) and how relation names are defined in the schema (snake_case). Code incorrectly uses plural/snake_case for model accessors and camelCase for relation names in include clauses, when it should be the opposite.

This bug affects multiple modules including apartments, announcements, meetings, residents, and users. Previous fixes reduced errors from 290 to 240, but relation name issues and remaining model accessor issues persist.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN code accesses Prisma models using snake_case names (e.g., `prisma.user_profiles`, `prisma.apartment_owners`) THEN the system produces TypeScript compilation errors because Prisma generates camelCase accessors

1.2 WHEN code uses camelCase relation names in include clauses (e.g., `include: { apartmentOwners: true }`) THEN the system produces TypeScript compilation errors because relation names in the schema are snake_case

1.3 WHEN code accesses properties on included relations using camelCase (e.g., `profile.apartmentOwners`, `profile.buildingCommitteeMembers`) THEN the system produces TypeScript compilation errors because the actual property names are snake_case

1.4 WHEN the PowerShell script `backend/fix-prisma-names.ps1` is used THEN it incorrectly converts relation names to camelCase, causing additional errors

### Expected Behavior (Correct)

2.1 WHEN code accesses Prisma models THEN the system SHALL use camelCase model accessors (e.g., `prisma.userProfile`, `prisma.apartmentOwner`, `prisma.announcement`)

2.2 WHEN code uses include clauses for relations THEN the system SHALL use snake_case relation names exactly as defined in the Prisma schema (e.g., `include: { apartment_owners: true, apartment_tenants: true, building_committee_members: true }`)

2.3 WHEN code accesses properties on included relations THEN the system SHALL use snake_case property names (e.g., `profile.apartment_owners`, `profile.building_committee_members`, `poll.poll_votes`)

2.4 WHEN all fixes are applied THEN the system SHALL compile without TypeScript errors related to Prisma model or relation names

### Unchanged Behavior (Regression Prevention)

3.1 WHEN code uses correct Prisma patterns in already-fixed modules (webhook, meetings, notifications, payments, sync, residents, users, polls) THEN the system SHALL CONTINUE TO compile without errors

3.2 WHEN Prisma queries include where clauses, orderBy, or other query options THEN the system SHALL CONTINUE TO use the correct field names from the schema

3.3 WHEN code performs CRUD operations on Prisma models THEN the system SHALL CONTINUE TO function correctly with proper data persistence

3.4 WHEN the application runs THEN the system SHALL CONTINUE TO maintain all existing functionality without runtime errors
