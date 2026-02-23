import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AssignTenantCommand } from '../impl/assign-tenant.command';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(AssignTenantCommand)
export class AssignTenantHandler implements ICommandHandler<AssignTenantCommand> {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async execute(command: AssignTenantCommand) {
    const { apartmentId, userId, moveInDate } = command;

    // Check if apartment exists
    const apartment = await this.prisma.apartment.findUnique({
      where: { id: apartmentId },
    });

    if (!apartment) {
      throw new NotFoundException('Apartment not found');
    }

    // Check if user already has an active tenancy for this apartment
    const existingTenant = await this.prisma.apartment_tenants.findFirst({
      where: {
        apartment_id: apartmentId,
        user_id: userId,
        is_active: true,
      },
    });

    if (existingTenant) {
      throw new BadRequestException('User already has an active tenancy for this apartment');
    }

    // Create tenant record
    const tenant = await this.prisma.apartment_tenants.create({
      data: {
        apartment_id: apartmentId,
        user_id: userId,
        move_in_date: moveInDate || new Date(),
        is_active: true,
      },
    });

    // Update apartment vacancy status
    await this.prisma.apartment.update({
      where: { id: apartmentId },
      data: { is_vacant: false },
    });

    // Log audit
    await this.audit_logs.log({
      action: 'apartment.tenant_assigned',
      resourceType: 'Apartment',
      resourceId: apartmentId,
      metadata: { userId, moveInDate },
    });

    return tenant;
  }
}
