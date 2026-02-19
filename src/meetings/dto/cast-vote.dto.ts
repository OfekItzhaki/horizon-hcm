import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CastVoteDto {
  @ApiProperty({ description: 'Selected option', example: 'Yes' })
  @IsString()
  @IsNotEmpty()
  selectedOption: string;
}
