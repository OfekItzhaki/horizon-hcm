import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePaymentCommand } from '../impl/create-payment.command';
import { AuditLogService } from '../../../common/services/audit-log.service';
import { generateId } from '../../../common/utils/id-generator';

@CommandHandler(CreatePaymentCommand)
export class CreatePaymentHandler implements ICommandHandler<CreatePaymentCommand> {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
  ) {}

  async execute(command: CreatePaymentCommand) {
    const { apartmentId, amount, dueDate, paymentType, createdBy, description, referenceNumber } =
      command;

    // Verify apartment exists
    const apartment = await this.prisma.apartments.findUnique({
      where: { id: apartmentId },
    });

    if (!apartment) {
      throw new NotFoundException('Apartment not found');
    }

    // Create payment
    const payment = await this.prisma.payments.create({
      data: {
        id: generateId(),
        apartment_id: apartmentId,
        amount,
        due_date: dueDate,
        payment_type: paymentType,
        status: 'pending',
        description,
        reference_number: referenceNumber,
        created_by: createdBy,
        updated_at: new Date(),
      },
      include: {
        apartments: {
          include: { buildings: true },
        },
      },
    });

    // Log audit
    await this.auditLog.log({
      action: 'payment.created',
      resourceType: 'Payment',
      resourceId: payment.id,
      metadata: { apartmentId, amount, dueDate, paymentType },
    });

    return payment;
  }
}
