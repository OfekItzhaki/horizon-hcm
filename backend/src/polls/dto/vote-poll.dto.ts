import { IsArray, IsString, ArrayMinSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VotePollDto {
  @ApiProperty({ description: 'Selected option IDs', type: [String] })
  @IsArray()
  @ArrayMinSize(1, { message: 'Must select at least one option' })
  @IsString({ each: true })
  optionIds: string[];
}
