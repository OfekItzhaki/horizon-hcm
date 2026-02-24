import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { InvoicesController } from './invoices.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';

// Command handlers
import { CreateInvoiceHandler } from './commands/handlers/create-invoice.handler';
import { UpdateInvoiceHandler } from './commands/handlers/update-invoice.handler';
import { CancelInvoiceHandler } from './commands/handlers/cancel-invoice.handler';

// Query handlers
import { GetInvoiceHandler } from './queries/handlers/get-invoice.handler';
import { GetInvoicesHandler } from './queries/handlers/get-invoices.handler';

const CommandHandlers = [CreateInvoiceHandler, UpdateInvoiceHandler, CancelInvoiceHandler];

const QueryHandlers = [GetInvoiceHandler, GetInvoicesHandler];

@Module({
  imports: [CqrsModule, PrismaModule, CommonModule, NotificationsModule],
  controllers: [InvoicesController],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [],
})
export class InvoicesModule {}
