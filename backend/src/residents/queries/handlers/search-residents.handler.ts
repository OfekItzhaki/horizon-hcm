import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { SearchResidentsQuery } from '../impl/search-residents.query';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
@QueryHandler(SearchResidentsQuery)
export class SearchResidentsHandler implements IQueryHandler<SearchResidentsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: SearchResidentsQuery): Promise<any> {
    const { buildingId, searchTerm, searchField } = query;

    let residents = [];

    if (searchField === 'name') {
      // Search by name in UserProfile
      const userProfiles = await this.prisma.user_profiles.findMany({
        where: {
          full_name: {
            contains: searchTerm,
            mode: 'insensitive',
          },
          OR: [
            {
              building_committee_members: {
                some: {
                  building_id: buildingId,
                },
              },
            },
            {
              apartment_owners: {
                some: {
                  apartments: {
                    building_id: buildingId,
                  },
                },
              },
            },
            {
              apartment_tenants: {
                some: {
                  is_active: true,
                  apartments: {
                    building_id: buildingId,
                  },
                },
              },
            },
          ],
        },
        select: {
          id: true,
          full_name: true,
          phone_number: true,
          user_type: true,
        },
      });

      residents = userProfiles;
    } else if (searchField === 'phone') {
      // Search by phone number
      const userProfiles = await this.prisma.user_profiles.findMany({
        where: {
          phone_number: {
            contains: searchTerm,
          },
          OR: [
            {
              building_committee_members: {
                some: {
                  building_id: buildingId,
                },
              },
            },
            {
              apartment_owners: {
                some: {
                  apartments: {
                    building_id: buildingId,
                  },
                },
              },
            },
            {
              apartment_tenants: {
                some: {
                  is_active: true,
                  apartments: {
                    building_id: buildingId,
                  },
                },
              },
            },
          ],
        },
        select: {
          id: true,
          full_name: true,
          phone_number: true,
          user_type: true,
        },
      });

      residents = userProfiles;
    } else if (searchField === 'apartment') {
      // Search by apartment number
      const [owners, tenants] = await Promise.all([
        this.prisma.apartment_owners.findMany({
          where: {
            apartments: {
              building_id: buildingId,
              apartment_number: searchTerm,
            },
          },
          include: {
            user_profiles: {
              select: {
                id: true,
                full_name: true,
                phone_number: true,
                user_type: true,
              },
            },
          },
        }),
        this.prisma.apartment_tenants.findMany({
          where: {
            is_active: true,
            apartments: {
              building_id: buildingId,
              apartment_number: searchTerm,
            },
          },
          include: {
            user_profiles: {
              select: {
                id: true,
                full_name: true,
                phone_number: true,
                user_type: true,
              },
            },
          },
        }),
      ]);

      // Deduplicate and combine
      const residentsMap = new Map();
      [...owners, ...tenants].forEach((record) => {
        const user = record.user_profiles;
        if (!residentsMap.has(user.id)) {
          residentsMap.set(user.id, user);
        }
      });

      residents = Array.from(residentsMap.values());
    }

    // Sort alphabetically by full_name
    residents.sort((a, b) => a.full_name.localeCompare(b.full_name));

    return {
      data: residents,
      total: residents.length,
    };
  }
}
