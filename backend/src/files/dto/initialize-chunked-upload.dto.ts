import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsNotEmpty, Min } from 'class-validator';

export class InitializeChunkedUploadDto {
  @ApiProperty({
    description: 'Original filename',
    example: 'large-video.mp4',
  })
  @IsString()
  @IsNotEmpty()
  filename: string;

  @ApiProperty({
    description: 'Total number of chunks',
    example: 10,
  })
  @IsNumber()
  @Min(1)
  totalChunks: number;

  @ApiProperty({
    description: 'Total file size in bytes',
    example: 52428800,
  })
  @IsNumber()
  @Min(1)
  totalSize: number;

  @ApiProperty({
    description: 'MIME type',
    example: 'video/mp4',
  })
  @IsString()
  @IsNotEmpty()
  mimeType: string;
}
