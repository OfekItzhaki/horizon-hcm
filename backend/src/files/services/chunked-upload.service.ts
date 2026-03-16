import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { LoggerService } from '../../common/logger/logger.service';
import { randomBytes } from 'crypto';
import { getRedisConnection } from '../../common/utils/redis-config';

export interface ChunkedUploadSession {
  uploadId: string;
  userId: string;
  filename: string;
  totalChunks: number;
  totalSize: number;
  mimeType: string;
  uploadedChunks: number[];
  createdAt: number;
  expiresAt: number;
}

@Injectable()
export class ChunkedUploadService {
  private redis: Redis | null = null;
  private readonly SESSION_TTL = 3600; // 1 hour
  private readonly KEY_PREFIX = 'chunked-upload:';

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    this.initRedis();
  }

  private initRedis() {
    try {
      const conn = getRedisConnection() as any;
      this.redis = new Redis({
        ...conn,
        lazyConnect: true,
        maxRetriesPerRequest: 0,
        enableOfflineQueue: false,
        retryStrategy: () => null, // don't retry — chunked uploads are optional
      });

      this.redis.on('error', (err) => {
        this.logger.warn(
          `ChunkedUploadService Redis error (non-fatal): ${err.message}`,
          'ChunkedUploadService',
        );
      });

      this.redis.connect().catch((err) => {
        this.logger.warn(
          `ChunkedUploadService Redis connect failed (chunked uploads disabled): ${err.message}`,
          'ChunkedUploadService',
        );
        this.redis = null;
      });

      this.logger.log('ChunkedUploadService initialized', 'ChunkedUploadService');
    } catch (err: any) {
      this.logger.warn(
        `ChunkedUploadService Redis init failed (chunked uploads disabled): ${err.message}`,
        'ChunkedUploadService',
      );
      this.redis = null;
    }
  }

  private get isAvailable(): boolean {
    return this.redis !== null && this.redis.status === 'ready';
  }

  /**
   * Initialize a new chunked upload session
   */
  async initializeUpload(
    userId: string,
    filename: string,
    totalChunks: number,
    totalSize: number,
    mimeType: string,
  ): Promise<string> {
    if (!this.isAvailable) {
      throw new Error('Chunked upload service is unavailable (Redis not connected)');
    }

    const uploadId = randomBytes(16).toString('hex');
    const now = Date.now();

    const session: ChunkedUploadSession = {
      uploadId,
      userId,
      filename,
      totalChunks,
      totalSize,
      mimeType,
      uploadedChunks: [],
      createdAt: now,
      expiresAt: now + this.SESSION_TTL * 1000,
    };

    await this.redis!.setex(
      `${this.KEY_PREFIX}${uploadId}`,
      this.SESSION_TTL,
      JSON.stringify(session),
    );

    this.logger.log(
      `Chunked upload initialized: ${uploadId} (${totalChunks} chunks)`,
      'ChunkedUploadService',
    );

    return uploadId;
  }

  /**
   * Store a chunk in Redis
   */
  async storeChunk(
    uploadId: string,
    chunkIndex: number,
    chunkData: Buffer,
  ): Promise<void> {
    if (!this.isAvailable) {
      throw new Error('Chunked upload service is unavailable (Redis not connected)');
    }

    const chunkKey = `${this.KEY_PREFIX}${uploadId}:chunk:${chunkIndex}`;

    await this.redis!.setex(chunkKey, this.SESSION_TTL, chunkData.toString('base64'));

    const session = await this.getSession(uploadId);
    if (session && !session.uploadedChunks.includes(chunkIndex)) {
      session.uploadedChunks.push(chunkIndex);
      session.uploadedChunks.sort((a, b) => a - b);

      await this.redis!.setex(
        `${this.KEY_PREFIX}${uploadId}`,
        this.SESSION_TTL,
        JSON.stringify(session),
      );
    }

    this.logger.log(
      `Chunk ${chunkIndex} stored for upload ${uploadId}`,
      'ChunkedUploadService',
    );
  }

  /**
   * Get upload session
   */
  async getSession(uploadId: string): Promise<ChunkedUploadSession | null> {
    if (!this.isAvailable) return null;
    const data = await this.redis!.get(`${this.KEY_PREFIX}${uploadId}`);
    if (!data) return null;
    return JSON.parse(data);
  }

  /**
   * Get upload progress
   */
  async getProgress(uploadId: string): Promise<{
    uploadedChunks: number;
    totalChunks: number;
    percentage: number;
  } | null> {
    const session = await this.getSession(uploadId);
    if (!session) return null;

    const percentage = (session.uploadedChunks.length / session.totalChunks) * 100;

    return {
      uploadedChunks: session.uploadedChunks.length,
      totalChunks: session.totalChunks,
      percentage: Math.round(percentage * 100) / 100,
    };
  }

  /**
   * Check if all chunks are uploaded
   */
  async isComplete(uploadId: string): Promise<boolean> {
    const session = await this.getSession(uploadId);
    if (!session) return false;
    return session.uploadedChunks.length === session.totalChunks;
  }

  /**
   * Reassemble all chunks into a single buffer
   */
  async reassembleChunks(uploadId: string): Promise<Buffer> {
    if (!this.isAvailable) {
      throw new Error('Chunked upload service is unavailable (Redis not connected)');
    }

    const session = await this.getSession(uploadId);
    if (!session) {
      throw new Error('Upload session not found');
    }

    if (!(await this.isComplete(uploadId))) {
      throw new Error('Not all chunks have been uploaded');
    }

    const chunks: Buffer[] = [];

    for (let i = 0; i < session.totalChunks; i++) {
      const chunkKey = `${this.KEY_PREFIX}${uploadId}:chunk:${i}`;
      const chunkData = await this.redis!.get(chunkKey);

      if (!chunkData) {
        throw new Error(`Chunk ${i} not found`);
      }

      chunks.push(Buffer.from(chunkData, 'base64'));
    }

    const completeFile = Buffer.concat(chunks);

    this.logger.log(
      `Chunks reassembled for upload ${uploadId}: ${completeFile.length} bytes`,
      'ChunkedUploadService',
    );

    return completeFile;
  }

  /**
   * Clean up upload session and chunks
   */
  async cleanup(uploadId: string): Promise<void> {
    if (!this.isAvailable) return;

    const session = await this.getSession(uploadId);
    if (!session) return;

    await this.redis!.del(`${this.KEY_PREFIX}${uploadId}`);

    for (let i = 0; i < session.totalChunks; i++) {
      await this.redis!.del(`${this.KEY_PREFIX}${uploadId}:chunk:${i}`);
    }

    this.logger.log(`Upload session cleaned up: ${uploadId}`, 'ChunkedUploadService');
  }

  /**
   * Cancel upload and clean up
   */
  async cancelUpload(uploadId: string): Promise<void> {
    await this.cleanup(uploadId);
    this.logger.log(`Upload cancelled: ${uploadId}`, 'ChunkedUploadService');
  }
}
