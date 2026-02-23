import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../prisma/prisma.service';
import { ListMaintenanceRequestsQuery } from '../impl/list-maintenance-requests.query';

@QueryHandler(ListMaintenanceRequestsQuery)
export class ListMaintenanceRequestsHandler implements IQueryHandler<ListMaintenanceRequestsQuery> {
  constructor(private prisma: PrismaService) {}

  async execute(query: ListMaintenanceRequestsQuery) {
    const { buildingId, apartmentId, status, category, priority, page, limit } = query;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (buildingId) where.building_id = buildingId;
    if (apartmentId) where.apartment_id = apartmentId;
    if (status) where.status = status;
    if (category) where.category = category;
    if (priority) where.priority = priority;

    const [requests, total] = await Promise.all([
      this.prisma.maintenance_requests.findMany({
        where,
        skip,
        take: limit,
        include: {
          building: {
            select: {
              id: true,
              name: true,
              address_line: true,
            },
          },
          apartment: {
            select: {
              id: true,
              apartment_number: true,
            },
          },
          comments: {
            select: {
              id: true,
              created_at: true,
            },
          },
          photos: {
            select: {
              id: true,
            },
          },
        },
        orderBy: [{ priority: 'desc' }, { created_at: 'desc' }],
      }),
      this.prisma.maintenance_requests.count({ where }),
    ]);

    return {
      data: requests,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
