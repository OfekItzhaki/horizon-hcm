import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetBuildingQuery } from '../impl/get-building.query';
import { PrismaService } from '../../../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

@QueryHandler(GetBuildingQuery)
export class GetBuildingHandler implements IQueryHandler<GetBuildingQuery> {
  constructor(private prisma: PrismaService) {}

  async execute(query: GetBuildingQuery) {
    const building = await this.prisma.buildings.findUnique({
      where: { id: query.buildingId },
      include: {
        building_committee_members: {
          include: { user_profiles: true },
        },
        apartments: true,
      },
    });

    if (!building) {
      throw new NotFoundException(`Building with ID ${query.buildingId} not found`);
    }

    return building;
  }
}
