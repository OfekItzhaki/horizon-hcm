import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PaymentsController } from './payments.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CommonModule } from '../common/common.module';

// Command Handlers
import { CreatePaymentHandler } from './commands/handlers/create-payment.handler';
import { MarkPaymentPaidHandler } from './commands/handlers/mark-payment-paid.handler';

// Query Handlers
import { GetPaymentHandler } from './queries/handlers/get-payment.handler';
import { ListPaymentsHandler } from './queries/handlers/list-payments.handler';
import { GetPaymentSummaryHandler } from './queries/handlers/get-payment-summary.handler';

const CommandHandlers = [CreatePaymentHandler, MarkPaymentPaidHandler];

const QueryHandlers = [GetPaymentHandler, ListPaymentsHandler, GetPaymentSummaryHandler];

@Module({
  imports: [CqrsModule, CommonModule],
  controllers: [PaymentsController],
  providers: [PrismaService, ...CommandHandlers, ...QueryHandlers],
})
export class PaymentsModule {}
