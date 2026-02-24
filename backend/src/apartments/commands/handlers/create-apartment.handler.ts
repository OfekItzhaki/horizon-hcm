import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateApartmentCommand } from '../impl/create-apartment.command';
import { AuditLogService } from '../../../common/services/audit-log.service';
import { generateId } from '../../../common/utils/id-generator';
import { ApartmentCreatedEvent } from '../../events/apartment-created.event';

/**
 * Command handler that creates a new apartment in a building.
 * 
 * Validates that the apartment number is unique within the building before creation.
 * New apartments are marked as vacant by default. Logs the creation in the audit trail.
 * Emits ApartmentCreatedEvent for downstream processing.
 * 
 * @example
 * ```typescript
 * const command = new CreateApartmentCommand('building-123', '12A', 85.5, 3);
 * const apartment = await commandBus.execute(command);
 * ```
 */
@CommandHandler(CreateApartmentCommand)
export class CreateApartmentHandler implements ICommandHandler<CreateApartmentCommand> {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
    private eventBus: EventBus,
  ) {}

  async execute(command: CreateApartmentCommand) {
    const { buildingId, apartmentNumber, areaSqm, floor } = command;

    // Check if apartment number already exists in building
    const existing = await this.prisma.apartments.findUnique({
      where: {
        building_id_apartment_number: {
          building_id: buildingId,
          apartment_number: apartmentNumber,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(`Apartment ${apartmentNumber} already exists in this building`);
    }

    // Create apartment
    const apartment = await this.prisma.apartments.create({
      data: {
        id: generateId(),
        building_id: buildingId,
        apartment_number: apartmentNumber,
        area_sqm: areaSqm,
        floor: floor,
        is_vacant: true,
        updated_at: new Date(),
      },
      include: { apartment_owners: true, apartment_tenants: true },
    });

    // Log audit
    await this.auditLog.log({
      action: 'apartment.created',
      resourceType: 'Apartment',
      resourceId: apartment.id,
      metadata: { apartmentNumber, buildingId },
    });

    // Emit domain event
    this.eventBus.publish(
      new ApartmentCreatedEvent(
        apartment.id,
        buildingId,
        apartmentNumber,
        areaSqm,
        floor,
      ),
    );

    return apartment;
  }
}
