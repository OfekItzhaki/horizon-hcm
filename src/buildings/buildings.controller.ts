import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateBuildingDto } from './dto/create-building.dto';
import { CreateBuildingCommand } from './commands/impl/create-building.command';
import { GetBuildingQuery } from './queries/impl/get-building.query';

@ApiTags('buildings')
@Controller('buildings')
export class BuildingsController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new building' })
  @ApiResponse({ status: 201, description: 'Building created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiBearerAuth()
  async createBuilding(@Body() dto: CreateBuildingDto) {
    const command = new CreateBuildingCommand(
      dto.name,
      dto.addressLine,
      dto.city,
      dto.postalCode,
      dto.numUnits,
    );

    return this.commandBus.execute(command);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get building by ID' })
  @ApiResponse({ status: 200, description: 'Building found' })
  @ApiResponse({ status: 404, description: 'Building not found' })
  @ApiBearerAuth()
  async getBuilding(@Param('id') id: string) {
    const query = new GetBuildingQuery(id);
    return this.queryBus.execute(query);
  }
}
