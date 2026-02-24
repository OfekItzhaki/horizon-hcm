import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, Min, Max } from 'class-validator';

/**
 * DTO for assigning an owner to an apartment.
 * 
 * Ownership share must not cause total shares to exceed 100%.
 * Setting isPrimary to true will unset other primary owners.
 * 
 * @example
 * ```typescript
 * const dto: AssignOwnerDto = {
 *   userId: 'user-456',
 *   ownershipShare: 50,
 *   isPrimary: true
 * };
 * ```
 */
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
