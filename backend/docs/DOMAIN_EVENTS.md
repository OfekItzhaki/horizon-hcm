# Domain Events Guide

**Last Updated**: 2026-02-24  
**Version**: 1.0

Guide to using domain events in Horizon-HCM.

---

## What are Domain Events?

Domain events represent something significant that happened in the domain. They are:
- **Immutable**: Once created, they cannot be changed
- **Past tense**: Named after what happened (e.g., `ApartmentCreated`, not `CreateApartment`)
- **Domain-focused**: Represent business concepts, not technical operations

---

## Architecture

```
Command Handler
    ├── Execute business logic
    ├── Persist changes to database
    └── Emit domain event(s)
            ↓
        Event Bus
            ↓
    Event Handlers (0 or more)
        ├── Send notifications
        ├── Update read models
        ├── Trigger workflows
        └── Integrate with external systems
```

---

## Creating Domain Events

### 1. Define the Event

```typescript
// src/apartments/events/apartment-created.event.ts
import { BaseEvent } from '../../common/events/base.event';

export class ApartmentCreatedEvent extends BaseEvent {
  constructor(
    public readonly apartmentId: string,
    public readonly buildingId: string,
    public readonly apartmentNumber: string,
  ) {
    super('ApartmentCreated');
  }

  protected getPayload(): Record<string, any> {
    return {
      apartmentId: this.apartmentId,
      buildingId: this.buildingId,
      apartmentNumber: this.apartmentNumber,
    };
  }
}
```

### 2. Emit from Command Handler

```typescript
import { EventBus } from '@nestjs/cqrs';
import { ApartmentCreatedEvent } from '../../events/apartment-created.event';

@CommandHandler(CreateApartmentCommand)
export class CreateApartmentHandler {
  constructor(
    private prisma: PrismaService,
    private eventBus: EventBus, // Inject EventBus
  ) {}

  async execute(command: CreateApartmentCommand) {
    // 1. Execute business logic
    const apartment = await this.prisma.apartments.create({...});

    // 2. Emit domain event
    this.eventBus.publish(
      new ApartmentCreatedEvent(
        apartment.id,
        apartment.building_id,
        apartment.apartment_number,
      ),
    );

    return apartment;
  }
}
```

### 3. Handle the Event (Optional)

```typescript
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ApartmentCreatedEvent } from '../events/apartment-created.event';

@EventsHandler(ApartmentCreatedEvent)
export class ApartmentCreatedHandler implements IEventHandler<ApartmentCreatedEvent> {
  constructor(private notificationService: NotificationService) {}

  async handle(event: ApartmentCreatedEvent) {
    // Send notification to building manager
    await this.notificationService.notify({
      message: `New apartment ${event.apartmentNumber} created`,
      buildingId: event.buildingId,
    });
  }
}
```

---

## Existing Domain Events

### Apartments Module

| Event | When Emitted | Use Cases |
|-------|--------------|-----------|
| `ApartmentCreatedEvent` | New apartment created | Notify manager, update stats |
| `OwnerAssignedEvent` | Owner assigned to apartment | Welcome email, update member list |

---

## Best Practices

### 1. Keep Events Simple

Events should contain only the data needed to understand what happened:

```typescript
// Good
export class OwnerAssignedEvent extends BaseEvent {
  constructor(
    public readonly apartmentId: string,
    public readonly userId: string,
  ) {
    super('OwnerAssigned');
  }
}

// Bad - too much data
export class OwnerAssignedEvent extends BaseEvent {
  constructor(
    public readonly apartment: Apartment, // Don't include full entities
    public readonly user: User,
    public readonly timestamp: Date, // Already in BaseEvent
  ) {
    super('OwnerAssigned');
  }
}
```

### 2. Use Past Tense

```typescript
// Good
ApartmentCreatedEvent
OwnerAssignedEvent
PaymentProcessedEvent

// Bad
CreateApartmentEvent
AssignOwnerEvent
ProcessPaymentEvent
```

### 3. One Event Per Significant Change

```typescript
// Good - separate events
this.eventBus.publish(new ApartmentCreatedEvent(...));
this.eventBus.publish(new OwnerAssignedEvent(...));

// Bad - combined event
this.eventBus.publish(new ApartmentCreatedWithOwnerEvent(...));
```

### 4. Don't Depend on Event Handlers

Command handlers should complete successfully even if event handlers fail:

```typescript
// Good - fire and forget
this.eventBus.publish(event);
return result;

// Bad - waiting for handlers
await this.eventBus.publish(event);
return result;
```

### 5. Handle Events Idempotently

Event handlers may be called multiple times:

```typescript
async handle(event: OwnerAssignedEvent) {
  // Check if already processed
  const existing = await this.prisma.notifications.findUnique({
    where: { eventId: event.eventId },
  });

  if (existing) {
    return; // Already processed
  }

  // Process event
  await this.notificationService.send(...);
}
```

---

## Testing Events

### Test Event Emission

```typescript
it('should emit ApartmentCreatedEvent', async () => {
  const eventBus = { publish: jest.fn() };
  const handler = new CreateApartmentHandler(prisma, auditLog, eventBus as any);

  await handler.execute(command);

  expect(eventBus.publish).toHaveBeenCalledWith(
    expect.objectContaining({
      eventName: 'ApartmentCreated',
      apartmentId: expect.any(String),
    }),
  );
});
```

### Test Event Handlers

```typescript
it('should send notification when apartment created', async () => {
  const notificationService = { notify: jest.fn() };
  const handler = new ApartmentCreatedHandler(notificationService as any);

  const event = new ApartmentCreatedEvent('apt-123', 'bld-456', '12A');
  await handler.handle(event);

  expect(notificationService.notify).toHaveBeenCalledWith({
    message: 'New apartment 12A created',
    buildingId: 'bld-456',
  });
});
```

---

## Event Sourcing (Future)

Domain events can be used for event sourcing:

1. **Store events** instead of current state
2. **Rebuild state** by replaying events
3. **Time travel** to any point in history
4. **Audit trail** of all changes

This is not currently implemented but the event infrastructure supports it.

---

## Additional Resources

- [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [NestJS CQRS](https://docs.nestjs.com/recipes/cqrs)

---

**Remember**: Events represent what happened, not what should happen! 📢
