import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteDocumentCommand } from '../impl/delete-document.command';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';

@CommandHandler(DeleteDocumentCommand)
export class DeleteDocumentHandler implements ICommandHandler<DeleteDocumentCommand> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(command: DeleteDocumentCommand) {
    const { documentId, userId } = command;

    // Validate document exists
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Soft delete document
    await this.prisma.document.delete({
      where: { id: documentId },
    });

    // Log audit
    await this.audit_logs.log({
      userId,
      action: 'document.deleted',
      resourceType: 'document',
      resourceId: documentId,
    });

    return { success: true };
  }
}
