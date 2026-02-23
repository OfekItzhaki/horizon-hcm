import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { GetTemplateQuery } from '../impl/get-template.query';

@Injectable()
@QueryHandler(GetTemplateQuery)
export class GetTemplateHandler implements IQueryHandler<GetTemplateQuery> {
  constructor(private prisma: PrismaService) {}

  async execute(query: GetTemplateQuery) {
    const { name, language } = query;

    // Try to find template in requested language
    let template = await this.prisma.notification_templates.findFirst({
      where: {
        name,
        language,
        is_active: true,
      },
    });

    // Fallback to English if not found
    if (!template && language !== 'en') {
      template = await this.prisma.notification_templates.findFirst({
        where: {
          name,
          language: 'en',
          is_active: true,
        },
      });
    }

    if (!template) {
      throw new NotFoundException(`Template '${name}' not found for language '${language}'`);
    }

    return template;
  }
}
