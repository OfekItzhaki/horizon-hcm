import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePreferencesDto {
  @ApiProperty({
    description: 'Enable/disable payment reminder notifications',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  paymentReminders?: boolean;

  @ApiProperty({
    description: 'Enable/disable maintenance alert notifications',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  maintenanceAlerts?: boolean;

  @ApiProperty({
    description: 'Enable/disable meeting notifications',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  meetingNotifications?: boolean;

  @ApiProperty({
    description: 'Enable/disable general announcement notifications',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  generalAnnouncements?: boolean;

  @ApiProperty({
    description: 'Enable/disable push notifications',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  pushEnabled?: boolean;

  @ApiProperty({
    description: 'Enable/disable email notifications',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  emailEnabled?: boolean;
}
