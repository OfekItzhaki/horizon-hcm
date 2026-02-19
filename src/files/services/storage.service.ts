import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { LoggerService } from '../../common/logger/logger.service';
import { randomBytes } from 'crypto';

export interface UploadResult {
  storageKey: string;
  url?: string;
}

@Injectable()
export class StorageService {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    // Initialize S3 client
    this.region = this.configService.get<string>('AWS_REGION') || 'us-east-1';
    this.bucket = this.configService.get<string>('AWS_S3_BUCKET') || 'horizon-hcm-files';

    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>('AWS_SECRET_ACCESS_KEY');

    if (!accessKeyId || !secretAccessKey) {
      this.logger.warn(
        'AWS credentials not configured. File storage will not work.',
        'StorageService',
      );
      return;
    }

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log('Storage Service initialized with S3', 'StorageService');
  }

  /**
   * Upload file to cloud storage
   */
  async upload(
    file: Express.Multer.File,
    userId: string,
    isPublic: boolean = false,
  ): Promise<UploadResult> {
    if (!this.s3Client) {
      throw new Error('Storage service not initialized');
    }

    // Generate unique storage key
    const timestamp = Date.now();
    const randomString = randomBytes(8).toString('hex');
    const extension = file.originalname.split('.').pop();
    const storageKey = `${userId}/${timestamp}-${randomString}.${extension}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: isPublic ? 'public-read' : 'private',
        Metadata: {
          originalName: file.originalname,
          uploadedBy: userId,
        },
      });

      await this.s3Client.send(command);

      const url = isPublic
        ? `https://${this.bucket}.s3.${this.region}.amazonaws.com/${storageKey}`
        : undefined;

      this.logger.log(`File uploaded: ${storageKey}`, 'StorageService');

      return { storageKey, url };
    } catch (error) {
      this.logger.error(`File upload failed: ${error.message}`, 'StorageService');
      throw error;
    }
  }

  /**
   * Delete file from cloud storage
   */
  async delete(storageKey: string): Promise<void> {
    if (!this.s3Client) {
      throw new Error('Storage service not initialized');
    }

    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      });

      await this.s3Client.send(command);

      this.logger.log(`File deleted: ${storageKey}`, 'StorageService');
    } catch (error) {
      this.logger.error(`File deletion failed: ${error.message}`, 'StorageService');
      throw error;
    }
  }

  /**
   * Generate signed URL for temporary access
   */
  async getSignedUrl(storageKey: string, expiresIn: number = 3600): Promise<string> {
    if (!this.s3Client) {
      throw new Error('Storage service not initialized');
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });

      return url;
    } catch (error) {
      this.logger.error(`Signed URL generation failed: ${error.message}`, 'StorageService');
      throw error;
    }
  }

  /**
   * Validate file type
   */
  validateFileType(mimetype: string): boolean {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
    ];

    return allowedTypes.includes(mimetype);
  }

  /**
   * Validate file size
   */
  validateFileSize(size: number, mimetype: string): boolean {
    const maxSizes = {
      image: 10 * 1024 * 1024, // 10MB for images
      document: 50 * 1024 * 1024, // 50MB for documents
    };

    const isImage = mimetype.startsWith('image/');
    const maxSize = isImage ? maxSizes.image : maxSizes.document;

    return size <= maxSize;
  }
}
