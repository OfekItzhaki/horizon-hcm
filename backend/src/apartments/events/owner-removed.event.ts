import { BaseEvent } from '../../common/events/base.event';

/**
 * Domain event emitted when an owner is removed from an apartment.
 * 
 * This event can trigger:
 * - Notification to removed owner
 * - Notification to building manager
 * - Update of ownership records
 * - Audit log entry
 */
export class OwnerRemovedEvent extends BaseEvent {
  constructor(
    public readonly apartmentId: string,
    public readonly buildingId: string,
    public readonly ownerId: string,
    public readonly residentId: string,
  ) {
    super('OwnerRemoved');
  }

  protected getPayload(): Record<string, any> {
    return {
      apartmentId: this.apartmentId,
      buildingId: this.buildingId,
      ownerId: this.ownerId,
      residentId: this.residentId,
    };
  }
}
