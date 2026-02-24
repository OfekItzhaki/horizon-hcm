import { BaseEvent } from '../../common/events/base.event';

/**
 * Domain event emitted when a new apartment is created.
 * 
 * This event can trigger:
 * - Notification to building manager
 * - Update of building statistics
 * - Audit log entry
 * - Analytics tracking
 */
export class ApartmentCreatedEvent extends BaseEvent {
  constructor(
    public readonly apartmentId: string,
    public readonly buildingId: string,
    public readonly apartmentNumber: string,
    public readonly areaSqm?: number,
    public readonly floor?: number,
  ) {
    super('ApartmentCreated');
  }

  protected getPayload(): Record<string, any> {
    return {
      apartmentId: this.apartmentId,
      buildingId: this.buildingId,
      apartmentNumber: this.apartmentNumber,
      areaSqm: this.areaSqm,
      floor: this.floor,
    };
  }
}
