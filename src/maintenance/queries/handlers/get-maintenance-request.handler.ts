import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetMaintenanceRequestQuery } from '../impl/get-maintenance-request.query';

@QueryHandler(GetMaintenanceRequestQuery)
export class GetMaintenanceRequestHandler implements IQueryHandler<GetMaintenanceRequestQuery> {
  constructor(private prisma: PrismaService) {}

  async execute(query: GetMaintenanceRequestQuery) {
    const { requestId } = query;

    const request = await this.prisma.maintenance_requests.findUnique({
      where: { id: requestId },
      include: {
        buildings: true,
        apartments: true,
        announcement_comments: {
          orderBy: { created_at: 'asc' },
        },
        photos: {
          orderBy: { created_at: 'asc' },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Maintenance request not found');
    }

    return request;
  }
}
