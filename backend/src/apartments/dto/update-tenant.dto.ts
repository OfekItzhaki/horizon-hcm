import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class UpdateTenantDto {
  @ApiProperty({ description: 'Move-out date', example: '2024-12-31', required: false })
  @IsOptional()
  @IsDateString()
  moveOutDate?: string;

  @ApiProperty({ description: 'Is tenant active?', example: false, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
