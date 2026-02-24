import { BaseEvent } from './base.event';

/**
 * Interface for domain event handlers.
 * 
 * Event handlers react to domain events and perform side effects like:
 * - Sending notifications
 * - Updating read models
 * - Triggering workflows
 * - Integrating with external systems
 * 
 * @example
 * ```typescript
 * @EventsHandler(ApartmentCreatedEvent)
 * export class ApartmentCreatedHandler implements IEventHandler<ApartmentCreatedEvent> {
 *   async handle(event: ApartmentCreatedEvent) {
 *     // Send notification to building manager
 *     await this.notificationService.notify({
 *       message: `New apartment ${event.apartmentNumber} created`,
 *       buildingId: event.buildingId,
 *     });
 *   }
 * }
 * ```
 */
export interface IEventHandler<T extends BaseEvent = BaseEvent> {
  /**
   * Handles the domain event.
   * 
   * @param event - The domain event to handle
   */
  handle(event: T): Promise<void> | void;
}
