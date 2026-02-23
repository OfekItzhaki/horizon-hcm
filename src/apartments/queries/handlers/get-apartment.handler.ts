import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetApartmentQuery } from '../impl/get-apartment.query';

@QueryHandler(GetApartmentQuery)
export class GetApartmentHandler implements IQueryHandler<GetApartmentQuery> {
  constructor(private prisma: PrismaService) {}

  async execute(query: GetApartmentQuery) {
    const { apartmentId } = query;

    const apartment = await this.prisma.apartments.findUnique({
      where: { id: apartmentId },
      include: {
        building: true,
        owners: {
          include: {
            user_profile: {
              select: {
                id: true,
                full_name: true,
                phone_number: true,
                user_type: true,
              },
            },
          },
        },
        tenants: {
          where: { is_active: true },
          include: {
            user_profile: {
              select: {
                id: true,
                full_name: true,
                phone_number: true,
                user_type: true,
              },
            },
          },
        },
      },
    });

    if (!apartment) {
      throw new NotFoundException('Apartment not found');
    }

    return apartment;
  }
}
