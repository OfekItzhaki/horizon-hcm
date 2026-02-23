import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AssignMaintenanceRequestCommand } from '../impl/assign-maintenance-request.command';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(AssignMaintenanceRequestCommand)
export class AssignMaintenanceRequestHandler implements ICommandHandler<AssignMaintenanceRequestCommand> {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async execute(command: AssignMaintenanceRequestCommand) {
    const { requestId, assignedTo } = command;

    // Check if request exists
    const existing = await this.prisma.maintenance_requests.findUnique({
      where: { id: requestId },
    });

    if (!existing) {
      throw new NotFoundException('Maintenance request not found');
    }

    // Assign request
    const request = await this.prisma.maintenance_requests.update({
      where: { id: requestId },
      data: {
        assigned_to: assignedTo,
        status: 'in_progress',
      },
      include: {
        building: true,
        apartment: true,
      },
    });

    // Log audit
    await this.auditLog.log({
      action: 'maintenance_request.assigned',
      resourceType: 'MaintenanceRequest',
      resourceId: requestId,
      metadata: { assignedTo },
    });

    // TODO: Send notification to assigned person
    // await this.notificationService.notifyAssignment(request, assignedTo);

    return request;
  }
}
