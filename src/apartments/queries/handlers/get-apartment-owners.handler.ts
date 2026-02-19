import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetApartmentOwnersQuery } from '../impl/get-apartment-owners.query';

@QueryHandler(GetApartmentOwnersQuery)
export class GetApartmentOwnersHandler implements IQueryHandler<GetApartmentOwnersQuery> {
  constructor(private prisma: PrismaService) {}

  async execute(query: GetApartmentOwnersQuery) {
    const { apartmentId } = query;

    const owners = await this.prisma.apartmentOwner.findMany({
      where: { apartment_id: apartmentId },
      include: {
        user_profile: {
          select: {
            id: true,
            user_id: true,
            full_name: true,
            phone_number: true,
            user_type: true,
          },
        },
      },
      orderBy: { is_primary: 'desc' },
    });

    return owners;
  }
}
