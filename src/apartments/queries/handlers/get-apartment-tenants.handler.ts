import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetApartmentTenantsQuery } from '../impl/get-apartment-tenants.query';

@QueryHandler(GetApartmentTenantsQuery)
export class GetApartmentTenantsHandler implements IQueryHandler<GetApartmentTenantsQuery> {
  constructor(private prisma: PrismaService) {}

  async execute(query: GetApartmentTenantsQuery) {
    const { apartmentId } = query;

    const tenants = await this.prisma.apartment_tenants.findMany({
      where: { apartment_id: apartmentId },
      include: {
        user_profiles: {
          select: {
            id: true,
            user_id: true,
            full_name: true,
            phone_number: true,
            user_type: true,
          },
        },
      },
      orderBy: { is_active: 'desc' },
    });

    return tenants;
  }
}
