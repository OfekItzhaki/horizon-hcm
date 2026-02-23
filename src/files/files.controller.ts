import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  Request,
  Query,
  ParseIntPipe,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { UploadFileCommand } from './commands/impl/upload-file.command';
import { DeleteFileCommand } from './commands/impl/delete-file.command';
import { InitializeChunkedUploadCommand } from './commands/impl/initialize-chunked-upload.command';
import { UploadChunkCommand } from './commands/impl/upload-chunk.command';
import { CompleteChunkedUploadCommand } from './commands/impl/complete-chunked-upload.command';
import { GetFileQuery } from './queries/impl/get-file.query';
import { GetSignedUrlQuery } from './queries/impl/get-signed-url.query';
import { GetUploadProgressQuery } from './queries/impl/get-upload-progress.query';
import { InitializeChunkedUploadDto } from './dto/initialize-chunked-upload.dto';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        isPublic: {
          type: 'boolean',
          default: false,
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @ApiBearerAuth()
  async uploadFile(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Query('isPublic') isPublic: boolean = false,
  ) {
    const userId = req.user?.id || req.user?.sub;

    const command = new UploadFileCommand(userId, file, isPublic);
    return this.commandBus.execute(command);
  }

  @Post('chunked/initialize')
  @ApiOperation({ summary: 'Initialize chunked upload' })
  @ApiResponse({ status: 201, description: 'Chunked upload initialized' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiBearerAuth()
  async initializeChunkedUpload(@Request() req, @Body() dto: InitializeChunkedUploadDto) {
    const userId = req.user?.id || req.user?.sub;

    const command = new InitializeChunkedUploadCommand(
      userId,
      dto.filename,
      dto.totalChunks,
      dto.totalSize,
      dto.mimeType,
    );

    return this.commandBus.execute(command);
  }

  @Post('chunked/:uploadId/chunk/:chunkIndex')
  @UseInterceptors(FileInterceptor('chunk'))
  @ApiOperation({ summary: 'Upload a chunk' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        chunk: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Chunk uploaded successfully' })
  @ApiResponse({ status: 404, description: 'Upload session not found' })
  @ApiBearerAuth()
  async uploadChunk(
    @Request() req,
    @Param('uploadId') uploadId: string,
    @Param('chunkIndex', ParseIntPipe) chunkIndex: number,
    @UploadedFile() chunk: Express.Multer.File,
  ) {
    const userId = req.user?.id || req.user?.sub;

    const command = new UploadChunkCommand(userId, uploadId, chunkIndex, chunk.buffer);

    return this.commandBus.execute(command);
  }

  @Post('chunked/:uploadId/complete')
  @ApiOperation({ summary: 'Complete chunked upload' })
  @ApiResponse({ status: 200, description: 'Upload completed successfully' })
  @ApiResponse({ status: 400, description: 'Not all chunks uploaded' })
  @ApiBearerAuth()
  async completeChunkedUpload(
    @Request() req,
    @Param('uploadId') uploadId: string,
    @Query('isPublic') isPublic: boolean = false,
  ) {
    const userId = req.user?.id || req.user?.sub;

    const command = new CompleteChunkedUploadCommand(userId, uploadId, isPublic);
    return this.commandBus.execute(command);
  }

  @Get('chunked/:uploadId/progress')
  @ApiOperation({ summary: 'Get upload progress' })
  @ApiResponse({ status: 200, description: 'Progress retrieved' })
  @ApiResponse({ status: 404, description: 'Upload session not found' })
  @ApiBearerAuth()
  async getUploadProgress(@Request() req, @Param('uploadId') uploadId: string) {
    const userId = req.user?.id || req.user?.sub;

    const query = new GetUploadProgressQuery(uploadId, userId);
    return this.queryBus.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get file metadata' })
  @ApiResponse({ status: 200, description: 'File metadata retrieved' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiBearerAuth()
  async getFile(@Request() req, @Param('id') fileId: string) {
    const userId = req.user?.id || req.user?.sub;

    const query = new GetFileQuery(fileId, userId);
    return this.queryBus.execute(query);
  }

  @Get(':id/signed-url')
  @ApiOperation({ summary: 'Get signed URL for file access' })
  @ApiResponse({ status: 200, description: 'Signed URL generated' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiBearerAuth()
  async getSignedUrl(
    @Request() req,
    @Param('id') fileId: string,
    @Query('expiresIn', new ParseIntPipe({ optional: true }))
    expiresIn: number = 3600,
  ) {
    const userId = req.user?.id || req.user?.sub;

    const query = new GetSignedUrlQuery(fileId, userId, expiresIn);
    return this.queryBus.execute(query);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a file' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiBearerAuth()
  async deleteFile(@Request() req, @Param('id') fileId: string) {
    const userId = req.user?.id || req.user?.sub;

    const command = new DeleteFileCommand(fileId, userId);
    return this.commandBus.execute(command);
  }
}
