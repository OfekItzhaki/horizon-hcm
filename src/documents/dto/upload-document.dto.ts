import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';

export class UploadDocumentDto {
  @ApiProperty({ description: 'Building ID', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  buildingId: string;

  @ApiProperty({ description: 'File ID from file storage service', example: 'uuid' })
  @IsString()
  @IsNotEmpty()
  fileId: string;

  @ApiProperty({ description: 'Document title', example: 'Building Contract 2026' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ 
    description: 'Document category', 
    enum: ['contract', 'invoice', 'meeting_minutes', 'regulation', 'other'],
    example: 'contract'
  })
  @IsEnum(['contract', 'invoice', 'meeting_minutes', 'regulation', 'other'])
  category: string;

  @ApiProperty({ 
    description: 'Access level', 
    enum: ['committee_only', 'all_residents'],
    example: 'committee_only'
  })
  @IsEnum(['committee_only', 'all_residents'])
  accessLevel: string;

  @ApiProperty({ description: 'Previous version ID for versioning', example: 'uuid', required: false })
  @IsOptional()
  @IsString()
  previousVersionId?: string;
}
