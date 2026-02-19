import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetPaymentQuery } from '../impl/get-payment.query';

@QueryHandler(GetPaymentQuery)
export class GetPaymentHandler implements IQueryHandler<GetPaymentQuery> {
  constructor(private prisma: PrismaService) {}

  async execute(query: GetPaymentQuery) {
    const { paymentId } = query;

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        apartment: {
          include: {
            building: true,
            owners: {
              include: {
                user_profile: {
                  select: {
                    id: true,
                    full_name: true,
                    phone_number: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }
}
