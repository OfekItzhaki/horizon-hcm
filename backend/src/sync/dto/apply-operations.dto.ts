import { IsArray, IsString, IsDateString, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class SyncOperationDto {
  @ApiProperty({
    description: 'Entity type',
    example: 'building',
  })
  @IsString()
  entityType: string;

  @ApiProperty({
    description: 'Operation type',
    enum: ['create', 'update', 'delete'],
    example: 'update',
  })
  @IsEnum(['create', 'update', 'delete'])
  operation: 'create' | 'update' | 'delete';

  @ApiProperty({
    description: 'Entity data',
    example: { id: '123', name: 'Building A' },
  })
  data: any;

  @ApiProperty({
    description: 'Client timestamp when operation was created',
    example: '2026-02-19T10:00:00.000Z',
  })
  @IsDateString()
  clientTimestamp: string;
}

export class ApplyOperationsDto {
  @ApiProperty({
    description: 'Array of sync operations to apply',
    type: [SyncOperationDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncOperationDto)
  operations: SyncOperationDto[];
}
