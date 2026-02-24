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
import { CurrentUser, JwtAuthGuard } from '@ofeklabs/horizon-auth';
import { BuildingMemberGuard } from '../common/guards/building-member.guard';
import { CommitteeMemberGuard } from '../common/guards/committee-member.guard';
import { ResourceOwnerGuard } from '../common/guards/resource-owner.guard';
import { ResourceType } from '../common/decorators/resource-type.decorator';
import { UploadDocumentDto } from './dto/upload-document.dto';
import { UploadDocumentCommand } from './commands/impl/upload-document.command';
import { DeleteDocumentCommand } from './commands/impl/delete-document.command';
import { GetDocumentQuery } from './queries/impl/get-document.query';
import { ListDocumentsQuery } from './queries/impl/list-documents.query';

@ApiTags('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post()
  @UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
  @ApiOperation({ summary: 'Upload document' })
  async uploadDocument(@CurrentUser() user: any, @Body() dto: UploadDocumentDto) {
    return this.commandBus.execute(
      new UploadDocumentCommand(
        dto.buildingId,
        dto.fileId,
        dto.title,
        dto.category,
        dto.accessLevel,
        user.id,
        dto.previousVersionId,
      ),
    );
  }

  @Delete(':id')
  @UseGuards(ResourceOwnerGuard)
  @ResourceType('Document')
  @ApiOperation({ summary: 'Delete document' })
  async deleteDocument(@CurrentUser() user: any, @Param('id') id: string) {
    return this.commandBus.execute(new DeleteDocumentCommand(id, user.id));
  }

  @Get(':id')
  @UseGuards(BuildingMemberGuard)
  @ApiOperation({ summary: 'Get document details' })
  async getDocument(@CurrentUser() user: any, @Param('id') id: string) {
    return this.queryBus.execute(new GetDocumentQuery(id));
  }

  @Get()
  @UseGuards(BuildingMemberGuard)
  @ApiOperation({ summary: 'List documents' })
  async listDocuments(
    @CurrentUser() user: any,
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
