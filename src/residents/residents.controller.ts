import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AddCommitteeMemberDto } from './dto/add-committee-member.dto';
import { ListResidentsDto } from './dto/list-residents.dto';
import { AddCommitteeMemberCommand } from './commands/impl/add-committee-member.command';
import { RemoveCommitteeMemberCommand } from './commands/impl/remove-committee-member.command';
import { ListResidentsQuery } from './queries/impl/list-residents.query';
import { GetResidentProfileQuery } from './queries/impl/get-resident-profile.query';
import { ExportResidentsQuery } from './queries/impl/export-residents.query';

@ApiTags('Residents')
@Controller()
@ApiBearerAuth()
export class ResidentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get('buildings/:buildingId/residents')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all residents in a building' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'userType', required: false, enum: ['COMMITTEE', 'OWNER', 'TENANT'] })
  @ApiQuery({ name: 'apartmentNumber', required: false, type: String })
  @ApiQuery({ name: 'phoneNumber', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Residents list retrieved with pagination',
  })
  @ApiResponse({ status: 404, description: 'Building not found' })
  async listResidents(
    @Param('buildingId') buildingId: string,
    @Query() dto: ListResidentsDto,
  ) {
    const query = new ListResidentsQuery(
      buildingId,
      dto.page,
      dto.limit,
      dto.search,
      dto.userType,
      dto.apartmentNumber,
      dto.phoneNumber,
    );
    return this.queryBus.execute(query);
  }

  @Get('residents/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get resident profile with all associations' })
  @ApiResponse({
    status: 200,
    description: 'Resident profile retrieved with apartments and roles',
  })
  @ApiResponse({ status: 404, description: 'Resident not found' })
  async getResidentProfile(@Param('id') id: string) {
    const query = new GetResidentProfileQuery(id);
    return this.queryBus.execute(query);
  }

  @Post('buildings/:buildingId/committee-members')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a committee member to the building' })
  @ApiResponse({
    status: 201,
    description: 'Committee member added successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Building or user not found',
  })
  @ApiResponse({
    status: 409,
    description: 'User is already a committee member',
  })
  async addCommitteeMember(
    @Param('buildingId') buildingId: string,
    @Body() dto: AddCommitteeMemberDto,
  ) {
    // TODO: Replace with @CurrentUser() decorator in task 7.x
    const currentUserId = 'current-user-id';

    const command = new AddCommitteeMemberCommand(
      buildingId,
      dto.userId,
      dto.role,
      currentUserId,
    );
    return this.commandBus.execute(command);
  }

  @Delete('buildings/:buildingId/committee-members/:memberId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a committee member from the building' })
  @ApiResponse({
    status: 200,
    description: 'Committee member removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Committee member not found',
  })
  async removeCommitteeMember(
    @Param('buildingId') buildingId: string,
    @Param('memberId') memberId: string,
  ) {
    // TODO: Replace with @CurrentUser() decorator in task 7.x
    const currentUserId = 'current-user-id';

    const command = new RemoveCommitteeMemberCommand(
      buildingId,
      memberId,
      currentUserId,
    );
    return this.commandBus.execute(command);
  }

  @Get('buildings/:buildingId/residents/export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Export residents to CSV' })
  @ApiResponse({
    status: 200,
    description: 'CSV export URL generated (valid for 24 hours)',
  })
  @ApiResponse({ status: 404, description: 'Building not found' })
  async exportResidents(@Param('buildingId') buildingId: string) {
    const query = new ExportResidentsQuery(buildingId);
    return this.queryBus.execute(query);
  }
}
