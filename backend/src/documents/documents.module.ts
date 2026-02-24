import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DocumentsController } from './documents.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

// Command handlers
import { UploadDocumentHandler } from './commands/handlers/upload-document.handler';
import { DeleteDocumentHandler } from './commands/handlers/delete-document.handler';

// Query handlers
import { GetDocumentHandler } from './queries/handlers/get-document.handler';
import { ListDocumentsHandler } from './queries/handlers/list-documents.handler';

const CommandHandlers = [
  UploadDocumentHandler,
  DeleteDocumentHandler,
];

const QueryHandlers = [
  GetDocumentHandler,
  ListDocumentsHandler,
];

@Module({
  imports: [CqrsModule, PrismaModule, CommonModule],
  controllers: [DocumentsController],
  providers: [...CommandHandlers, ...QueryHandlers],
})
export class DocumentsModule {}
