import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class CreateBuildingDto {
  @ApiPropertyOptional({ description: 'Building name or label' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Full address or main address line' })
  @IsNotEmpty()
  @IsString()
  addressLine: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Postal/ZIP code' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Number of residential units' })
  @IsOptional()
  @IsInt()
  @Min(1)
  numUnits?: number;
}
