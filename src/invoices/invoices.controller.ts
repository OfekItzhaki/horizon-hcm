import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@ofeklabs/horizon-auth';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { CancelInvoiceDto } from './dto/cancel-invoice.dto';
import { CreateInvoiceCommand } from './commands/impl/create-invoice.command';
import { UpdateInvoiceCommand } from './commands/impl/update-invoice.command';
import { CancelInvoiceCommand } from './commands/impl/cancel-invoice.command';
import { GetInvoicesQuery } from './queries/impl/get-invoices.query';
import { GetInvoiceQuery } from './queries/impl/get-invoice.query';

@ApiTags('invoices')
@Controller('invoices')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvoicesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all invoices' })
  async getAll(
    @Query('buildingId') buildingId?: string,
    @Query('apartmentId') apartmentId?: string,
    @Query('status') status?: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.queryBus.execute(
      new GetInvoicesQuery(buildingId, apartmentId, status, Number(page), Number(limit)),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get invoice by ID' })
  async getById(@Param('id') id: string) {
    return this.queryBus.execute(new GetInvoiceQuery(id));
  }

  @Post()
  @ApiOperation({ summary: 'Create invoice' })
  async create(@CurrentUser() user: any, @Body() data: CreateInvoiceDto) {
    return this.commandBus.execute(
      new CreateInvoiceCommand(
        data.buildingId,
        data.apartmentId,
        data.title,
        data.description,
        data.amount,
        new Date(data.dueDate),
        user.id,
      ),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update invoice' })
  async update(@CurrentUser() user: any, @Param('id') id: string, @Body() data: UpdateInvoiceDto) {
    return this.commandBus.execute(
      new UpdateInvoiceCommand(
        id,
        user.id,
        data.title,
        data.description,
        data.amount,
        data.dueDate ? new Date(data.dueDate) : undefined,
      ),
    );
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel invoice' })
  async cancel(@CurrentUser() user: any, @Param('id') id: string, @Body() body: CancelInvoiceDto) {
    return this.commandBus.execute(new CancelInvoiceCommand(id, user.id, body.reason));
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Bulk create invoices' })
  async bulkCreate() {
    // TODO: Implement bulk invoice creation
    return { message: 'Bulk invoice creation not yet implemented' };
  }
}
