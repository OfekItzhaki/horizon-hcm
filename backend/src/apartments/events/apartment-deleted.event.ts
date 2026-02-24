import { BaseEvent } from '../../common/events/base.event';

/**
 * Domain event emitted when an apartment is deleted.
 * 
 * This event can trigger:
 * - Notification to building manager
 * - Cleanup of related data
 * - Update of building statistics
 * - Audit log entry
 */
export class ApartmentDeletedEvent extends BaseEvent {
  constructor(
    public readonly apartmentId: string,
    public readonly buildingId: string,
    public readonly apartmentNumber: string,
  ) {
    super('ApartmentDeleted');
  }

  protected getPayload(): Record<string, any> {
    return {
      apartmentId: this.apartmentId,
      buildingId: this.buildingId,
      apartmentNumber: this.apartmentNumber,
    };
  }
}
