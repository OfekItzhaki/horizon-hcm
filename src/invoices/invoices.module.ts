import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InvoicesController],
  providers: [],
  exports: [],
})
export class InvoicesModule {}
