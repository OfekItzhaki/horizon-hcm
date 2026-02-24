import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelInvoiceDto {
  @ApiProperty({ description: 'Cancellation reason' })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
