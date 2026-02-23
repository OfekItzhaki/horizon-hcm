import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateMaintenanceRequestCommand } from '../impl/create-maintenance-request.command';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(CreateMaintenanceRequestCommand)
export class CreateMaintenanceRequestHandler implements ICommandHandler<CreateMaintenanceRequestCommand> {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async execute(command: CreateMaintenanceRequestCommand) {
    const { buildingId, apartmentId, requesterId, title, description, category, priority } =
      command;

    // Verify building exists
    const building = await this.prisma.building.findUnique({
      where: { id: buildingId },
    });

    if (!building) {
      throw new NotFoundException('Building not found');
    }

    // Verify apartment exists if provided
    if (apartmentId) {
      const apartment = await this.prisma.apartment.findUnique({
        where: { id: apartmentId },
      });

      if (!apartment) {
        throw new NotFoundException('Apartment not found');
      }
    }

    // Create maintenance request
    const request = await this.prisma.maintenance_requests.create({
      data: {
        building_id: buildingId,
        apartment_id: apartmentId,
        requester_id: requesterId,
        title,
        description,
        category,
        priority,
        status: 'pending',
      },
      include: {
        building: true,
        apartment: true,
      },
    });

    // Log audit
    await this.audit_logs.log({
      action: 'maintenance_request.created',
      resourceType: 'MaintenanceRequest',
      resourceId: request.id,
      metadata: { title, category, priority },
    });

    // TODO: Send notifications to committee members if urgent
    // if (priority === 'urgent') {
    //   await this.notificationService.notifyCommitteeMembers(buildingId, request);
    // }

    return request;
  }
}
