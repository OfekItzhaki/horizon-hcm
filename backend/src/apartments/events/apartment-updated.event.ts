import { BaseEvent } from '../../common/events/base.event';

/**
 * Domain event emitted when an apartment is updated.
 * 
 * This event can trigger:
 * - Notification to apartment owners/tenants
 * - Update of building statistics
 * - Audit log entry
 */
export class ApartmentUpdatedEvent extends BaseEvent {
  constructor(
    public readonly apartmentId: string,
    public readonly buildingId: string,
    public readonly changes: Record<string, any>,
  ) {
    super('ApartmentUpdated');
  }

  protected getPayload(): Record<string, any> {
    return {
      apartmentId: this.apartmentId,
      buildingId: this.buildingId,
      changes: this.changes,
    };
  }
}
