import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Filter options for user type in resident listings.
 */
export enum UserTypeFilter {
  COMMITTEE = 'COMMITTEE',
  OWNER = 'OWNER',
  TENANT = 'TENANT',
}

/**
 * DTO for listing building residents with pagination and filtering.
 * 
 * Supports filtering by name, phone, user type, and apartment number.
 * Results are paginated with a maximum of 100 items per page.
 * 
 * @example
 * ```typescript
 * const dto: ListResidentsDto = {
 *   page: 1,
 *   limit: 20,
 *   search: 'John',
 *   userType: UserTypeFilter.OWNER
 * };
 * ```
 */
export class ListResidentsDto {
  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page (max 100)',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Search term for name or phone',
    example: 'John',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by user type',
    enum: UserTypeFilter,
    example: UserTypeFilter.OWNER,
  })
  @IsOptional()
  @IsEnum(UserTypeFilter)
  userType?: UserTypeFilter;

  @ApiPropertyOptional({
    description: 'Filter by apartment number',
    example: '101',
  })
  @IsOptional()
  @IsString()
  apartmentNumber?: string;

  @ApiPropertyOptional({
    description: 'Filter by phone number',
    example: '050-1234567',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
