import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterPushTokenDto {
  @ApiProperty({
    description: 'Push notification token',
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Platform type',
    example: 'expo',
    enum: ['expo', 'fcm', 'apns'],
  })
  @IsEnum(['expo', 'fcm', 'apns'])
  @IsNotEmpty()
  platform: 'expo' | 'fcm' | 'apns';

  @ApiProperty({
    description: 'Device name (optional)',
    example: 'iPhone 13 Pro',
    required: false,
  })
  @IsString()
  @IsOptional()
  deviceName?: string;
}
