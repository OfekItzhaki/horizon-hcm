import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';

export class CreateTemplateDto {
  @ApiProperty({
    description: 'Unique template name (e.g., payment_reminder)',
    example: 'payment_reminder',
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name: string;

  @ApiProperty({
    description: 'Template title with variables (e.g., Payment Due: {{amount}})',
    example: 'Payment Due: {{amount}}',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  title: string;

  @ApiProperty({
    description: 'Template body with variables',
    example: 'Dear {{userName}}, your payment of {{amount}} is due on {{dueDate}}.',
  })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({
    description: 'Language code (en, he, etc.)',
    example: 'en',
    default: 'en',
  })
  @IsString()
  @IsOptional()
  @Length(2, 5)
  language?: string = 'en';
}
