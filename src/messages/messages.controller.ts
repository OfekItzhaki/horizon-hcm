import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@ofeklabs/horizon-auth';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('messages')
@Controller('buildings/:buildingId/messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Get all messages' })
  async getAll(
    @Param('buildingId') buildingId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    // TODO: Implement messages retrieval
    return {
      data: [],
      total: 0,
      page,
      limit,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Send message' })
  async send(
    @CurrentUser() user: any,
    @Param('buildingId') buildingId: string,
    @Body() data: { recipientId: string; content: string },
  ) {
    // TODO: Implement message sending
    return {
      id: 'msg_' + Date.now(),
      buildingId,
      senderId: user.id,
      recipientId: data.recipientId,
      content: data.content,
      createdAt: new Date(),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get message by ID' })
  async getById(@Param('buildingId') buildingId: string, @Param('id') id: string) {
    // TODO: Implement get message by ID
    return { id, buildingId, message: 'Message endpoint not yet implemented' };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update message' })
  async update(
    @Param('buildingId') buildingId: string,
    @Param('id') id: string,
    @Body() data: any,
  ) {
    // TODO: Implement message update
    return { id, buildingId, ...data };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete message' })
  async delete(@Param('id') id: string) {
    // TODO: Implement message deletion
    return { id, message: 'Message deleted' };
  }
}
