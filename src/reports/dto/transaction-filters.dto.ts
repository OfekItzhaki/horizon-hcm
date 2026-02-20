import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { DateRangeDto } from './date-range.dto';

export class TransactionFiltersDto extends DateRangeDto {
  @ApiPropertyOptional({
    description: 'Transaction type filter',
    example: 'monthly_fee',
    enum: ['monthly_fee', 'special_assessment'],
  })
  @IsOptional()
  @IsString()
  transactionType?: string;

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
    description: 'Items per page',
    example: 50,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}
