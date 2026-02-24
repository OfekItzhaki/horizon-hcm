import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SearchField {
  NAME = 'name',
  PHONE = 'phone',
  APARTMENT = 'apartment',
}

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
