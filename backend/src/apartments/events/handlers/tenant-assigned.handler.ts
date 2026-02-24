import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { TenantAssignedEvent } from '../tenant-assigned.event';
import { LoggerService } from '../../../common/logger/logger.service';

/**
 * Handles TenantAssignedEvent by logging the assignment.
 * 
 * In a production system, this could:
 * - Send welcome notification to tenant
 * - Notify apartment owner
 * - Update vacancy status
 * - Grant access permissions
 */
@EventsHandler(TenantAssignedEvent)
export class TenantAssignedHandler implements IEventHandler<TenantAssignedEvent> {
  constructor(private logger: LoggerService) {}

  async handle(event: TenantAssignedEvent) {
    this.logger.log(
      `Tenant assigned to apartment ${event.apartmentId}: resident ${event.residentId}`,
      'TenantAssignedHandler',
    );
  }
}
