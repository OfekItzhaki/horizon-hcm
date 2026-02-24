import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CreateInvoiceCommand } from '../impl/create-invoice.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';
import { NotificationService } from '../../../notifications/services/notification.service';
import { generateId } from '../../../common/utils/id-generator';

@CommandHandler(CreateInvoiceCommand)
export class CreateInvoiceHandler implements ICommandHandler<CreateInvoiceCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
    private readonly notificationService: NotificationService,
  ) {}

  async execute(command: CreateInvoiceCommand) {
    const { buildingId, apartmentId, title, description, amount, dueDate, createdBy } = command;

    // Validate building exists
    const building = await this.prisma.buildings.findUnique({
      where: { id: buildingId },
    });

    if (!building) {
      throw new NotFoundException('Building not found');
    }

    // Validate apartment if provided
    if (apartmentId) {
      const apartment = await this.prisma.apartments.findFirst({
        where: {
          id: apartmentId,
          building_id: buildingId,
        },
      });

      if (!apartment) {
        throw new BadRequestException('Apartment not found in this building');
      }
    }

    // Generate unique invoice number
    const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Create invoice
    const invoice = await this.prisma.invoices.create({
      data: {
        id: generateId(),
        building_id: buildingId,
        apartment_id: apartmentId,
        invoice_number: invoiceNumber,
        title,
        description,
        amount,
        due_date: dueDate,
        status: 'draft',
        created_by: createdBy,
        updated_at: new Date(),
      },
    });

    // Log audit
    await this.auditLog.log({
      userId: createdBy,
      action: 'invoice.created',
      resourceType: 'invoice',
      resourceId: invoice.id,
    });

    // Send push notification to apartment owner(s)
    if (apartmentId) {
      try {
        // Get apartment owners
        const owners = await this.prisma.apartment_owners.findMany({
          where: { apartment_id: apartmentId },
          include: {
            user_profiles: {
              select: { id: true },
            },
          },
        });

        // Send notification to each owner
        for (const owner of owners) {
          await this.notificationService.sendTemplatedNotification({
            userId: owner.user_profiles.id,
            templateName: 'new_invoice',
            variables: {
              invoiceNumber: invoiceNumber,
              amount: amount.toString(),
              dueDate: dueDate.toLocaleDateString(),
              title,
            },
          });
        }
      } catch (error) {
        // Log error but don't fail the invoice creation
        console.error('Failed to send invoice notifications:', error);
      }
    }

    return invoice;
  }
}
