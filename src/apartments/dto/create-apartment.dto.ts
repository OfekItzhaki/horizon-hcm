import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt, Min } from 'class-validator';

export class CreateApartmentDto {
  @ApiProperty({ description: 'Building ID', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  buildingId: string;

  @ApiProperty({ description: 'Apartment number', example: '12A' })
  @IsString()
  @IsNotEmpty()
  apartmentNumber: string;

  @ApiProperty({ description: 'Area in square meters', example: 85.5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  areaSqm?: number;

  @ApiProperty({ description: 'Floor number', example: 3, required: false })
  @IsOptional()
  @IsInt()
  floor?: number;
}
