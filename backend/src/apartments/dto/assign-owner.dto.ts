import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';

export class AssignOwnerDto {
  @ApiProperty({ description: 'User ID of the owner', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Ownership share percentage', example: 50, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  ownershipShare?: number;

  @ApiProperty({ description: 'Is this the primary owner?', example: true, required: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
