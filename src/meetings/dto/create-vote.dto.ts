import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class CreateVoteDto {
  @ApiProperty({ description: 'Vote question', example: 'Approve 2026 budget?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ description: 'Vote options', type: [String], example: ['Yes', 'No', 'Abstain'] })
  @IsArray()
  @IsString({ each: true })
  options: string[];
}
