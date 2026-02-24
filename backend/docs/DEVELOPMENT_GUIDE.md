# Development Guide

**Last Updated**: 2026-02-24  
**Audience**: Developers working on Horizon-HCM

This guide helps you understand how to add features, write tests, and follow best practices in the Horizon-HCM codebase.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Architecture Overview](#architecture-overview)
3. [Adding a New Module](#adding-a-new-module)
4. [Adding a New Endpoint](#adding-a-new-endpoint)
5. [Writing Tests](#writing-tests)
6. [Common Patterns](#common-patterns)
7. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
8. [Code Style Guide](#code-style-guide)

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL (via Supabase)
- Redis (localhost:6379)
- Firebase account (for authentication)

### Setup

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

The backend runs on `http://localhost:3001`.

---

## Architecture Overview

Horizon-HCM follows **CQRS (Command Query Responsibility Segregation)** pattern:

- **Commands**: Modify state (Create, Update, Delete)
- **Queries**: Read state (Get, List, Search)
- **Handlers**: Execute commands/queries
- **DTOs**: Data Transfer Objects for validation

### Directory Structure

```
src/
├── {module}/
│   ├── commands/
│   │   ├── handlers/     # Command handlers
│   │   └── impl/         # Command classes
│   ├── queries/
│   │   ├── handlers/     # Query handlers
│   │   └── impl/         # Query classes
│   ├── dto/              # Data Transfer Objects
│   ├── __tests__/        # Unit and property tests
│   └── {module}.controller.ts
├── common/               # Shared utilities
│   ├── guards/          # Authorization guards
│   ├── interceptors/    # Request/response interceptors
│   ├── services/        # Shared services
│   └── middleware/      # Custom middleware
└── prisma/              # Database schema and migrations
```

---

## Adding a New Module

### Step 1: Create Module Structure

```bash
mkdir -p src/my-module/{commands/{handlers,impl},queries/{handlers,impl},dto,__tests__}
```

### Step 2: Create Module File

```typescript
// src/my-module/my-module.module.ts
import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MyModuleController } from './my-module.controller';
import { CommandHandlers } from './commands/handlers';
import { QueryHandlers } from './queries/handlers';

@Module({
  imports: [CqrsModule],
  controllers: [MyModuleController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class MyModuleModule {}
```

### Step 3: Register in App Module

```typescript
// src/app.module.ts
import { MyModuleModule } from './my-module/my-module.module';

@Module({
  imports: [
    // ... other modules
    MyModuleModule,
  ],
})
export class AppModule {}
```

---

## Adding a New Endpoint

### Step 1: Create DTO

```typescript
// src/my-module/dto/create-item.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

/**
 * DTO for creating a new item.
 * 
 * @example
 * ```typescript
 * const dto: CreateItemDto = {
 *   name: 'My Item',
 *   description: 'Item description'
 * };
 * ```
 */
export class CreateItemDto {
  @ApiProperty({ description: 'Item name', example: 'My Item' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Item description', example: 'Description' })
  @IsString()
  description: string;
}
```

### Step 2: Create Command/Query

```typescript
// src/my-module/commands/impl/create-item.command.ts
export class CreateItemCommand {
  constructor(
    public readonly name: string,
    public readonly description: string,
  ) {}
}
```

### Step 3: Create Handler

```typescript
// src/my-module/commands/handlers/create-item.handler.ts
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateItemCommand } from '../impl/create-item.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { generateId } from '../../../common/utils/id-generator';

/**
 * Command handler that creates a new item.
 * 
 * @example
 * ```typescript
 * const command = new CreateItemCommand('My Item', 'Description');
 * const item = await commandBus.execute(command);
 * ```
 */
@CommandHandler(CreateItemCommand)
export class CreateItemHandler implements ICommandHandler<CreateItemCommand> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(command: CreateItemCommand) {
    const { name, description } = command;

    const item = await this.prisma.items.create({
      data: {
        id: generateId(),
        name,
        description,
        created_at: new Date(),
      },
    });

    return item;
  }
}
```

### Step 4: Create Controller Endpoint

```typescript
// src/my-module/my-module.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateItemDto } from './dto/create-item.dto';
import { CreateItemCommand } from './commands/impl/create-item.command';

@ApiTags('My Module')
@Controller('my-module')
export class MyModuleController {
  constructor(private readonly commandBus: CommandBus) {}

  @Post()
  @ApiOperation({ summary: 'Create a new item' })
  async createItem(@Body() dto: CreateItemDto) {
    const command = new CreateItemCommand(dto.name, dto.description);
    return this.commandBus.execute(command);
  }
}
```

### Step 5: Export Handler

```typescript
// src/my-module/commands/handlers/index.ts
import { CreateItemHandler } from './create-item.handler';

export const CommandHandlers = [CreateItemHandler];
```

---

## Writing Tests

### Unit Tests

```typescript
// src/my-module/__tests__/create-item.handler.spec.ts
import { Test } from '@nestjs/testing';
import { CreateItemHandler } from '../commands/handlers/create-item.handler';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateItemCommand } from '../commands/impl/create-item.command';

describe('CreateItemHandler', () => {
  let handler: CreateItemHandler;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        CreateItemHandler,
        {
          provide: PrismaService,
          useValue: {
            items: {
              create: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    handler = module.get<CreateItemHandler>(CreateItemHandler);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should create an item', async () => {
    const command = new CreateItemCommand('Test Item', 'Description');
    const mockItem = { id: '123', name: 'Test Item', description: 'Description' };

    jest.spyOn(prisma.items, 'create').mockResolvedValue(mockItem as any);

    const result = await handler.execute(command);

    expect(result).toEqual(mockItem);
    expect(prisma.items.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Test Item',
        description: 'Description',
      }),
    });
  });
});
```

### Property-Based Tests

```typescript
// src/my-module/__tests__/properties/items.properties.spec.ts
import * as fc from 'fast-check';
import { CreateItemHandler } from '../../commands/handlers/create-item.handler';

describe('Item Properties', () => {
  it('Property: Item name should always be stored as provided', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string({ minLength: 1, maxLength: 100 }), async (name) => {
        // Test that name is preserved exactly
        const handler = new CreateItemHandler(mockPrisma);
        const command = new CreateItemCommand(name, 'Description');
        const result = await handler.execute(command);
        
        expect(result.name).toBe(name);
      }),
    );
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- create-item.handler.spec.ts

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch
```

---

## Common Patterns

### 1. Caching Pattern

```typescript
async execute(query: GetItemQuery) {
  const cacheKey = `item:${query.itemId}`;
  
  // Check cache first
  const cached = await this.cache.get(cacheKey);
  if (cached) return cached;
  
  // Fetch from database
  const item = await this.prisma.items.findUnique({
    where: { id: query.itemId },
  });
  
  // Cache for 5 minutes
  await this.cache.set(cacheKey, item, 300);
  
  return item;
}
```

### 2. Pagination Pattern

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

### 3. Authorization Pattern

```typescript
@UseGuards(CommitteeMemberGuard)
@Post('buildings/:buildingId/items')
async createItem(@Param('buildingId') buildingId: string, @Body() dto: CreateItemDto) {
  // Only committee members can access this endpoint
}
```

### 4. Audit Logging Pattern

```typescript
await this.auditLog.log({
  userId: user.id,
  action: 'item.created',
  resourceType: 'Item',
  resourceId: item.id,
  metadata: { name: item.name },
});
```

### 5. Error Handling Pattern

```typescript
if (!item) {
  throw new NotFoundException('Item not found');
}

if (item.status === 'locked') {
  throw new BadRequestException('Cannot modify locked item');
}
```

---

## Anti-Patterns to Avoid

### ❌ Don't: Direct Database Access in Controllers

```typescript
// BAD
@Get(':id')
async getItem(@Param('id') id: string) {
  return this.prisma.items.findUnique({ where: { id } });
}
```

### ✅ Do: Use CQRS Pattern

```typescript
// GOOD
@Get(':id')
async getItem(@Param('id') id: string) {
  const query = new GetItemQuery(id);
  return this.queryBus.execute(query);
}
```

### ❌ Don't: Hardcode Values

```typescript
// BAD
const cacheTime = 300; // What does 300 mean?
```

### ✅ Do: Use Constants

```typescript
// GOOD
const CACHE_TTL_SECONDS = 300; // 5 minutes
```

### ❌ Don't: Ignore Validation

```typescript
// BAD
@Post()
async create(@Body() data: any) {
  return this.service.create(data);
}
```

### ✅ Do: Use DTOs with Validation

```typescript
// GOOD
@Post()
async create(@Body() dto: CreateItemDto) {
  const command = new CreateItemCommand(dto.name, dto.description);
  return this.commandBus.execute(command);
}
```

### ❌ Don't: Mix Business Logic in Controllers

```typescript
// BAD
@Post()
async create(@Body() dto: CreateItemDto) {
  const item = await this.prisma.items.create({ data: dto });
  await this.cache.invalidate('items:*');
  await this.auditLog.log({ action: 'created', resourceId: item.id });
  return item;
}
```

### ✅ Do: Keep Controllers Thin

```typescript
// GOOD
@Post()
async create(@Body() dto: CreateItemDto) {
  const command = new CreateItemCommand(dto.name, dto.description);
  return this.commandBus.execute(command);
}
```

---

## Code Style Guide

### Naming Conventions

- **Files**: kebab-case (`create-item.handler.ts`)
- **Classes**: PascalCase (`CreateItemHandler`)
- **Functions**: camelCase (`executeCommand`)
- **Constants**: UPPER_SNAKE_CASE (`CACHE_TTL_SECONDS`)
- **Interfaces**: PascalCase with `I` prefix (`ICommandHandler`)

### TypeScript Guidelines

```typescript
// Use explicit types
function getItem(id: string): Promise<Item> {
  // ...
}

// Use readonly for immutable properties
class CreateItemCommand {
  constructor(
    public readonly name: string,
    public readonly description: string,
  ) {}
}

// Use async/await instead of promises
async function fetchData() {
  const data = await this.service.getData();
  return data;
}
```

### JSDoc Comments

Add JSDoc to all exported classes and public methods:

```typescript
/**
 * Service for managing items.
 * 
 * Provides CRUD operations with caching and audit logging.
 * 
 * @example
 * ```typescript
 * const item = await itemService.create({ name: 'Test' });
 * ```
 */
@Injectable()
export class ItemService {
  /**
   * Creates a new item.
   * 
   * @param data - Item creation data
   * @returns The created item
   * @throws {BadRequestException} When validation fails
   */
  async create(data: CreateItemDto): Promise<Item> {
    // ...
  }
}
```

### Import Organization

```typescript
// 1. External dependencies
import { Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

// 2. Internal dependencies (absolute paths)
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';

// 3. Relative imports
import { CreateItemCommand } from '../impl/create-item.command';
```

### Error Messages

```typescript
// Be specific and actionable
throw new BadRequestException('Apartment 12A already exists in this building');

// Not generic
throw new BadRequestException('Invalid input');
```

---

## Additional Resources

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [API_CONVENTIONS.md](./API_CONVENTIONS.md) - API design standards
- [Prisma Documentation](https://www.prisma.io/docs)
- [NestJS Documentation](https://docs.nestjs.com)
- [CQRS Pattern](https://docs.nestjs.com/recipes/cqrs)

---

## Getting Help

- Check existing code in similar modules for examples
- Review test files to understand expected behavior
- Ask team members for code reviews
- Consult the architecture documentation

---

**Happy Coding! 🚀**
