import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UploadDocumentCommand } from './commands/impl/upload-document.command';
import { DeleteDocumentCommand } from './commands/impl/delete-document.command';
import { GetDocumentQuery } from './queries/impl/get-document.query';
import { ListDocumentsQuery } from './queries/impl/list-documents.query';

@ApiTags('documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Upload document' })
  async uploadDocument(@Body() dto: UploadDocumentDto) {
    // TODO: Get uploadedBy from authenticated user context
    const uploadedBy = 'current-user-id'; // Placeholder
    return this.commandBus.execute(
      new UploadDocumentCommand(
        dto.buildingId,
        dto.fileId,
        dto.title,
        dto.category,
        dto.accessLevel,
        uploadedBy,
        dto.previousVersionId,
      ),
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete document' })
  async deleteDocument(@Param('id') id: string) {
    // TODO: Get userId from authenticated user context
    const userId = 'current-user-id'; // Placeholder
    return this.commandBus.execute(new DeleteDocumentCommand(id, userId));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document details' })
  async getDocument(@Param('id') id: string) {
    return this.queryBus.execute(new GetDocumentQuery(id));
  }

  @Get()
  @ApiOperation({ summary: 'List documents' })
  async listDocuments(
    @Query('buildingId') buildingId: string,
    @Query('category') category?: string,
    @Query('accessLevel') accessLevel?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.queryBus.execute(
      new ListDocumentsQuery(
        buildingId,
        category,
        accessLevel,
        page ? parseInt(page) : 1,
        limit ? parseInt(limit) : 20,
      ),
    );
  }
}
