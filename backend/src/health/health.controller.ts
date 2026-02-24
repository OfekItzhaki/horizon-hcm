import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({
    status: 200,
    description: 'Application is healthy',
  })
  @ApiResponse({
    status: 503,
    description: 'Application is unhealthy',
  })
  async getHealth(@Res() res: Response) {
    const health = await this.healthService.checkHealth();

    const statusCode =
      health.status === 'healthy'
        ? HttpStatus.OK
        : HttpStatus.SERVICE_UNAVAILABLE;

    return res.status(statusCode).json(health);
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check for Kubernetes' })
  @ApiResponse({
    status: 200,
    description: 'Application is ready to receive traffic',
  })
  @ApiResponse({
    status: 503,
    description: 'Application is not ready',
  })
  async getReadiness(@Res() res: Response) {
    const readiness = await this.healthService.checkReadiness();

    const statusCode =
      readiness.status === 'ready'
        ? HttpStatus.OK
        : HttpStatus.SERVICE_UNAVAILABLE;

    return res.status(statusCode).json(readiness);
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness check for Kubernetes' })
  @ApiResponse({
    status: 200,
    description: 'Application is alive',
  })
  async getLiveness() {
    // Simple liveness check - if this endpoint responds, the app is alive
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: this.healthService.getUptime(),
    };
  }
}
