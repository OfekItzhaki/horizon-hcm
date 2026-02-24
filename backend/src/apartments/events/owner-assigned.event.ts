import { BaseEvent } from '../../common/events/base.event';

/**
 * Domain event emitted when an owner is assigned to an apartment.
 * 
 * This event can trigger:
 * - Welcome email to new owner
 * - Update of building member list
 * - Notification to building committee
 * - Cache invalidation
 */
export class OwnerAssignedEvent extends BaseEvent {
  constructor(
    public readonly apartmentId: string,
    public readonly userId: string,
    public readonly ownershipShare?: number,
    public readonly isPrimary?: boolean,
  ) {
    super('OwnerAssigned');
  }

  protected getPayload(): Record<string, any> {
    return {
      apartmentId: this.apartmentId,
      userId: this.userId,
      ownershipShare: this.ownershipShare,
      isPrimary: this.isPrimary,
    };
  }
}
