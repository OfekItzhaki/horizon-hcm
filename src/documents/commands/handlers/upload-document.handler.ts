import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UploadDocumentCommand } from '../impl/upload-document.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(UploadDocumentCommand)
export class UploadDocumentHandler implements ICommandHandler<UploadDocumentCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(command: UploadDocumentCommand) {
    const { buildingId, fileId, title, category, accessLevel, uploadedBy, previousVersionId } =
      command;

    // Validate building exists
    const building = await this.prisma.buildings.findUnique({
      where: { id: buildingId },
    });

    if (!building) {
      throw new Error('Building not found');
    }

    // Validate file exists
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Determine version number
    let version = 1;
    if (previousVersionId) {
      const previousDoc = await this.prisma.documents.findUnique({
        where: { id: previousVersionId },
      });
      if (previousDoc) {
        version = previousDoc.version + 1;
      }
    }

    // Create document
    const document = await this.prisma.documents.create({
      data: {
        building_id: buildingId,
        file_id: fileId,
        title,
        category,
        access_level: accessLevel,
        version,
        previous_version_id: previousVersionId,
        uploaded_by: uploadedBy,
      },
    });

    // Log audit
    await this.auditLog.log({
      userId: uploadedBy,
      action: 'document.uploaded',
      resourceType: 'document',
      resourceId: document.id,
    });

    // TODO: Send notification to residents if access_level is "all_residents"

    return document;
  }
}
