import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Available fields for resident search.
 */
export enum SearchField {
  NAME = 'name',
  PHONE = 'phone',
  APARTMENT = 'apartment',
}

/**
 * DTO for searching residents by specific fields.
 * 
 * Performs case-insensitive search across name, phone, or apartment number.
 * 
 * @example
 * ```typescript
 * const dto: SearchResidentsDto = {
 *   searchTerm: 'John',
 *   searchField: SearchField.NAME
 * };
 * ```
 */
export class SearchResidentsDto {
  @ApiProperty({
    description: 'Search term',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  searchTerm: string;

  @ApiPropertyOptional({
    description: 'Field to search in',
    enum: SearchField,
    example: SearchField.NAME,
  })
  @IsOptional()
  @IsEnum(SearchField)
  searchField?: SearchField = SearchField.NAME;
}
