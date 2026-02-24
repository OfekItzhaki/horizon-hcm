import { BaseEvent } from '../../common/events/base.event';

/**
 * Domain event emitted when a tenant is assigned to an apartment.
 * 
 * This event can trigger:
 * - Welcome notification to tenant
 * - Notification to apartment owner
 * - Update of vacancy status
 * - Audit log entry
 */
export class TenantAssignedEvent extends BaseEvent {
  constructor(
    public readonly apartmentId: string,
    public readonly buildingId: string,
    public readonly tenantId: string,
    public readonly residentId: string,
  ) {
    super('TenantAssigned');
  }

  protected getPayload(): Record<string, any> {
    return {
      apartmentId: this.apartmentId,
      buildingId: this.buildingId,
      tenantId: this.tenantId,
      residentId: this.residentId,
    };
  }
}
