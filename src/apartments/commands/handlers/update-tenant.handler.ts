import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateTenantCommand } from '../impl/update-tenant.command';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(UpdateTenantCommand)
export class UpdateTenantHandler implements ICommandHandler<UpdateTenantCommand> {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async execute(command: UpdateTenantCommand) {
    const { tenantId, moveOutDate, isActive } = command;

    // Check if tenant exists
    const tenant = await this.prisma.apartment_tenants.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Update tenant
    const updatedTenant = await this.prisma.apartment_tenants.update({
      where: { id: tenantId },
      data: {
        move_out_date: moveOutDate !== undefined ? moveOutDate : undefined,
        is_active: isActive !== undefined ? isActive : undefined,
      },
    });

    // Check if apartment should be marked vacant
    if (isActive === false) {
      const activeTenants = await this.prisma.apartment_tenants.count({
        where: {
          apartment_id: tenant.apartment_id,
          is_active: true,
        },
      });

      const owners = await this.prisma.apartment_owners.count({
        where: { apartment_id: tenant.apartment_id },
      });

      if (activeTenants === 0 && owners === 0) {
        await this.prisma.apartment.update({
          where: { id: tenant.apartment_id },
          data: { is_vacant: true },
        });
      }
    }

    // Log audit
    await this.auditLog.log({
      action: 'apartment.tenant_updated',
      resourceType: 'Apartment',
      resourceId: tenant.apartment_id,
      metadata: { tenantId, moveOutDate, isActive },
    });

    return updatedTenant;
  }
}
