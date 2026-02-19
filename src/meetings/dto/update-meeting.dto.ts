import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class UpdateMeetingDto {
  @ApiProperty({ description: 'Meeting title', example: 'Monthly Committee Meeting', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'Meeting description', example: 'Discuss building maintenance and budget', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Meeting date and time', example: '2026-03-01T18:00:00Z', required: false })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiProperty({ description: 'Meeting location', example: 'Building lobby', required: false })
  @IsOptional()
  @IsString()
  location?: string;
}
