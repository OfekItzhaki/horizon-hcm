import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { GetDocumentQuery } from '../impl/get-document.query';
import { PrismaService } from '../../../prisma/prisma.service';
import { AuditLogService } from '../../../common/services/audit-log.service';

@QueryHandler(GetDocumentQuery)
export class GetDocumentHandler implements IQueryHandler<GetDocumentQuery> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async execute(query: GetDocumentQuery) {
    const { documentId } = query;

    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        building: true,
      },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Log document access
    // TODO: Get userId from context
    await this.audit_logs.log({
      userId: 'system',
      action: 'document.accessed',
      resourceType: 'document',
      resourceId: documentId,
    });

    return document;
  }
}
