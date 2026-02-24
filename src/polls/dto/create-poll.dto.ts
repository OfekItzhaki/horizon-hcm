import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsBoolean,
  IsOptional,
  IsDateString,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePollDto {
  @ApiProperty({ description: 'Poll title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Poll description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Poll options', type: [String] })
  @IsArray()
  @ArrayMinSize(2, { message: 'Poll must have at least 2 options' })
  @IsString({ each: true })
  options: string[];

  @ApiProperty({ description: 'Allow multiple selections', default: false })
  @IsBoolean()
  @IsOptional()
  allowMultiple?: boolean;

  @ApiProperty({ description: 'Anonymous voting', default: false })
  @IsBoolean()
  @IsOptional()
  isAnonymous?: boolean;

  @ApiProperty({ description: 'Poll end date' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;
}
