import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { LoggerService } from '../../common/logger/logger.service';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../services/storage.service';
import { ImageProcessingService } from '../services/image-processing.service';

interface ImageProcessingJobData {
  fileId: string;
  buffer: string; // Base64 encoded
  options: {
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
    generateThumbnails?: boolean;
  };
}

@Processor('image-processing')
export class ImageProcessingProcessor extends WorkerHost {
  constructor(
    private logger: LoggerService,
    private prisma: PrismaService,
    private storageService: StorageService,
    private imageProcessingService: ImageProcessingService,
  ) {
    super();
  }

  async process(job: Job<ImageProcessingJobData>): Promise<any> {
    const { fileId, buffer: base64Buffer, options } = job.data;

    this.logger.log(`Processing image job for file: ${fileId}`, 'ImageProcessingProcessor');

    try {
      // Convert base64 back to buffer
      const buffer = Buffer.from(base64Buffer, 'base64');

      // Get file record
      const file = await this.prisma.files.findUnique({
        where: { id: fileId },
      });

      if (!file) {
        throw new Error(`File not found: ${fileId}`);
      }

      // Process image (compress and generate thumbnails)
      const { compressed, thumbnails } = await this.imageProcessingService.processImage(
        buffer,
        options,
      );

      // Upload compressed version (replace original)
      // In production, you might want to keep the original
      const uploadResult = await this.storageService.upload(
        {
          buffer: compressed.buffer,
          originalname: file.filename,
          mimetype: `image/${compressed.format}`,
          size: compressed.size,
        } as Express.Multer.File,
        file.user_id,
        file.is_public,
      );

      // Update file record with new metadata
      const metadata: any = {
        width: compressed.width,
        height: compressed.height,
        originalSize: file.size_bytes,
        compressedSize: compressed.size,
      };

      // Upload thumbnails if generated
      if (thumbnails) {
        const thumbnailUrls: any = {};

        for (const [size, thumbnail] of Object.entries(thumbnails)) {
          // Upload thumbnail
          const thumbResult = await this.storageService.upload(
            {
              buffer: thumbnail.buffer,
              originalname: `${file.filename}_${size}`,
              mimetype: `image/${thumbnail.format}`,
              size: thumbnail.size,
            } as Express.Multer.File,
            file.user_id,
            file.is_public,
          );

          thumbnailUrls[size] = thumbResult.url || thumbResult.storageKey;
        }

        metadata.thumbnails = thumbnailUrls;
      }

      // Update file record
      await this.prisma.files.update({
        where: { id: fileId },
        data: {
          storage_key: uploadResult.storageKey,
          url: uploadResult.url,
          size_bytes: compressed.size,
          metadata: metadata as any,
        },
      });

      this.logger.log(`Image processing completed for file: ${fileId}`, 'ImageProcessingProcessor');

      return { success: true, fileId };
    } catch (error) {
      this.logger.error(
        `Image processing failed for file ${fileId}: ${error.message}`,
        'ImageProcessingProcessor',
      );
      throw error;
    }
  }
}
