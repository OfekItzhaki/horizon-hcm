import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as sharp from 'sharp';
import { LoggerService } from '../../common/logger/logger.service';

export interface ImageProcessingOptions {
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  generateThumbnails?: boolean;
}

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface ThumbnailSet {
  small: ProcessedImage; // 150x150
  medium: ProcessedImage; // 300x300
  large: ProcessedImage; // 600x600
}

@Injectable()
export class ImageProcessingService {
  private readonly thumbnailSizes = {
    small: 150,
    medium: 300,
    large: 600,
  };

  constructor(
    @InjectQueue('image-processing') private imageQueue: Queue,
    private logger: LoggerService,
  ) {}

  /**
   * Queue image for async processing
   */
  async queueImageProcessing(
    fileId: string,
    buffer: Buffer,
    options: ImageProcessingOptions = {},
  ): Promise<void> {
    await this.imageQueue.add(
      'process-image',
      {
        fileId,
        buffer: buffer.toString('base64'), // Convert to base64 for queue
        options,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    this.logger.log(
      `Image processing queued for file: ${fileId}`,
      'ImageProcessingService',
    );
  }

  /**
   * Compress and optimize image
   */
  async compressImage(
    buffer: Buffer,
    quality: number = 80,
  ): Promise<ProcessedImage> {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Determine output format (prefer original, fallback to jpeg)
      const format = metadata.format === 'png' ? 'png' : 'jpeg';

      // Compress image
      let processedBuffer: Buffer;
      if (format === 'jpeg') {
        processedBuffer = await image
          .jpeg({ quality, progressive: true })
          .toBuffer();
      } else {
        processedBuffer = await image
          .png({ compressionLevel: 9, progressive: true })
          .toBuffer();
      }

      const processedMetadata = await sharp(processedBuffer).metadata();

      this.logger.log(
        `Image compressed: ${metadata.size} -> ${processedBuffer.length} bytes`,
        'ImageProcessingService',
      );

      return {
        buffer: processedBuffer,
        width: processedMetadata.width!,
        height: processedMetadata.height!,
        format: processedMetadata.format!,
        size: processedBuffer.length,
      };
    } catch (error) {
      this.logger.error(
        `Image compression failed: ${error.message}`,
        'ImageProcessingService',
      );
      throw error;
    }
  }

  /**
   * Generate thumbnails in multiple sizes
   */
  async generateThumbnails(buffer: Buffer): Promise<ThumbnailSet> {
    try {
      const thumbnails: Partial<ThumbnailSet> = {};

      for (const [size, dimension] of Object.entries(this.thumbnailSizes)) {
        const thumbnailBuffer = await sharp(buffer)
          .resize(dimension, dimension, {
            fit: 'cover',
            position: 'center',
          })
          .jpeg({ quality: 85 })
          .toBuffer();

        const metadata = await sharp(thumbnailBuffer).metadata();

        thumbnails[size as keyof ThumbnailSet] = {
          buffer: thumbnailBuffer,
          width: metadata.width!,
          height: metadata.height!,
          format: metadata.format!,
          size: thumbnailBuffer.length,
        };
      }

      this.logger.log(
        'Thumbnails generated: small, medium, large',
        'ImageProcessingService',
      );

      return thumbnails as ThumbnailSet;
    } catch (error) {
      this.logger.error(
        `Thumbnail generation failed: ${error.message}`,
        'ImageProcessingService',
      );
      throw error;
    }
  }

  /**
   * Process image: compress and generate thumbnails
   */
  async processImage(
    buffer: Buffer,
    options: ImageProcessingOptions = {},
  ): Promise<{
    compressed: ProcessedImage;
    thumbnails?: ThumbnailSet;
  }> {
    const quality = options.quality || 80;
    const generateThumbnails = options.generateThumbnails !== false;

    // Compress original image
    const compressed = await this.compressImage(buffer, quality);

    // Generate thumbnails if requested
    let thumbnails: ThumbnailSet | undefined;
    if (generateThumbnails) {
      thumbnails = await this.generateThumbnails(buffer);
    }

    return {
      compressed,
      thumbnails,
    };
  }

  /**
   * Validate if file is an image
   */
  isImage(mimetype: string): boolean {
    return mimetype.startsWith('image/');
  }

  /**
   * Get image metadata
   */
  async getMetadata(buffer: Buffer): Promise<sharp.Metadata> {
    try {
      return await sharp(buffer).metadata();
    } catch (error) {
      this.logger.error(
        `Failed to get image metadata: ${error.message}`,
        'ImageProcessingService',
      );
      throw error;
    }
  }
}
