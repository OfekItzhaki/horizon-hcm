import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { MarkPaymentPaidCommand } from '../impl/mark-payment-paid.command';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(MarkPaymentPaidCommand)
export class MarkPaymentPaidHandler implements ICommandHandler<MarkPaymentPaidCommand> {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async execute(command: MarkPaymentPaidCommand) {
    const { paymentId, paidDate } = command;

    // Check if payment exists
    const payment = await this.prisma.payments.findUnique({
      where: { id: paymentId },
      include: {
        apartments: {
          include: { buildings: true },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    // Update payment status and building balance
    const [updatedPayment] = await this.prisma.$transaction([
      this.prisma.payments.update({
        where: { id: paymentId },
        data: {
          status: 'paid',
          paid_date: paidDate,
        },
      }),
      this.prisma.buildings.update({
        where: { id: payment.apartments.building_id },
        data: {
          current_balance: {
            increment: payment.amount,
          },
        },
      }),
    ]);

    // Log audit
    await this.auditLog.log({
      action: 'payment.marked_paid',
      resourceType: 'Payment',
      resourceId: paymentId,
      metadata: { paidDate, amount: payment.amount },
    });

    return updatedPayment;
  }
}
