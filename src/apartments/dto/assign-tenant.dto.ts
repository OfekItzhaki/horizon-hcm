import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class AssignTenantDto {
  @ApiProperty({ description: 'User ID of the tenant', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Move-in date', example: '2024-01-01', required: false })
  @IsOptional()
  @IsDateString()
  moveInDate?: string;
}
