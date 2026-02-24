import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdateUserPreferencesDto {
  @ApiProperty({ description: 'Preferred language', required: false })
  @IsString()
  @IsOptional()
  @IsIn(['en', 'he'])
  language?: string;

  @ApiProperty({ description: 'Theme preference', required: false })
  @IsString()
  @IsOptional()
  @IsIn(['light', 'dark'])
  theme?: string;
}
