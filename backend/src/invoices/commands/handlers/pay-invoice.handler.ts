import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PayInvoiceCommand } from '../impl/pay-invoice.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(PayInvoiceCommand)
export class PayInvoiceHandler implements ICommandHandler<PayInvoiceCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(command: PayInvoiceCommand) {
    const { invoiceId, userId, method, amount } = command;

    const invoice = await this.prisma.invoices.findUnique({ where: { id: invoiceId } });

    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status === 'paid') throw new BadRequestException('Invoice is already paid');
    if (invoice.status === 'cancelled') throw new BadRequestException('Cannot pay a cancelled invoice');

    const paid = await this.prisma.invoices.update({
      where: { id: invoiceId },
      data: {
        status: 'paid',
        paid_date: new Date(),
        updated_at: new Date(),
      },
    });

    await this.auditLog.log({
      userId,
      action: 'invoice.paid',
      resourceType: 'invoice',
      resourceId: invoiceId,
      metadata: { method, amount },
    });

    return paid;
  }
}
