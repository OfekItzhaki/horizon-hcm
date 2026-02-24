import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../prisma/prisma.module';
import { FilesController } from './files.controller';
import { StorageService } from './services/storage.service';
import { ImageProcessingService } from './services/image-processing.service';
import { ChunkedUploadService } from './services/chunked-upload.service';
import { ImageProcessingProcessor } from './processors/image-processing.processor';

// Command Handlers
import { UploadFileHandler } from './commands/handlers/upload-file.handler';
import { DeleteFileHandler } from './commands/handlers/delete-file.handler';
import { InitializeChunkedUploadHandler } from './commands/handlers/initialize-chunked-upload.handler';
import { UploadChunkHandler } from './commands/handlers/upload-chunk.handler';
import { CompleteChunkedUploadHandler } from './commands/handlers/complete-chunked-upload.handler';

// Query Handlers
import { GetFileHandler } from './queries/handlers/get-file.handler';
import { GetSignedUrlHandler } from './queries/handlers/get-signed-url.handler';
import { GetUploadProgressHandler } from './queries/handlers/get-upload-progress.handler';

const CommandHandlers = [
  UploadFileHandler,
  DeleteFileHandler,
  InitializeChunkedUploadHandler,
  UploadChunkHandler,
  CompleteChunkedUploadHandler,
];

const QueryHandlers = [
  GetFileHandler,
  GetSignedUrlHandler,
  GetUploadProgressHandler,
];

@Module({
  imports: [
    CqrsModule,
    PrismaModule,
    BullModule.registerQueue({
      name: 'image-processing',
    }),
  ],
  controllers: [FilesController],
  providers: [
    StorageService,
    ImageProcessingService,
    ChunkedUploadService,
    ImageProcessingProcessor,
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [StorageService, ImageProcessingService, ChunkedUploadService],
})
export class FilesModule {}
