import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { UpdateInvoiceCommand } from '../impl/update-invoice.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(UpdateInvoiceCommand)
export class UpdateInvoiceHandler implements ICommandHandler<UpdateInvoiceCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(command: UpdateInvoiceCommand) {
    const { invoiceId, userId, title, description, amount, dueDate } = command;

    // Find invoice
    const invoice = await this.prisma.invoices.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Only creator can update invoice
    if (invoice.created_by !== userId) {
      throw new ForbiddenException('You can only update your own invoices');
    }

    // Cannot update cancelled or paid invoices
    if (invoice.status === 'cancelled' || invoice.status === 'paid') {
      throw new BadRequestException(`Cannot update ${invoice.status} invoice`);
    }

    // Update invoice
    const updatedInvoice = await this.prisma.invoices.update({
      where: { id: invoiceId },
      data: {
        title: title ?? invoice.title,
        description: description !== undefined ? description : invoice.description,
        amount: amount ?? invoice.amount,
        due_date: dueDate ?? invoice.due_date,
        updated_at: new Date(),
      },
    });

    // Log audit
    await this.auditLog.log({
      userId,
      action: 'invoice.updated',
      resourceType: 'invoice',
      resourceId: invoiceId,
    });

    return updatedInvoice;
  }
}
