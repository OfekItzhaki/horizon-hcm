/**
 * Base class for all domain events.
 * 
 * Domain events represent something that happened in the domain that domain experts care about.
 * They are immutable and always represent past occurrences.
 * 
 * @example
 * ```typescript
 * export class ApartmentCreatedEvent extends BaseEvent {
 *   constructor(
 *     public readonly apartmentId: string,
 *     public readonly buildingId: string,
 *     public readonly apartmentNumber: string,
 *   ) {
 *     super('ApartmentCreated');
 *   }
 * }
 * ```
 */
export abstract class BaseEvent {
  /**
   * Unique identifier for this event instance.
   */
  public readonly eventId: string;

  /**
   * Timestamp when the event occurred.
   */
  public readonly occurredAt: Date;

  /**
   * Version of the event schema (for event evolution).
   */
  public readonly version: number;

  constructor(
    /**
     * Name of the event (e.g., 'ApartmentCreated', 'OwnerAssigned').
     */
    public readonly eventName: string,
    version: number = 1,
  ) {
    this.eventId = this.generateEventId();
    this.occurredAt = new Date();
    this.version = version;
  }

  /**
   * Generates a unique event ID.
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Converts the event to a plain object for serialization.
   */
  toJSON(): Record<string, any> {
    return {
      eventId: this.eventId,
      eventName: this.eventName,
      occurredAt: this.occurredAt.toISOString(),
      version: this.version,
      ...this.getPayload(),
    };
  }

  /**
   * Override this method to provide event-specific payload.
   */
  protected getPayload(): Record<string, any> {
    return {};
  }
}
