import { Controller, Get, Post, Delete, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TranslationService } from '../services/translation.service';
import { FormattingService } from '../services/formatting.service';

@ApiTags('i18n')
@Controller('i18n')
@ApiBearerAuth()
export class I18nController {
  constructor(
    private readonly translationService: TranslationService,
    private readonly formattingService: FormattingService,
  ) {}

  @Get('translations')
  @ApiOperation({ summary: 'Get translations for a language' })
  async getTranslations(
    @Query('language') language: string,
    @Query('namespace') namespace?: string,
  ) {
    const translations = await this.translationService.getTranslations(
      language,
      namespace,
    );
    return { translations };
  }

  @Post('translations')
  @ApiOperation({ summary: 'Create or update translation' })
  async upsertTranslation(
    @Body()
    body: {
      key: string;
      language: string;
      value: string;
      namespace?: string;
    },
  ) {
    const translation = await this.translationService.createOrUpdateTranslation(
      body.key,
      body.language,
      body.value,
      body.namespace || 'common',
    );
    return { translation };
  }

  @Delete('translations/:id')
  @ApiOperation({ summary: 'Delete translation' })
  async deleteTranslation(@Param('id') id: string) {
    await this.translationService.deleteTranslation(id);
    return { success: true };
  }

  @Get('namespaces')
  @ApiOperation({ summary: 'Get all translation namespaces' })
  async getNamespaces() {
    const namespaces = await this.translationService.getAllNamespaces();
    return { namespaces };
  }

  @Post('format/currency')
  @ApiOperation({ summary: 'Format currency' })
  formatCurrency(
    @Body() body: { amount: number; currency?: string; locale?: string },
  ) {
    const formatted = this.formattingService.formatCurrency(
      body.amount,
      body.currency,
      body.locale,
    );
    return { formatted };
  }

  @Post('format/date')
  @ApiOperation({ summary: 'Format date' })
  formatDate(@Body() body: { date: string; locale?: string }) {
    const formatted = this.formattingService.formatDate(
      new Date(body.date),
      body.locale,
    );
    return { formatted };
  }

  @Post('format/datetime')
  @ApiOperation({ summary: 'Format date and time' })
  formatDateTime(@Body() body: { date: string; locale?: string; timezone?: string }) {
    const date = new Date(body.date);
    const formatted = body.timezone
      ? this.formattingService.formatDateInTimezone(date, body.timezone, body.locale)
      : this.formattingService.formatDateTime(date, body.locale);
    return { formatted };
  }
}
