import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ApartmentCreatedEvent } from '../apartment-created.event';
import { LoggerService } from '../../../common/logger/logger.service';

/**
 * Handles ApartmentCreatedEvent by logging the creation.
 * 
 * In a production system, this could:
 * - Send notification to building manager
 * - Update building statistics
 * - Trigger analytics tracking
 * - Create default apartment settings
 */
@EventsHandler(ApartmentCreatedEvent)
export class ApartmentCreatedHandler implements IEventHandler<ApartmentCreatedEvent> {
  constructor(private logger: LoggerService) {}

  async handle(event: ApartmentCreatedEvent) {
    this.logger.log(
      `Apartment created: ${event.apartmentNumber} in building ${event.buildingId}`,
      'ApartmentCreatedHandler',
    );

    // Future: Send notification to building manager
    // await this.notificationService.notify({
    //   type: 'apartment_created',
    //   buildingId: event.buildingId,
    //   message: `New apartment ${event.apartmentNumber} has been created`,
    // });
  }
}
