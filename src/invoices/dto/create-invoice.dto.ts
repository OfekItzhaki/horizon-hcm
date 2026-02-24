import { IsString, IsNotEmpty, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInvoiceDto {
  @ApiProperty({ description: 'Building ID' })
  @IsString()
  @IsNotEmpty()
  buildingId: string;

  @ApiProperty({ description: 'Apartment ID (optional)' })
  @IsString()
  @IsOptional()
  apartmentId?: string;

  @ApiProperty({ description: 'Invoice title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Invoice description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Invoice amount' })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ description: 'Due date (ISO 8601 format)' })
  @IsDateString()
  dueDate: string;
}
