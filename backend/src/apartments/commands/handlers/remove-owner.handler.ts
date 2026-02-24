import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RemoveOwnerCommand } from '../impl/remove-owner.command';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(RemoveOwnerCommand)
export class RemoveOwnerHandler implements ICommandHandler<RemoveOwnerCommand> {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async execute(command: RemoveOwnerCommand) {
    const { apartmentId, ownerId } = command;

    // Check if owner exists
    const owner = await this.prisma.apartment_owners.findUnique({
      where: { id: ownerId },
    });

    if (!owner || owner.apartment_id !== apartmentId) {
      throw new NotFoundException('Owner not found for this apartment');
    }

    // Delete owner
    await this.prisma.apartment_owners.delete({
      where: { id: ownerId },
    });

    // Check if apartment should be marked vacant
    const remainingOwners = await this.prisma.apartment_owners.count({
      where: { apartment_id: apartmentId },
    });

    const activeTenants = await this.prisma.apartment_tenants.count({
      where: { apartment_id: apartmentId, is_active: true },
    });

    if (remainingOwners === 0 && activeTenants === 0) {
      await this.prisma.apartments.update({
        where: { id: apartmentId },
        data: { is_vacant: true },
      });
    }

    // Log audit
    await this.auditLog.log({
      action: 'apartment.owner_removed',
      resourceType: 'Apartment',
      resourceId: apartmentId,
      metadata: { ownerId, userId: owner.user_id },
    });

    return { success: true };
  }
}
