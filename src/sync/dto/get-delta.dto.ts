import { IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetDeltaDto {
  @ApiProperty({
    description: 'Entity type to sync',
    example: 'building',
    enum: ['building', 'apartment', 'user_profile'],
  })
  @IsString()
  entityType: string;

  @ApiProperty({
    description: 'Last sync timestamp (ISO 8601)',
    example: '2026-02-19T10:00:00.000Z',
  })
  @IsDateString()
  lastSyncTimestamp: string;
}
