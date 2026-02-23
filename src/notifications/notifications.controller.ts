import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, CurrentUser } from '@ofeklabs/horizon-auth';
import { PrismaService } from '../prisma/prisma.service';
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
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(
    private commandBus: CommandBus,
    private queryBus: QueryBus,
    private notificationService: NotificationService,
    private prisma: PrismaService,
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
    const command = new CreateTemplateCommand(dto.name, dto.title, dto.body, dto.language || 'en');

    return this.commandBus.execute(command);
  }

  @Get('templates/:name')
  @ApiOperation({ summary: 'Get notification template by name' })
  @ApiResponse({ status: 200, description: 'Template found' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async getTemplate(@Param('name') name: string, @Param('language') language: string = 'en') {
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

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved' })
  async getUnreadCount(@CurrentUser() user: any) {
    const count = await this.prisma.notification_logs.count({
      where: {
        user_id: user.id,
        delivered_at: { not: null },
        // TODO: Add read_at field to track read status
      },
    });

    return { count };
  }

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved' })
  async getNotifications(
    @CurrentUser() user: any,
    @Query('unreadOnly') unreadOnly?: boolean,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    const skip = (page - 1) * limit;

    const where = {
      user_id: user.id,
      delivered_at: { not: null },
      // TODO: Add read_at filter when field exists
    };

    const [notifications, total] = await Promise.all([
      this.prisma.notification_logs.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification_logs.count({ where }),
    ]);

    return {
      data: notifications.map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        type: n.template_name || 'general',
        read: false, // TODO: Use read_at field
        createdAt: n.created_at,
      })),
      total,
      page,
      limit,
    };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead() {
    // TODO: Add read_at field to notification_logs table
    // For now, just return success
    return { message: 'Notification marked as read' };
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead() {
    // TODO: Add read_at field to notification_logs table
    // For now, just return success
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({ status: 200, description: 'Notification deleted' })
  async deleteNotification(@CurrentUser() user: any, @Param('id') id: string) {
    await this.prisma.notification_logs.deleteMany({
      where: {
        id,
        user_id: user.id,
      },
    });

    return { message: 'Notification deleted' };
  }

  @Post('push-token')
  @ApiOperation({ summary: 'Register push notification token' })
  @ApiResponse({ status: 201, description: 'Push token registered' })
  async registerPushToken() {
    // TODO: Store push token in database
    return { message: 'Push token registered successfully' };
  }

  @Delete('push-token')
  @ApiOperation({ summary: 'Unregister push notification token' })
  @ApiResponse({ status: 200, description: 'Push token unregistered' })
  async unregisterPushToken() {
    // TODO: Remove push token from database
    return { message: 'Push token unregistered successfully' };
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update user notification preferences' })
  @ApiResponse({ status: 200, description: 'Preferences updated' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiBearerAuth()
  async updatePreferences(@Request() req, @Body() dto: UpdatePreferencesDto) {
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
