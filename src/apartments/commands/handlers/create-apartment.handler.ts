import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateApartmentCommand } from '../impl/create-apartment.command';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(CreateApartmentCommand)
export class CreateApartmentHandler implements ICommandHandler<CreateApartmentCommand> {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
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
        building_id: buildingId,
        apartment_number: apartmentNumber,
        area_sqm: areaSqm,
        floor: floor,
        is_vacant: true,
      },
      include: { apartment_owners: true, tenants: true },
    });

    // Log audit
    await this.auditLog.log({
      action: 'apartment.created',
      resourceType: 'Apartment',
      resourceId: apartment.id,
      metadata: { apartmentNumber, buildingId },
    });

    return apartment;
  }
}
