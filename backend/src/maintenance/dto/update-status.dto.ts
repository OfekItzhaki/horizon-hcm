import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({ 
    description: 'New status', 
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    example: 'in_progress'
  })
  @IsEnum(['pending', 'in_progress', 'completed', 'cancelled'])
  status: string;
}
