import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateMaintenanceStatusCommand } from '../impl/update-maintenance-status.command';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(UpdateMaintenanceStatusCommand)
export class UpdateMaintenanceStatusHandler
  implements ICommandHandler<UpdateMaintenanceStatusCommand>
{
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async execute(command: UpdateMaintenanceStatusCommand) {
    const { requestId, status } = command;

    // Check if request exists
    const existing = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
    });

    if (!existing) {
      throw new NotFoundException('Maintenance request not found');
    }

    // Update status
    const request = await this.prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        status,
        completion_date: status === 'completed' ? new Date() : undefined,
      },
      include: {
        building: true,
        apartment: true,
      },
    });

    // Log audit
    await this.auditLog.log({
      action: 'maintenance_request.status_updated',
      resourceType: 'MaintenanceRequest',
      resourceId: requestId,
      metadata: { oldStatus: existing.status, newStatus: status },
    });

    // TODO: Send notification to requester
    // await this.notificationService.notifyStatusChange(request);

    return request;
  }
}
