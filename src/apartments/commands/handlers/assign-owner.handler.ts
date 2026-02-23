import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AssignOwnerCommand } from '../impl/assign-owner.command';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(AssignOwnerCommand)
export class AssignOwnerHandler implements ICommandHandler<AssignOwnerCommand> {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async execute(command: AssignOwnerCommand) {
    const { apartmentId, userId, ownershipShare, isPrimary } = command;

    // Check if apartment exists
    const apartment = await this.prisma.apartment.findUnique({
      where: { id: apartmentId },
      include: { owners: true },
    });

    if (!apartment) {
      throw new NotFoundException('Apartment not found');
    }

    // Check if user already owns this apartment
    const existingOwner = apartment.owners.find((o) => o.user_id === userId);
    if (existingOwner) {
      throw new BadRequestException('User already owns this apartment');
    }

    // Validate total ownership shares don't exceed 100%
    if (ownershipShare) {
      const totalShares = apartment.owners.reduce(
        (sum, owner) => sum + (owner.ownership_share?.toNumber() || 0),
        0,
      );

      if (totalShares + ownershipShare > 100) {
        throw new BadRequestException(
          `Total ownership shares would exceed 100% (current: ${totalShares}%, adding: ${ownershipShare}%)`,
        );
      }
    }

    // If setting as primary, unset other primary owners
    if (isPrimary) {
      await this.prisma.apartment_owners.updateMany({
        where: {
          apartment_id: apartmentId,
          is_primary: true,
        },
        data: {
          is_primary: false,
        },
      });
    }

    // Create owner record
    const owner = await this.prisma.apartment_owners.create({
      data: {
        apartment_id: apartmentId,
        user_id: userId,
        ownership_share: ownershipShare,
        is_primary: isPrimary || false,
      },
    });

    // Update apartment vacancy status
    await this.prisma.apartment.update({
      where: { id: apartmentId },
      data: { is_vacant: false },
    });

    // Log audit
    await this.audit_logs.log({
      action: 'apartment.owner_assigned',
      resourceType: 'Apartment',
      resourceId: apartmentId,
      metadata: { userId, ownershipShare, isPrimary },
    });

    return owner;
  }
}
