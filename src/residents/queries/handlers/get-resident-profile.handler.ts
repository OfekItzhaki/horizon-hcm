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
        building_committee_members: {
          include: {
            buildings: {
              select: {
                id: true,
                name: true,
                address_line: true,
              },
            },
          },
        },
        apartment_owners: {
          include: {
            apartments: {
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
        apartment_tenants: {
          where: {
            is_active: true,
          },
          include: {
            apartments: {
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
        building_name: membership.buildings.name,
        building_address: membership.buildings.address_line,
        role: membership.role,
        since: membership.created_at,
      })),
      apartment_owners: userProfile.owned_apartments.map((ownership) => ({
        apartment_id: ownership.apartments.id,
        apartment_number: ownership.apartments.apartment_number,
        building_id: ownership.apartments.building_id,
        building_name: ownership.apartments.buildings.name,
        building_address: ownership.apartments.buildings.address_line,
        ownership_share: ownership.ownership_share,
        is_primary: ownership.is_primary,
        since: ownership.created_at,
      })),
      apartment_tenants: userProfile.tenant_apartments.map((tenancy) => ({
        apartment_id: tenancy.apartments.id,
        apartment_number: tenancy.apartments.apartment_number,
        building_id: tenancy.apartments.building_id,
        building_name: tenancy.apartments.buildings.name,
        building_address: tenancy.apartments.buildings.address_line,
        move_in_date: tenancy.move_in_date,
        is_active: tenancy.is_active,
      })),
    };
  }
}
