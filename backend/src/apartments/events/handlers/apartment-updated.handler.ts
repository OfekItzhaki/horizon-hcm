import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ApartmentUpdatedEvent } from '../apartment-updated.event';
import { LoggerService } from '../../../common/logger/logger.service';

/**
 * Handles ApartmentUpdatedEvent by logging the changes.
 * 
 * In a production system, this could:
 * - Notify apartment owners/tenants of changes
 * - Update search indexes
 * - Trigger recalculations (e.g., if area changed)
 */
@EventsHandler(ApartmentUpdatedEvent)
export class ApartmentUpdatedHandler implements IEventHandler<ApartmentUpdatedEvent> {
  constructor(private logger: LoggerService) {}

  async handle(event: ApartmentUpdatedEvent) {
    this.logger.log(
      `Apartment updated: ${event.apartmentId} - Changes: ${JSON.stringify(event.changes)}`,
      'ApartmentUpdatedHandler',
    );
  }
}
