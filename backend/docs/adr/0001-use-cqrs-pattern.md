# 1. Use CQRS Pattern

**Date**: 2026-02-24

**Status**: Accepted

## Context

Horizon-HCM is a house committee management platform that needs to handle:
- Complex business logic for financial management, resident management, and building operations
- Different read and write requirements (reports vs. transactions)
- Audit trails for all state changes
- Potential for high read traffic on reports
- Need for clear separation of concerns

Traditional CRUD operations can lead to:
- Tight coupling between read and write models
- Difficulty optimizing for different access patterns
- Complex validation logic mixed with data access
- Challenges in maintaining audit trails
- Scalability limitations

## Decision

We will use the **Command Query Responsibility Segregation (CQRS)** pattern throughout the application, implemented via NestJS's `@nestjs/cqrs` package.

**Implementation Details:**
- **Commands**: Represent write operations (Create, Update, Delete)
- **Queries**: Represent read operations (Get, List, Search)
- **Command Handlers**: Execute business logic and persist changes
- **Query Handlers**: Retrieve and format data for presentation
- **Events**: Emitted after successful command execution for side effects

**Structure:**
```
module/
├── commands/
│   ├── impl/
│   │   └── create-entity.command.ts
│   └── handlers/
│       └── create-entity.handler.ts
├── queries/
│   ├── impl/
│   │   └── get-entity.query.ts
│   └── handlers/
│       └── get-entity.handler.ts
└── events/
    └── entity-created.event.ts
```

## Consequences

### Positive Consequences
- **Clear Separation**: Commands and queries have distinct responsibilities
- **Testability**: Each handler can be unit tested in isolation
- **Scalability**: Read and write operations can be optimized independently
- **Audit Trail**: Commands naturally create audit points
- **Event-Driven**: Easy to add side effects via event handlers
- **Maintainability**: Business logic is organized and discoverable
- **Type Safety**: TypeScript provides compile-time guarantees

### Negative Consequences
- **More Files**: Each operation requires multiple files (command, handler, tests)
- **Learning Curve**: Team needs to understand CQRS concepts
- **Boilerplate**: Some repetitive code for simple CRUD operations
- **Complexity**: Overkill for very simple operations

### Neutral Consequences
- **Consistency**: All modules follow the same pattern
- **Documentation**: Pattern is well-documented in NestJS ecosystem

## Alternatives Considered

### Alternative 1: Traditional Service Layer
- **Description**: Use services with methods for all operations
- **Pros**: 
  - Simpler, fewer files
  - Familiar to most developers
  - Less boilerplate
- **Cons**:
  - Services become large and complex
  - Harder to test individual operations
  - Difficult to add cross-cutting concerns
  - No clear separation between reads and writes
- **Why Rejected**: Doesn't scale well for complex business logic

### Alternative 2: Repository Pattern Only
- **Description**: Use repositories for data access with service orchestration
- **Pros**:
  - Clean data access layer
  - Testable with mocks
  - Well-known pattern
- **Cons**:
  - Doesn't address command/query separation
  - Business logic still mixed in services
  - No built-in event system
- **Why Rejected**: Doesn't provide enough structure for complex operations

### Alternative 3: Event Sourcing
- **Description**: Store all changes as events, rebuild state from events
- **Pros**:
  - Complete audit trail
  - Time travel capabilities
  - Natural event-driven architecture
- **Cons**:
  - Significant complexity
  - Requires event store infrastructure
  - Difficult to query current state
  - Steep learning curve
- **Why Rejected**: Too complex for current requirements, can be added later if needed

## References

- [NestJS CQRS Documentation](https://docs.nestjs.com/recipes/cqrs)
- [Martin Fowler - CQRS](https://martinfowler.com/bliki/CQRS.html)
- [Microsoft - CQRS Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/cqrs)
- [CQRS Journey](https://docs.microsoft.com/en-us/previous-versions/msp-n-p/jj554200(v=pandp.10))
