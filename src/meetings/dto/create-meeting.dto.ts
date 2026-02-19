import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString, IsArray, IsOptional } from 'class-validator';

export class CreateMeetingDto {
  @ApiProperty({ description: 'Building ID', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  buildingId: string;

  @ApiProperty({ description: 'Meeting title', example: 'Monthly Committee Meeting' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Meeting description', example: 'Discuss building maintenance and budget' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Meeting date and time', example: '2026-03-01T18:00:00Z' })
  @IsDateString()
  scheduledAt: string;

  @ApiProperty({ description: 'Meeting location', example: 'Building lobby' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ description: 'Attendee user IDs', type: [String], example: ['uuid1', 'uuid2'] })
  @IsArray()
  @IsString({ each: true })
  attendeeIds: string[];
}
