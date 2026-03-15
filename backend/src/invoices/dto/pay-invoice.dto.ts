import { IsEnum, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PayInvoiceDto {
  @ApiProperty({ enum: ['credit_card', 'bank_transfer', 'cash'] })
  @IsEnum(['credit_card', 'bank_transfer', 'cash'])
  method: string;

  @ApiProperty({ example: 1500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;
}
