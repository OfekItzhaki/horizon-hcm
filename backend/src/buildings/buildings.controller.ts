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
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CreateBuildingDto } from './dto/create-building.dto';
import { UpdateBuildingDto } from './dto/update-building.dto';
import { CreateBuildingCommand } from './commands/impl/create-building.command';
import { UpdateBuildingCommand } from './commands/impl/update-building.command';
import { DeleteBuildingCommand } from './commands/impl/delete-building.command';
import { GetBuildingQuery } from './queries/impl/get-building.query';
import { ListBuildingsQuery } from './queries/impl/list-buildings.query';

@ApiTags('buildings')
@Controller('buildings')
export class BuildingsController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all buildings' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Buildings list' })
  @ApiBearerAuth()
  async listBuildings(
    @Query('page') page = 1,
    @Query('limit') limit = 50,
    @Query('search') search?: string,
  ) {
    return this.queryBus.execute(
      new ListBuildingsQuery(Number(page), Number(limit), search),
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new building' })
  @ApiResponse({ status: 201, description: 'Building created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiBearerAuth()
  async createBuilding(@Body() dto: CreateBuildingDto) {
    return this.commandBus.execute(
      new CreateBuildingCommand(
        dto.name,
        dto.addressLine,
        dto.city,
        dto.postalCode,
        dto.numUnits,
      ),
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get building by ID' })
  @ApiResponse({ status: 200, description: 'Building found' })
  @ApiResponse({ status: 404, description: 'Building not found' })
  @ApiBearerAuth()
  async getBuilding(@Param('id') id: string) {
    return this.queryBus.execute(new GetBuildingQuery(id));
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a building' })
  @ApiResponse({ status: 200, description: 'Building updated' })
  @ApiResponse({ status: 404, description: 'Building not found' })
  @ApiBearerAuth()
  async updateBuilding(@Param('id') id: string, @Body() dto: UpdateBuildingDto) {
    return this.commandBus.execute(
      new UpdateBuildingCommand(
        id,
        dto.name,
        dto.addressLine,
        dto.city,
        dto.postalCode,
        dto.numUnits,
        dto.isActive,
      ),
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a building' })
  @ApiResponse({ status: 200, description: 'Building deleted' })
  @ApiResponse({ status: 404, description: 'Building not found' })
  @ApiBearerAuth()
  async deleteBuilding(@Param('id') id: string) {
    return this.commandBus.execute(new DeleteBuildingCommand(id));
  }
}
