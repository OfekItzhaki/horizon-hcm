import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AddCommentDto {
  @ApiProperty({ description: 'Comment text', example: 'Thank you for the update' })
  @IsString()
  @IsNotEmpty()
  comment: string;
}
