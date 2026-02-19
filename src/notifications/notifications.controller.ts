import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { SendTemplatedNotificationDto } from './dto/send-templated-notification.dto';
import { NotificationService } from './services/notification.service';
import { CreateTemplateCommand } from './commands/impl/create-template.command';
import { UpdatePreferencesCommand } from './commands/impl/update-preferences.command';
import { GetTemplateQuery } from './queries/impl/get-template.query';
import { GetPreferencesQuery } from './queries/impl/get-preferences.query';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
    private notificationService: NotificationService,
  ) {}

  @Post('send')
  @ApiOperation({ summary: 'Send templated notification to user' })
  @ApiResponse({ status: 201, description: 'Notification queued successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiBearerAuth()
  async sendNotification(@Body() dto: SendTemplatedNotificationDto) {
    await this.notificationService.sendTemplatedNotification(dto);
    return { message: 'Notification queued successfully' };
  }

  @Post('templates')
  @ApiOperation({ summary: 'Create notification template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiBearerAuth()
  async createTemplate(@Body() dto: CreateTemplateDto) {
    const command = new CreateTemplateCommand(
      dto.name,
      dto.title,
      dto.body,
      dto.language || 'en',
    );

    return this.commandBus.execute(command);
  }

  @Get('templates/:name')
  @ApiOperation({ summary: 'Get notification template by name' })
  @ApiResponse({ status: 200, description: 'Template found' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getTemplate(
    @Param('name') name: string,
    @Param('language') language: string = 'en',
  ) {
    const query = new GetTemplateQuery(name, language);
    return this.queryBus.execute(query);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences retrieved' })
  @ApiBearerAuth()
  async getPreferences(@Request() req) {
    const userId = req.user?.id || req.user?.sub;
    const query = new GetPreferencesQuery(userId);
    return this.queryBus.execute(query);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update user notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiBearerAuth()
  async updatePreferences(
    @Request() req,
    @Body() dto: UpdatePreferencesDto,
  ) {
    const userId = req.user?.id || req.user?.sub;
    
    const command = new UpdatePreferencesCommand(
      userId,
      dto.paymentReminders,
      dto.maintenanceAlerts,
      dto.meetingNotifications,
      dto.generalAnnouncements,
      dto.pushEnabled,
      dto.emailEnabled,
    );

    return this.commandBus.execute(command);
  }
}
