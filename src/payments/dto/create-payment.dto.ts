import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsDateString, IsOptional, IsEnum, Min } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Apartment ID', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  apartmentId: string;

  @ApiProperty({ description: 'Payment amount', example: 500.00 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: 'Due date', example: '2024-03-01' })
  @IsDateString()
  dueDate: string;

  @ApiProperty({ description: 'Payment type', enum: ['monthly_fee', 'special_assessment'] })
  @IsEnum(['monthly_fee', 'special_assessment'])
  paymentType: string;

  @ApiProperty({ description: 'Payment description', example: 'Monthly maintenance fee', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Reference number', example: 'INV-2024-001', required: false })
  @IsOptional()
  @IsString()
  referenceNumber?: string;
}
