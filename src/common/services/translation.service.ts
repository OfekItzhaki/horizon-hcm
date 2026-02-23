import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TranslationService {
  constructor(private readonly prisma: PrismaService) {}

  async createOrUpdateTranslation(
    key: string,
    language: string,
    value: string,
    namespace: string = 'common',
  ) {
    return this.prisma.translations.upsert({
      where: {
        key_language_namespace: {
          key,
          language,
          namespace,
        },
      },
      create: {
        key,
        language,
        value,
        namespace,
      },
      update: {
        value,
      },
    });
  }

  async getTranslations(language: string, namespace?: string) {
    const where: any = { language };
    if (namespace) {
      where.namespace = namespace;
    }

    return this.prisma.translations.findMany({
      where,
      orderBy: { key: 'asc' },
    });
  }

  async deleteTranslation(id: string) {
    return this.prisma.translations.delete({
      where: { id },
    });
  }

  async getAllNamespaces() {
    const result = await this.prisma.translations.findMany({
      distinct: ['namespace'],
      select: { namespace: true },
    });

    return result.map((r) => r.namespace);
  }
}
