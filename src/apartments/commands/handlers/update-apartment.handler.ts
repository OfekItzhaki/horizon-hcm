import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateApartmentCommand } from '../impl/update-apartment.command';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(UpdateApartmentCommand)
export class UpdateApartmentHandler implements ICommandHandler<UpdateApartmentCommand> {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async execute(command: UpdateApartmentCommand) {
    const { apartmentId, areaSqm, floor, isVacant } = command;

    // Check if apartment exists
    const existing = await this.prisma.apartments.findUnique({
      where: { id: apartmentId },
    });

    if (!existing) {
      throw new NotFoundException('Apartment not found');
    }

    // Update apartment
    const apartment = await this.prisma.apartments.update({
      where: { id: apartmentId },
      data: {
        area_sqm: areaSqm !== undefined ? areaSqm : undefined,
        floor: floor !== undefined ? floor : undefined,
        is_vacant: isVacant !== undefined ? isVacant : undefined,
      },
      include: { apartment_apartment_owners: true, apartment_tenants: true },
    });

    // Log audit
    await this.auditLog.log({
      action: 'apartment.updated',
      resourceType: 'Apartment',
      resourceId: apartment.id,
      metadata: { changes: { areaSqm, floor, isVacant } },
    });

    return apartment;
  }
}
