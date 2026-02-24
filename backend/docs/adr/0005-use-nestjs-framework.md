# 5. Use NestJS Framework

**Date**: 2026-02-24

**Status**: Accepted

## Context

Horizon-HCM requires a robust backend framework for building a scalable, maintainable API:
- **Architecture**: Need clear structure and patterns for large codebase
- **TypeScript**: Full TypeScript support for type safety
- **Modularity**: Organize code into cohesive modules
- **Dependency Injection**: Manage dependencies and testability
- **Middleware**: Request/response processing pipeline
- **Guards**: Authentication and authorization
- **Interceptors**: Transform responses, logging, caching
- **Validation**: Request validation with decorators
- **Documentation**: Auto-generate API documentation
- **Testing**: Built-in testing utilities

Requirements:
- Enterprise-grade architecture
- TypeScript-first
- Scalable and maintainable
- Good developer experience
- Strong ecosystem
- Active community
- Production-ready

Without a proper framework:
- Inconsistent code structure
- Manual dependency management
- Boilerplate code
- Difficult to scale
- Poor testability
- No standard patterns

## Decision

We will use **NestJS** as our backend framework.

**Implementation Details:**
- **Architecture**: Modular, domain-driven structure
- **Patterns**: CQRS, Dependency Injection, Guards, Interceptors
- **Modules**: Feature-based modules (apartments, residents, reports, etc.)
- **Transport**: HTTP (Express), WebSockets (Socket.io)
- **Validation**: class-validator with DTOs
- **Documentation**: Swagger/OpenAPI auto-generation

**Module Structure:**
```typescript
@Module({
  imports: [CqrsModule],
  controllers: [ApartmentsController],
  providers: [
    // Command Handlers
    CreateApartmentHandler,
    UpdateApartmentHandler,
    // Query Handlers
    GetApartmentHandler,
    ListApartmentsHandler,
    // Services
    PrismaService,
  ],
})
export class ApartmentsModule {}
```

**Controller with Guards:**
```typescript
@Controller('apartments')
@UseGuards(JwtAuthGuard, BuildingMemberGuard)
@ApiTags('apartments')
export class ApartmentsController {
  @Post()
  @ApiOperation({ summary: 'Create apartment' })
  async create(@Body() dto: CreateApartmentDto) {
    return this.commandBus.execute(new CreateApartmentCommand(dto));
  }
}
```

**Dependency Injection:**
```typescript
@Injectable()
export class CreateApartmentHandler implements ICommandHandler<CreateApartmentCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}
}
```

## Consequences

### Positive Consequences
- **Architecture**: Clear, scalable architecture out of the box
- **TypeScript**: First-class TypeScript support
- **Modularity**: Easy to organize code into modules
- **Dependency Injection**: Built-in DI container
- **Decorators**: Clean, declarative code with decorators
- **Testing**: Excellent testing utilities and patterns
- **Documentation**: Auto-generate Swagger docs
- **Ecosystem**: Rich ecosystem of packages
- **Community**: Large, active community
- **Enterprise-Ready**: Used by many large companies
- **Patterns**: Encourages best practices (SOLID, DDD)
- **Flexibility**: Can use Express or Fastify
- **Microservices**: Built-in microservices support

### Negative Consequences
- **Learning Curve**: Steeper learning curve than Express
- **Boilerplate**: More boilerplate than minimal frameworks
- **Opinionated**: Strong opinions on structure
- **Overhead**: More abstraction layers
- **Complexity**: Can be overkill for simple APIs

### Neutral Consequences
- **Angular-Inspired**: Architecture inspired by Angular
- **Decorator-Heavy**: Heavy use of decorators
- **Magic**: Some "magic" behind the scenes

## Alternatives Considered

### Alternative 1: Express.js
- **Description**: Use Express.js directly
- **Pros**:
  - Minimal, flexible
  - Large ecosystem
  - Easy to learn
  - Fast to prototype
  - Widely used
- **Cons**:
  - No structure enforced
  - Manual dependency management
  - No built-in patterns
  - Difficult to scale
  - Inconsistent codebases
  - No TypeScript-first design
- **Why Rejected**: Too minimal for enterprise application, no structure

### Alternative 2: Fastify
- **Description**: Use Fastify framework
- **Pros**:
  - Very fast performance
  - Schema-based validation
  - Plugin architecture
  - Good TypeScript support
  - Modern design
- **Cons**:
  - Less structure than NestJS
  - Smaller ecosystem
  - Manual architecture decisions
  - Less opinionated
  - Fewer built-in features
- **Why Rejected**: Less structure and patterns for large applications

### Alternative 3: Koa.js
- **Description**: Use Koa.js (by Express team)
- **Pros**:
  - Modern async/await
  - Lightweight
  - Flexible middleware
  - Clean API
- **Cons**:
  - Minimal structure
  - Smaller ecosystem
  - Manual setup required
  - No built-in patterns
  - Less TypeScript support
- **Why Rejected**: Too minimal, no structure for enterprise apps

### Alternative 4: Hapi.js
- **Description**: Use Hapi.js framework
- **Pros**:
  - Configuration-driven
  - Built-in validation
  - Plugin system
  - Good for large teams
- **Cons**:
  - Smaller community
  - Less modern
  - Verbose configuration
  - Declining popularity
  - Poor TypeScript support
- **Why Rejected**: Declining popularity, poor TypeScript support

### Alternative 5: LoopBack 4
- **Description**: Use LoopBack 4 framework
- **Pros**:
  - TypeScript-first
  - OpenAPI-driven
  - Built-in ORM
  - Good for APIs
- **Cons**:
  - Smaller community
  - Less flexible
  - Steeper learning curve
  - Fewer resources
  - Less popular
- **Why Rejected**: Smaller ecosystem, less popular than NestJS

### Alternative 6: AdonisJS
- **Description**: Use AdonisJS framework
- **Pros**:
  - Full-featured
  - TypeScript support
  - Built-in ORM
  - Laravel-inspired
- **Cons**:
  - Smaller community
  - Less popular in Node.js ecosystem
  - Fewer resources
  - Different patterns
- **Why Rejected**: Smaller ecosystem, less adoption

## References

- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS Best Practices](https://docs.nestjs.com/fundamentals/testing)
- [NestJS CQRS](https://docs.nestjs.com/recipes/cqrs)
- [NestJS Microservices](https://docs.nestjs.com/microservices/basics)
- [NestJS OpenAPI](https://docs.nestjs.com/openapi/introduction)
- [Why NestJS?](https://docs.nestjs.com/)
- [NestJS vs Express](https://blog.logrocket.com/nestjs-vs-express-js/)

