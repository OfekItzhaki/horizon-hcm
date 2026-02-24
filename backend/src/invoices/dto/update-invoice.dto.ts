import { IsString, IsOptional, IsNumber, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateInvoiceDto {
  @ApiProperty({ description: 'Invoice title', required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'Invoice description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Invoice amount', required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number;

  @ApiProperty({ description: 'Due date (ISO 8601 format)', required: false })
  @IsDateString()
  @IsOptional()
  dueDate?: string;
}
