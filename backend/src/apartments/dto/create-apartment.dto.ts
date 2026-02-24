import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsInt, Min } from 'class-validator';

/**
 * DTO for creating a new apartment in a building.
 * 
 * Apartment number must be unique within the building.
 * Area and floor are optional but recommended for complete records.
 * 
 * @example
 * ```typescript
 * const dto: CreateApartmentDto = {
 *   buildingId: 'building-123',
 *   apartmentNumber: '12A',
 *   areaSqm: 85.5,
 *   floor: 3
 * };
 * ```
 */
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
