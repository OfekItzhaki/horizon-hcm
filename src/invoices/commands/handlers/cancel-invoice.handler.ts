import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { CancelInvoiceCommand } from '../impl/cancel-invoice.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(CancelInvoiceCommand)
export class CancelInvoiceHandler implements ICommandHandler<CancelInvoiceCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(command: CancelInvoiceCommand) {
    const { invoiceId, userId, reason } = command;

    // Find invoice
    const invoice = await this.prisma.invoices.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Only creator can cancel invoice
    if (invoice.created_by !== userId) {
      throw new ForbiddenException('You can only cancel your own invoices');
    }

    // Cannot cancel already cancelled or paid invoices
    if (invoice.status === 'cancelled') {
      throw new BadRequestException('Invoice is already cancelled');
    }

    if (invoice.status === 'paid') {
      throw new BadRequestException('Cannot cancel paid invoice');
    }

    // Cancel invoice
    const cancelledInvoice = await this.prisma.invoices.update({
      where: { id: invoiceId },
      data: {
        status: 'cancelled',
        cancelled_at: new Date(),
        cancellation_reason: reason,
        updated_at: new Date(),
      },
    });

    // Log audit
    await this.auditLog.log({
      userId,
      action: 'invoice.cancelled',
      resourceType: 'invoice',
      resourceId: invoiceId,
    });

    return cancelledInvoice;
  }
}
