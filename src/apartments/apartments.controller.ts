import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  ParseBoolPipe,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CurrentUser } from '@ofeklabs/horizon-auth';
import { BuildingMemberGuard } from '../common/guards/building-member.guard';
import { CommitteeMemberGuard } from '../common/guards/committee-member.guard';
import { CreateApartmentDto } from './dto/create-apartment.dto';
import { UpdateApartmentDto } from './dto/update-apartment.dto';
import { AssignOwnerDto } from './dto/assign-owner.dto';
import { AssignTenantDto } from './dto/assign-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { CreateApartmentCommand } from './commands/impl/create-apartment.command';
import { UpdateApartmentCommand } from './commands/impl/update-apartment.command';
import { DeleteApartmentCommand } from './commands/impl/delete-apartment.command';
import { AssignOwnerCommand } from './commands/impl/assign-owner.command';
import { RemoveOwnerCommand } from './commands/impl/remove-owner.command';
import { AssignTenantCommand } from './commands/impl/assign-tenant.command';
import { UpdateTenantCommand } from './commands/impl/update-tenant.command';
import { GetApartmentQuery } from './queries/impl/get-apartment.query';
import { ListApartmentsQuery } from './queries/impl/list-apartments.query';
import { GetApartmentOwnersQuery } from './queries/impl/get-apartment-owners.query';
import { GetApartmentTenantsQuery } from './queries/impl/get-apartment-tenants.query';

@ApiTags('apartments')
@Controller('apartments')
@ApiBearerAuth()
export class ApartmentsController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Post()
  @UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new apartment' })
  @ApiResponse({ status: 201, description: 'Apartment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or apartment already exists' })
  async createApartment(@CurrentUser() user: any, @Body() dto: CreateApartmentDto) {
    const command = new CreateApartmentCommand(
      dto.buildingId,
      dto.apartmentNumber,
      dto.areaSqm,
      dto.floor,
    );
    return this.commandBus.execute(command);
  }

  @Get(':id')
  @UseGuards(BuildingMemberGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get apartment by ID' })
  @ApiResponse({ status: 200, description: 'Apartment found' })
  @ApiResponse({ status: 404, description: 'Apartment not found' })
  async getApartment(@CurrentUser() user: any, @Param('id') id: string) {
    const query = new GetApartmentQuery(id);
    return this.queryBus.execute(query);
  }

  @Patch(':id')
  @UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update apartment details' })
  @ApiResponse({ status: 200, description: 'Apartment updated successfully' })
  @ApiResponse({ status: 404, description: 'Apartment not found' })
  async updateApartment(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: UpdateApartmentDto) {
    const command = new UpdateApartmentCommand(id, dto.areaSqm, dto.floor, dto.isVacant);
    return this.commandBus.execute(command);
  }

  @Delete(':id')
  @UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete apartment' })
  @ApiResponse({ status: 200, description: 'Apartment deleted successfully' })
  @ApiResponse({ status: 400, description: 'Cannot delete apartment with active tenants' })
  @ApiResponse({ status: 404, description: 'Apartment not found' })
  async deleteApartment(@CurrentUser() user: any, @Param('id') id: string) {
    const command = new DeleteApartmentCommand(id);
    return this.commandBus.execute(command);
  }

  @Get('building/:buildingId')
  @UseGuards(BuildingMemberGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List apartments in a building' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isVacant', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Apartments list retrieved' })
  async listApartments(
    @CurrentUser() user: any,
    @Param('buildingId') buildingId: string,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
    @Query('isVacant', new ParseBoolPipe({ optional: true })) isVacant?: boolean,
  ) {
    const query = new ListApartmentsQuery(buildingId, page, limit, isVacant);
    return this.queryBus.execute(query);
  }

  @Post(':id/owners')
  @UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign owner to apartment' })
  @ApiResponse({ status: 201, description: 'Owner assigned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or ownership shares exceed 100%' })
  @ApiResponse({ status: 404, description: 'Apartment not found' })
  async assignOwner(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: AssignOwnerDto) {
    const command = new AssignOwnerCommand(
      id,
      dto.userId,
      dto.ownershipShare,
      dto.isPrimary,
    );
    return this.commandBus.execute(command);
  }

  @Delete(':id/owners/:ownerId')
  @UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove owner from apartment' })
  @ApiResponse({ status: 200, description: 'Owner removed successfully' })
  @ApiResponse({ status: 404, description: 'Owner not found' })
  async removeOwner(@CurrentUser() user: any, @Param('id') id: string, @Param('ownerId') ownerId: string) {
    const command = new RemoveOwnerCommand(id, ownerId);
    return this.commandBus.execute(command);
  }

  @Get(':id/owners')
  @UseGuards(BuildingMemberGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get apartment owners' })
  @ApiResponse({ status: 200, description: 'Owners list retrieved' })
  async getOwners(@CurrentUser() user: any, @Param('id') id: string) {
    const query = new GetApartmentOwnersQuery(id);
    return this.queryBus.execute(query);
  }

  @Post(':id/tenants')
  @UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Assign tenant to apartment' })
  @ApiResponse({ status: 201, description: 'Tenant assigned successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or tenant already active' })
  @ApiResponse({ status: 404, description: 'Apartment not found' })
  async assignTenant(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: AssignTenantDto) {
    const command = new AssignTenantCommand(
      id,
      dto.userId,
      dto.moveInDate ? new Date(dto.moveInDate) : undefined,
    );
    return this.commandBus.execute(command);
  }

  @Patch(':id/tenants/:tenantId')
  @UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update tenant details' })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async updateTenant(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateTenantDto,
  ) {
    const command = new UpdateTenantCommand(
      tenantId,
      dto.moveOutDate ? new Date(dto.moveOutDate) : undefined,
      dto.isActive,
    );
    return this.commandBus.execute(command);
  }

  @Get(':id/tenants')
  @UseGuards(BuildingMemberGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get apartment tenants' })
  @ApiResponse({ status: 200, description: 'Tenants list retrieved' })
  async getTenants(@CurrentUser() user: any, @Param('id') id: string) {
    const query = new GetApartmentTenantsQuery(id);
    return this.queryBus.execute(query);
  }
}
