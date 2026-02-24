import { IsString, IsOptional, IsArray, IsDateString, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePollDto {
  @ApiProperty({ description: 'Poll title', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Poll description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Poll options', type: [String], required: false })
  @IsArray()
  @ArrayMinSize(2, { message: 'Poll must have at least 2 options' })
  @IsString({ each: true })
  @IsOptional()
  options?: string[];

  @ApiProperty({ description: 'Poll end date', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
