import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

export class AddAgendaItemDto {
  @ApiProperty({ description: 'Agenda item title', example: 'Budget approval' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Agenda item description', example: 'Review and approve 2026 budget', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Order in agenda', example: 1 })
  @IsNumber()
  order: number;
}
