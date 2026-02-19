import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsInt, Min, IsBoolean } from 'class-validator';

export class UpdateApartmentDto {
  @ApiProperty({ description: 'Area in square meters', example: 85.5, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  areaSqm?: number;

  @ApiProperty({ description: 'Floor number', example: 3, required: false })
  @IsOptional()
  @IsInt()
  floor?: number;

  @ApiProperty({ description: 'Vacancy status', example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isVacant?: boolean;
}
