import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, IsOptional, IsBoolean } from 'class-validator';

export class SendTemplatedNotificationDto {
  @ApiProperty({
    description: 'User ID to send notification to',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Template name',
    example: 'payment_reminder',
  })
  @IsString()
  @IsNotEmpty()
  templateName: string;

  @ApiProperty({
    description: 'Variables to substitute in template',
    example: { amount: '$100', dueDate: '2026-03-01', userName: 'John' },
  })
  @IsObject()
  variables: Record<string, any>;

  @ApiProperty({
    description: 'Language code',
    example: 'en',
    required: false,
  })
  @IsString()
  @IsOptional()
  language?: string;

  @ApiProperty({
    description: 'Send as silent notification (no alert, for background sync)',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  silent?: boolean;
}
