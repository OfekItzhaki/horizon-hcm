import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { ListResidentsQuery } from '../impl/list-residents.query';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
@QueryHandler(ListResidentsQuery)
export class ListResidentsHandler implements IQueryHandler<ListResidentsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListResidentsQuery): Promise<any> {
    const { buildingId, page, limit, search, userType, apartmentNumber, phoneNumber } = query;

    // Ensure limit doesn't exceed 100
    const effectiveLimit = Math.min(limit, 100);
    const skip = (page - 1) * effectiveLimit;

    // Get all residents: committee members, owners, and active tenants
    const [committeeMembers, owners, tenants] = await Promise.all([
      // Committee members
      this.prisma.building_committee_members.findMany({
        where: { building_id: buildingId },
        include: {
          user_profiles: {
            select: {
              id: true,
              full_name: true,
              phone_number: true,
              user_type: true,
              apartment_owners: {
                where: {
                  apartments: {
                    building_id: buildingId,
                  },
                },
                include: {
                  apartments: {
                    select: {
                      apartment_number: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      // Apartment owners
      this.prisma.apartment_owners.findMany({
        where: {
          apartments: {
            building_id: buildingId,
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
          apartments: {
            select: {
              apartment_number: true,
            },
          },
        },
      }),
      // Active tenants
      this.prisma.apartment_tenants.findMany({
        where: {
          is_active: true,
          apartments: {
            building_id: buildingId,
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
          apartments: {
            select: {
              apartment_number: true,
            },
          },
        },
      }),
    ]);

    // Combine and deduplicate residents
    const residentsMap = new Map();

    // Add committee members
    committeeMembers.forEach((member) => {
      const userId = member.user_profiles.id;
      if (!residentsMap.has(userId)) {
        residentsMap.set(userId, {
          id: userId,
          full_name: member.user_profiles.full_name,
          phone_number: member.user_profiles.phone_number,
          user_type: member.user_profiles.user_type,
          roles: [],
          apartments: [],
        });
      }
      residentsMap.get(userId).roles.push({
        type: 'COMMITTEE',
        role: member.role,
      });
      // Add apartments from apartment_owners
      member.user_profiles.apartment_owners.forEach((ownership) => {
        residentsMap.get(userId).apartments.push({
          apartment_number: ownership.apartments.apartment_number,
          relationship: 'OWNER',
        });
      });
    });

    // Add owners
    owners.forEach((owner) => {
      const userId = owner.user_profiles.id;
      if (!residentsMap.has(userId)) {
        residentsMap.set(userId, {
          id: userId,
          full_name: owner.user_profiles.full_name,
          phone_number: owner.user_profiles.phone_number,
          user_type: owner.user_profiles.user_type,
          roles: [],
          apartments: [],
        });
      }
      residentsMap.get(userId).apartments.push({
        apartment_number: owner.apartments.apartment_number,
        relationship: 'OWNER',
      });
    });

    // Add tenants
    tenants.forEach((tenant) => {
      const userId = tenant.user_profiles.id;
      if (!residentsMap.has(userId)) {
        residentsMap.set(userId, {
          id: userId,
          full_name: tenant.user_profiles.full_name,
          phone_number: tenant.user_profiles.phone_number,
          user_type: tenant.user_profiles.user_type,
          roles: [],
          apartments: [],
        });
      }
      residentsMap.get(userId).apartments.push({
        apartment_number: tenant.apartments.apartment_number,
        relationship: 'TENANT',
      });
    });

    // Convert map to array
    let residents = Array.from(residentsMap.values());

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      residents = residents.filter(
        (r) =>
          r.full_name.toLowerCase().includes(searchLower) ||
          r.phone_number?.toLowerCase().includes(searchLower),
      );
    }

    if (userType) {
      residents = residents.filter((r) => r.roles.some((role) => role.type === userType));
    }

    if (apartmentNumber) {
      residents = residents.filter((r) =>
        r.apartments.some((apt) => apt.apartment_number === apartmentNumber),
      );
    }

    if (phoneNumber) {
      residents = residents.filter((r) => r.phone_number?.includes(phoneNumber));
    }

    // Sort alphabetically by full_name
    residents.sort((a, b) => a.full_name.localeCompare(b.full_name));

    // Apply pagination
    const total = residents.length;
    const paginatedResidents = residents.slice(skip, skip + effectiveLimit);

    return {
      data: paginatedResidents,
      pagination: {
        page,
        limit: effectiveLimit,
        total,
        totalPages: Math.ceil(total / effectiveLimit),
      },
    };
  }
}
