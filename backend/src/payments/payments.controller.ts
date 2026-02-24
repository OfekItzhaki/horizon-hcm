import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser, JwtAuthGuard } from '@ofeklabs/horizon-auth';
import { BuildingMemberGuard } from '../common/guards/building-member.guard';
import { CommitteeMemberGuard } from '../common/guards/committee-member.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { CreatePaymentCommand } from './commands/impl/create-payment.command';
import { MarkPaymentPaidCommand } from './commands/impl/mark-payment-paid.command';
import { GetPaymentQuery } from './queries/impl/get-payment.query';
import { ListPaymentsQuery } from './queries/impl/list-payments.query';
import { GetPaymentSummaryQuery } from './queries/impl/get-payment-summary.query';

@ApiTags('payments')
@Controller('payments')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Post()
  @UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 404, description: 'Apartment not found' })
  async createPayment(@CurrentUser() user: any, @Body() dto: CreatePaymentDto) {
    const command = new CreatePaymentCommand(
      dto.apartmentId,
      dto.amount,
      new Date(dto.dueDate),
      dto.paymentType,
      user.id,
      dto.description,
      dto.referenceNumber,
    );
    return this.commandBus.execute(command);
  }

  @Patch(':id/mark-paid')
  @UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark payment as paid' })
  @ApiResponse({ status: 200, description: 'Payment marked as paid' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async markPaymentPaid(@CurrentUser() user: any, @Param('id') id: string) {
    const command = new MarkPaymentPaidCommand(id, new Date());
    return this.commandBus.execute(command);
  }

  @Get(':id')
  @UseGuards(BuildingMemberGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment found' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPayment(@CurrentUser() user: any, @Param('id') id: string) {
    const query = new GetPaymentQuery(id);
    return this.queryBus.execute(query);
  }

  @Get()
  @UseGuards(BuildingMemberGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List payments' })
  @ApiQuery({ name: 'apartmentId', required: false, type: String })
  @ApiQuery({ name: 'buildingId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Payments list retrieved' })
  async listPayments(
    @CurrentUser() user: any,
    @Query('apartmentId') apartmentId?: string,
    @Query('buildingId') buildingId?: string,
    @Query('status') status?: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
  ) {
    const query = new ListPaymentsQuery(apartmentId, buildingId, status, page, limit);
    return this.queryBus.execute(query);
  }

  @Get('building/:buildingId/summary')
  @UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get payment summary for building' })
  @ApiResponse({ status: 200, description: 'Payment summary retrieved' })
  async getPaymentSummary(@CurrentUser() user: any, @Param('buildingId') buildingId: string) {
    const query = new GetPaymentSummaryQuery(buildingId);
    return this.queryBus.execute(query);
  }
}
