import { Controller, Post, Get, Body, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from '../services/analytics.service';
import { FeatureFlagService } from '../services/feature-flag.service';

@ApiTags('Analytics')
@Controller('analytics')
// @UseGuards(JwtAuthGuard) // Uncomment when auth is integrated
@ApiBearerAuth()
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly featureFlagService: FeatureFlagService,
  ) {}

  @Post('events')
  @ApiOperation({
    summary: 'Track an analytics event',
    description: 'Records an analytics event for tracking user behavior',
  })
  async trackEvent(
    @Body() body: { eventName: string; eventData?: any },
    @Request() req: any,
  ) {
    // TODO: Get userId from authenticated request
    const userId = req.user?.id;

    await this.analyticsService.trackEvent(
      body.eventName,
      userId,
      body.eventData,
      req,
    );

    return { success: true, message: 'Event tracked successfully' };
  }

  @Post('features/track')
  @ApiOperation({
    summary: 'Track feature usage',
    description: 'Records usage of a specific feature',
  })
  async trackFeatureUsage(
    @Body() body: { featureName: string },
    @Request() req: any,
  ) {
    // TODO: Get userId from authenticated request
    const userId = req.user?.id || 'test-user-id';

    await this.analyticsService.trackFeatureUsage(body.featureName, userId);

    return { success: true, message: 'Feature usage tracked successfully' };
  }

  @Get('events')
  @ApiOperation({
    summary: 'Get user events',
    description: 'Retrieves analytics events for the authenticated user',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getUserEvents(
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    // TODO: Get userId from authenticated request
    const userId = req.user?.id || 'test-user-id';

    const events = await this.analyticsService.getUserEvents(
      userId,
      limit ? parseInt(limit) : 100,
      offset ? parseInt(offset) : 0,
    );

    return { events };
  }

  @Get('features/usage')
  @ApiOperation({
    summary: 'Get feature usage statistics',
    description: 'Returns usage statistics for features',
  })
  @ApiQuery({ name: 'featureName', required: false, type: String })
  async getFeatureUsageStats(@Query('featureName') featureName?: string) {
    const stats = await this.analyticsService.getFeatureUsageStats(featureName);
    return { stats };
  }

  @Get('features/user')
  @ApiOperation({
    summary: 'Get user feature usage',
    description: 'Returns feature usage for the authenticated user',
  })
  async getUserFeatureUsage(@Request() req: any) {
    // TODO: Get userId from authenticated request
    const userId = req.user?.id || 'test-user-id';

    const usage = await this.analyticsService.getUserFeatureUsage(userId);
    return { usage };
  }

  @Get('events/counts')
  @ApiOperation({
    summary: 'Get event counts',
    description: 'Returns event counts grouped by event name',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getEventCounts(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const counts = await this.analyticsService.getEventCounts(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return { counts };
  }

  @Get('users/active')
  @ApiOperation({
    summary: 'Get active users count',
    description: 'Returns count of active users in a date range',
  })
  @ApiQuery({ name: 'startDate', required: true, type: String })
  @ApiQuery({ name: 'endDate', required: true, type: String })
  async getActiveUsersCount(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    const count = await this.analyticsService.getActiveUsersCount(
      new Date(startDate),
      new Date(endDate),
    );

    return { count, startDate, endDate };
  }

  @Get('performance/summary')
  @ApiOperation({
    summary: 'Get performance summary',
    description: 'Returns performance metrics summary for endpoints',
  })
  @ApiQuery({ name: 'endpoint', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getPerformanceSummary(
    @Query('endpoint') endpoint?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const where: any = {};

    if (endpoint) {
      where.endpoint = { contains: endpoint };
    }

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = new Date(startDate);
      if (endDate) where.created_at.lte = new Date(endDate);
    }

    const metrics = await this.analyticsService.getPerformanceMetrics(where);

    return { metrics };
  }

  @Get('performance/slow-endpoints')
  @ApiOperation({
    summary: 'Get slow endpoints',
    description: 'Returns endpoints with response times above threshold',
  })
  @ApiQuery({ name: 'threshold', required: false, type: Number })
  async getSlowEndpoints(@Query('threshold') threshold?: string) {
    const thresholdMs = threshold ? parseInt(threshold) : 1000;
    const slowEndpoints = await this.analyticsService.getSlowEndpoints(thresholdMs);

    return { slowEndpoints, threshold: thresholdMs };
  }

  @Get('feature-flags')
  @ApiOperation({
    summary: 'Get all feature flags',
    description: 'Returns all feature flags and their status',
  })
  async getAllFeatureFlags() {
    const flags = await this.featureFlagService.getAllFeatureFlags();
    return { flags };
  }

  @Post('feature-flags')
  @ApiOperation({
    summary: 'Create or update feature flag',
    description: 'Creates or updates a feature flag configuration',
  })
  async upsertFeatureFlag(
    @Body()
    body: {
      name: string;
      description?: string;
      isEnabled: boolean;
      variants?: any;
      rules?: any;
    },
  ) {
    const flag = await this.featureFlagService.upsertFeatureFlag(body);
    return { flag };
  }

  @Get('feature-flags/:name/check')
  @ApiOperation({
    summary: 'Check if feature is enabled',
    description: 'Checks if a feature flag is enabled for the current user',
  })
  async checkFeatureFlag(
    @Request() req: any,
    @Query('name') name: string,
  ) {
    // TODO: Get userId from authenticated request
    const userId = req.user?.id;

    const isEnabled = await this.featureFlagService.isEnabled(name, userId);

    return { name, isEnabled };
  }

  @Get('feature-flags/:name/variant')
  @ApiOperation({
    summary: 'Get feature variant',
    description: 'Gets the assigned variant for A/B testing',
  })
  async getFeatureVariant(
    @Request() req: any,
    @Query('name') name: string,
  ) {
    // TODO: Get userId from authenticated request
    const userId = req.user?.id || 'test-user-id';

    const variant = await this.featureFlagService.getVariant(name, userId);

    return { name, variant };
  }
}
