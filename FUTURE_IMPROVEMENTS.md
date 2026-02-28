# Future Improvements

## Security

### Password Hashing
- **Current**: Using bcrypt with 10 rounds
- **Recommendation**: Migrate to Argon2id for better resistance against GPU/ASIC attacks
- **Priority**: Medium
- **Effort**: Low (library swap + migration script)

## Authentication

### Auth Package Integration
- **Current**: Using auth-override endpoints to bypass horizon-auth Prisma conflicts
- **Issue**: The @ofeklabs/horizon-auth package creates its own Prisma client instance
- **Recommendation**: 
  1. Either fix the package to use shared Prisma client
  2. Or implement custom auth solution without the package
  3. Or ensure both Prisma schemas stay in perfect sync
- **Priority**: High (technical debt)
- **Effort**: High

### Token Management
- **Current**: Simple JWT tokens with 24h expiry
- **Recommendation**: 
  1. Implement proper refresh token rotation
  2. Add token revocation/blacklist
  3. Consider shorter access token expiry (15 min)
- **Priority**: Medium
- **Effort**: Medium

## Database

### Prisma Schema Consolidation
- **Current**: Two separate Prisma schemas (app + horizon-auth package)
- **Recommendation**: Consolidate into single schema or ensure perfect sync
- **Priority**: High
- **Effort**: High

## Testing

### Property-Based Testing
- **Current**: Some PBT tests failing due to incomplete mocks
- **Recommendation**: Complete mock data setup for all tests
- **Priority**: Low
- **Effort**: Low

## Monitoring

### Logging
- **Current**: Basic logging with Winston
- **Recommendation**: 
  1. Add structured logging with correlation IDs
  2. Integrate with centralized logging (ELK, Datadog, etc.)
  3. Add performance metrics
- **Priority**: Medium
- **Effort**: Medium

---

**Last Updated**: February 28, 2026
