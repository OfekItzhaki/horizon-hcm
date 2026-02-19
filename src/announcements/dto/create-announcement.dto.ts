import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsBoolean, IsOptional } from 'class-validator';

export class CreateAnnouncementDto {
  @ApiProperty({ description: 'Building ID', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  buildingId: string;

  @ApiProperty({ description: 'Announcement title', example: 'Building Maintenance Notice' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Announcement content', example: 'The elevator will be under maintenance on Sunday' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ 
    description: 'Category', 
    enum: ['general', 'maintenance', 'financial', 'event', 'emergency'],
    example: 'maintenance'
  })
  @IsEnum(['general', 'maintenance', 'financial', 'event', 'emergency'])
  category: string;

  @ApiProperty({ description: 'Is urgent', example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isUrgent?: boolean;
}
