import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { DeleteApartmentCommand } from '../impl/delete-apartment.command';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(DeleteApartmentCommand)
export class DeleteApartmentHandler implements ICommandHandler<DeleteApartmentCommand> {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async execute(command: DeleteApartmentCommand) {
    const { apartmentId } = command;

    // Check if apartment exists
    const apartment = await this.prisma.apartments.findUnique({
      where: { id: apartmentId },
      include: {
        apartment_tenants: { where: { is_active: true } },
        apartment_owners: true,
      },
    });

    if (!apartment) {
      throw new NotFoundException('Apartment not found');
    }

    // Check for active tenants
    if (apartment.apartment_tenants.length > 0) {
      throw new BadRequestException('Cannot delete apartment with active tenants');
    }

    // Delete apartment (cascade will handle owners and tenants)
    await this.prisma.apartments.delete({
      where: { id: apartmentId },
    });

    // Log audit
    await this.auditLog.log({
      action: 'apartment.deleted',
      resourceType: 'Apartment',
      resourceId: apartmentId,
      metadata: { apartmentNumber: apartment.apartment_number },
    });

    return { success: true };
  }
}
