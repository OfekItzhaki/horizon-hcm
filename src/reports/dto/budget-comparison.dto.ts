import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BudgetComparisonDto {
  @ApiProperty({
    description: 'Start date (ISO 8601 format)',
    example: '2024-01-01',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'End date (ISO 8601 format)',
    example: '2024-12-31',
  })
  @IsDateString()
  endDate: string;
}
