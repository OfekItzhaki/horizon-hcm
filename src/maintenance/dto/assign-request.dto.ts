import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AssignRequestDto {
  @ApiProperty({ description: 'Service provider or committee member ID', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  assignedTo: string;
}
