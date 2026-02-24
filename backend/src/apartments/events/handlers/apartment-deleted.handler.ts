import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ApartmentDeletedEvent } from '../apartment-deleted.event';
import { LoggerService } from '../../../common/logger/logger.service';

/**
 * Handles ApartmentDeletedEvent by logging the deletion.
 * 
 * In a production system, this could:
 * - Notify building manager
 * - Clean up related data
 * - Archive apartment records
 * - Update building statistics
 */
@EventsHandler(ApartmentDeletedEvent)
export class ApartmentDeletedHandler implements IEventHandler<ApartmentDeletedEvent> {
  constructor(private logger: LoggerService) {}

  async handle(event: ApartmentDeletedEvent) {
    this.logger.log(
      `Apartment deleted: ${event.apartmentNumber} (${event.apartmentId}) from building ${event.buildingId}`,
      'ApartmentDeletedHandler',
    );
  }
}
