import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { OwnerAssignedEvent } from '../owner-assigned.event';
import { LoggerService } from '../../../common/logger/logger.service';

/**
 * Handles OwnerAssignedEvent by logging the assignment.
 * 
 * In a production system, this could:
 * - Send welcome notification to new owner
 * - Update building ownership records
 * - Grant access permissions
 * - Trigger onboarding workflow
 */
@EventsHandler(OwnerAssignedEvent)
export class OwnerAssignedHandler implements IEventHandler<OwnerAssignedEvent> {
  constructor(private logger: LoggerService) {}

  async handle(event: OwnerAssignedEvent) {
    this.logger.log(
      `Owner assigned to apartment ${event.apartmentId}: resident ${event.residentId} with ${event.ownershipShare}% share`,
      'OwnerAssignedHandler',
    );

    // Future: Send welcome notification
    // await this.notificationService.notify({
    //   type: 'owner_assigned',
    //   residentId: event.residentId,
    //   message: `You have been assigned as owner of apartment with ${event.ownershipShare}% ownership`,
    // });
  }
}
