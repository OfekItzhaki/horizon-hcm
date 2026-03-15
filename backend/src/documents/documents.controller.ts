import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
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
import { PrismaService } from '../prisma/prisma.service';
import { generateId } from '../common/utils/id-generator';

@ApiTags('documents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('buildings/:buildingId/documents')
export class DocumentsController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly prisma: PrismaService,
  ) {}

  @Post('upload')
  @UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
  @ApiOperation({ summary: 'Upload document file (multipart)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocumentFile(
    @CurrentUser() user: any,
    @Param('buildingId') buildingId: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('title') title?: string,
    @Query('category') category?: string,
    @Query('accessLevel') accessLevel?: string,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword', 'text/plain'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('File type not allowed');
    }
    if (file.size > 50 * 1024 * 1024) {
      throw new BadRequestException('File size must be under 50MB');
    }

    // Store file as base64 data URL (no S3 required)
    const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const fileId = generateId();

    await this.prisma.files.create({
      data: {
        id: fileId,
        user_id: user.id,
        filename: file.originalname,
        storage_key: fileId,
        mime_type: file.mimetype,
        size_bytes: file.size,
        url: dataUrl,
        is_public: false,
        is_scanned: true,
        updated_at: new Date(),
      },
    });

    const docTitle = title || file.originalname;
    const docCategory = category || 'other';
    const docAccessLevel = accessLevel || 'all_residents';

    return this.commandBus.execute(
      new UploadDocumentCommand(buildingId, fileId, docTitle, docCategory, docAccessLevel, user.id),
    );
  }

  @Post()
  @UseGuards(BuildingMemberGuard, CommitteeMemberGuard)
  @ApiOperation({ summary: 'Upload document' })
  async uploadDocument(
    @CurrentUser() user: any,
    @Param('buildingId') buildingId: string,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.commandBus.execute(
      new UploadDocumentCommand(
        dto.buildingId || buildingId,
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
    @Param('buildingId') buildingId: string,
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
