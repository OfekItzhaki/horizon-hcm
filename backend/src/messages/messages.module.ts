import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MessagesController } from './messages.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';
import { NotificationsModule } from '../notifications/notifications.module';

// Command handlers
import { SendMessageHandler } from './commands/handlers/send-message.handler';
import { UpdateMessageHandler } from './commands/handlers/update-message.handler';
import { DeleteMessageHandler } from './commands/handlers/delete-message.handler';
import { MarkMessageReadHandler } from './commands/handlers/mark-message-read.handler';

// Query handlers
import { GetMessageHandler } from './queries/handlers/get-message.handler';
import { GetMessagesHandler } from './queries/handlers/get-messages.handler';

const CommandHandlers = [
  SendMessageHandler,
  UpdateMessageHandler,
  DeleteMessageHandler,
  MarkMessageReadHandler,
];

const QueryHandlers = [GetMessageHandler, GetMessagesHandler];

@Module({
  imports: [CqrsModule, PrismaModule, CommonModule, NotificationsModule],
  controllers: [MessagesController],
  providers: [...CommandHandlers, ...QueryHandlers],
  exports: [],
})
export class MessagesModule {}
