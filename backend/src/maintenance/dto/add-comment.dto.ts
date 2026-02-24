import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AddMaintenanceCommentDto {
  @ApiProperty({ description: 'Comment text', example: 'Working on this issue now' })
  @IsString()
  @IsNotEmpty()
  comment: string;
}
