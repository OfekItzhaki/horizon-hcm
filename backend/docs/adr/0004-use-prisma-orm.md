# 4. Use Prisma ORM

**Date**: 2026-02-24

**Status**: Accepted

## Context

Horizon-HCM requires a robust database access layer for:
- **Type Safety**: Prevent runtime errors with compile-time type checking
- **Schema Management**: Version-controlled database schema with migrations
- **Query Building**: Intuitive API for complex queries
- **Relationships**: Handle complex relationships (apartments, owners, tenants, buildings)
- **Performance**: Efficient queries with connection pooling
- **Developer Experience**: Auto-completion, IntelliSense, and documentation
- **Multi-Database Support**: Potential to support multiple databases

Requirements:
- PostgreSQL support (using Supabase)
- Type-safe queries
- Migration system
- Relationship handling
- Transaction support
- Connection pooling
- Query optimization

Without a proper ORM:
- Manual SQL queries prone to errors
- No type safety
- Difficult schema versioning
- Complex relationship handling
- SQL injection vulnerabilities
- Poor developer experience

## Decision

We will use **Prisma** as our ORM and database toolkit.

**Implementation Details:**
- **Database**: PostgreSQL (Supabase)
- **Schema**: Defined in `prisma/schema.prisma`
- **Migrations**: Prisma Migrate for version control
- **Client**: Auto-generated type-safe client
- **Integration**: PrismaService as NestJS provider

**Schema Structure:**
```prisma
model Apartment {
  id            String   @id @default(uuid())
  apartmentNumber String
  buildingId    String
  building      Building @relation(fields: [buildingId], references: [id])
  owners        Owner[]
  tenants       Tenant[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@unique([buildingId, apartmentNumber])
}
```

**Service Integration:**
```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

**Query Examples:**
```typescript
// Type-safe queries
const apartment = await prisma.apartment.findUnique({
  where: { id },
  include: { owners: true, tenants: true },
});

// Transactions
await prisma.$transaction([
  prisma.apartment.create({ data: apartmentData }),
  prisma.owner.create({ data: ownerData }),
]);
```

## Consequences

### Positive Consequences
- **Type Safety**: Full TypeScript support with auto-generated types
- **Developer Experience**: Excellent IntelliSense and auto-completion
- **Migration System**: Robust, version-controlled migrations
- **Performance**: Optimized queries with connection pooling
- **Relationships**: Intuitive relationship handling
- **Documentation**: Auto-generated documentation from schema
- **Validation**: Schema-level validation and constraints
- **Introspection**: Can introspect existing databases
- **Modern**: Active development, modern architecture
- **Community**: Large, active community and ecosystem

### Negative Consequences
- **Learning Curve**: Team needs to learn Prisma-specific patterns
- **Abstraction**: Less control over raw SQL (though raw queries are supported)
- **Migration Complexity**: Complex migrations may require manual SQL
- **Bundle Size**: Prisma Client adds to bundle size
- **Lock-in**: Switching ORMs later would require significant refactoring

### Neutral Consequences
- **Schema-First**: Schema defined in Prisma format, not TypeScript
- **Code Generation**: Need to run `prisma generate` after schema changes
- **Database-Specific**: Some features are database-specific

## Alternatives Considered

### Alternative 1: TypeORM
- **Description**: Use TypeORM, the most popular TypeScript ORM
- **Pros**:
  - Mature, widely used
  - Decorator-based entities
  - Active Record and Data Mapper patterns
  - Good NestJS integration
  - Large community
- **Cons**:
  - Less type-safe than Prisma
  - More boilerplate code
  - Migration system less robust
  - Performance issues at scale
  - Complex relationship handling
- **Why Rejected**: Prisma offers better type safety and developer experience

### Alternative 2: Sequelize
- **Description**: Use Sequelize, a promise-based ORM
- **Pros**:
  - Very mature
  - Large ecosystem
  - Multi-database support
  - Good documentation
- **Cons**:
  - JavaScript-first (TypeScript support is secondary)
  - Less type-safe
  - Older architecture
  - Verbose API
  - Migration system less intuitive
- **Why Rejected**: Poor TypeScript support, outdated patterns

### Alternative 3: MikroORM
- **Description**: Use MikroORM, a TypeScript ORM
- **Pros**:
  - TypeScript-first
  - Unit of Work pattern
  - Good performance
  - Identity Map
  - Modern architecture
- **Cons**:
  - Smaller community
  - Less documentation
  - Steeper learning curve
  - Fewer resources and examples
- **Why Rejected**: Smaller ecosystem, Prisma has better DX

### Alternative 4: Knex.js + Objection.js
- **Description**: Use Knex for query building and Objection for ORM
- **Pros**:
  - Flexible query builder
  - Good performance
  - More control over SQL
  - Lightweight
- **Cons**:
  - Two libraries to learn
  - Less type-safe
  - More boilerplate
  - Manual type definitions
  - No auto-generated types
- **Why Rejected**: More complex setup, less type safety

### Alternative 5: Raw SQL with pg
- **Description**: Use raw SQL queries with node-postgres
- **Pros**:
  - Full control
  - Maximum performance
  - No abstraction overhead
  - Simple, no magic
- **Cons**:
  - No type safety
  - SQL injection risk
  - Manual migration management
  - Verbose, repetitive code
  - No relationship handling
  - Poor developer experience
- **Why Rejected**: Too low-level, error-prone, poor DX

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma with NestJS](https://docs.nestjs.com/recipes/prisma)
- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Prisma Migrate](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Why Prisma?](https://www.prisma.io/docs/concepts/overview/why-prisma)

