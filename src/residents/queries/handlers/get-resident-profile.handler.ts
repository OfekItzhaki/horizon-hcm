import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException, Injectable } from '@nestjs/common';
import { GetResidentProfileQuery } from '../impl/get-resident-profile.query';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
@QueryHandler(GetResidentProfileQuery)
export class GetResidentProfileHandler implements IQueryHandler<GetResidentProfileQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetResidentProfileQuery): Promise<any> {
    const { residentId } = query;

    // Get user profile with all associations
    const userProfile = await this.prisma.user_profiles.findUnique({
      where: { id: residentId },
      include: {
        committee_memberships: {
          include: {
            building: {
              select: {
                id: true,
                name: true,
                address_line: true,
              },
            },
          },
        },
        owned_apartments: {
          include: {
            apartment: {
              select: {
                id: true,
                apartment_number: true,
                building_id: true,
                building: {
                  select: {
                    name: true,
                    address_line: true,
                  },
                },
              },
            },
          },
        },
        tenant_apartments: {
          where: {
            is_active: true,
          },
          include: {
            apartment: {
              select: {
                id: true,
                apartment_number: true,
                building_id: true,
                building: {
                  select: {
                    name: true,
                    address_line: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!userProfile) {
      throw new NotFoundException('Resident not found');
    }

    // Format the response
    return {
      id: userProfile.id,
      full_name: userProfile.full_name,
      phone_number: userProfile.phone_number,
      user_type: userProfile.user_type,
      preferred_language: userProfile.preferred_language,
      committee_roles: userProfile.committee_memberships.map((membership) => ({
        building_id: membership.building_id,
        building_name: membership.building.name,
        building_address: membership.building.address_line,
        role: membership.role,
        since: membership.created_at,
      })),
      owned_apartments: userProfile.owned_apartments.map((ownership) => ({
        apartment_id: ownership.apartment.id,
        apartment_number: ownership.apartment.apartment_number,
        building_id: ownership.apartment.building_id,
        building_name: ownership.apartment.building.name,
        building_address: ownership.apartment.building.address_line,
        ownership_share: ownership.ownership_share,
        is_primary: ownership.is_primary,
        since: ownership.created_at,
      })),
      tenant_apartments: userProfile.tenant_apartments.map((tenancy) => ({
        apartment_id: tenancy.apartment.id,
        apartment_number: tenancy.apartment.apartment_number,
        building_id: tenancy.apartment.building_id,
        building_name: tenancy.apartment.building.name,
        building_address: tenancy.apartment.building.address_line,
        move_in_date: tenancy.move_in_date,
        is_active: tenancy.is_active,
      })),
    };
  }
}
