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
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@ofeklabs/horizon-auth';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateMessageDto } from './dto/update-message.dto';
import { SendMessageCommand } from './commands/impl/send-message.command';
import { UpdateMessageCommand } from './commands/impl/update-message.command';
import { DeleteMessageCommand } from './commands/impl/delete-message.command';
import { MarkMessageReadCommand } from './commands/impl/mark-message-read.command';
import { GetMessagesQuery } from './queries/impl/get-messages.query';
import { GetMessageQuery } from './queries/impl/get-message.query';

@ApiTags('messages')
@Controller('buildings/:buildingId/messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all messages' })
  async getAll(
    @CurrentUser() user: any,
    @Param('buildingId') buildingId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 50,
  ) {
    return this.queryBus.execute(
      new GetMessagesQuery(buildingId, user.id, Number(page), Number(limit)),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Send message' })
  async send(
    @CurrentUser() user: any,
    @Param('buildingId') buildingId: string,
    @Body() data: SendMessageDto,
  ) {
    return this.commandBus.execute(
      new SendMessageCommand(buildingId, user.id, data.recipientId, data.content),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get message by ID' })
  async getById(@Param('buildingId') buildingId: string, @Param('id') id: string) {
    return this.queryBus.execute(new GetMessageQuery(id, buildingId));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update message' })
  async update(
    @CurrentUser() user: any,
    @Param('buildingId') buildingId: string,
    @Param('id') id: string,
    @Body() data: UpdateMessageDto,
  ) {
    return this.commandBus.execute(new UpdateMessageCommand(id, user.id, data.content));
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete message' })
  async delete(@CurrentUser() user: any, @Param('id') id: string) {
    return this.commandBus.execute(new DeleteMessageCommand(id, user.id));
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark message as read' })
  async markAsRead(@CurrentUser() user: any, @Param('id') id: string) {
    return this.commandBus.execute(new MarkMessageReadCommand(id, user.id));
  }
}
