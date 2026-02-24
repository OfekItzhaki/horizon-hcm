import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { GetInvoiceQuery } from '../impl/get-invoice.query';
import { PrismaService } from '../../../prisma/prisma.service';

@QueryHandler(GetInvoiceQuery)
export class GetInvoiceHandler implements IQueryHandler<GetInvoiceQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetInvoiceQuery) {
    const { invoiceId } = query;

    const invoice = await this.prisma.invoices.findUnique({
      where: { id: invoiceId },
      include: {
        buildings: true,
        apartments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
    }

    return invoice;
  }
}
