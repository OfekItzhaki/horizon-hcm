import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';

export class CreateMaintenanceRequestDto {
  @ApiProperty({ description: 'Building ID', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  buildingId: string;

  @ApiProperty({ description: 'Apartment ID (optional for building-wide requests)', example: 'uuid', required: false })
  @IsOptional()
  @IsString()
  apartmentId?: string;

  @ApiProperty({ description: 'Request title', example: 'Broken elevator' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Detailed description', example: 'The elevator on floor 3 is not working' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ 
    description: 'Category', 
    enum: ['plumbing', 'electrical', 'hvac', 'structural', 'other'],
    example: 'electrical'
  })
  @IsEnum(['plumbing', 'electrical', 'hvac', 'structural', 'other'])
  category: string;

  @ApiProperty({ 
    description: 'Priority level', 
    enum: ['low', 'medium', 'high', 'urgent'],
    example: 'high'
  })
  @IsEnum(['low', 'medium', 'high', 'urgent'])
  priority: string;
}
