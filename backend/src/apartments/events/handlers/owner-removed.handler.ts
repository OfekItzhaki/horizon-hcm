import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { OwnerRemovedEvent } from '../owner-removed.event';
import { LoggerService } from '../../../common/logger/logger.service';

/**
 * Handles OwnerRemovedEvent by logging the removal.
 * 
 * In a production system, this could:
 * - Notify removed owner
 * - Notify building manager
 * - Revoke access permissions
 * - Update ownership records
 */
@EventsHandler(OwnerRemovedEvent)
export class OwnerRemovedHandler implements IEventHandler<OwnerRemovedEvent> {
  constructor(private logger: LoggerService) {}

  async handle(event: OwnerRemovedEvent) {
    this.logger.log(
      `Owner removed from apartment ${event.apartmentId}: resident ${event.residentId}`,
      'OwnerRemovedHandler',
    );
  }
}
