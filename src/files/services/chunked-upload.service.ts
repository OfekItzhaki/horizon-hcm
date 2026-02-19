import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { LoggerService } from '../../common/logger/logger.service';
import { randomBytes } from 'crypto';

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
  private redis: Redis;
  private readonly SESSION_TTL = 3600; // 1 hour
  private readonly KEY_PREFIX = 'chunked-upload:';

  constructor(
    private configService: ConfigService,
    private logger: LoggerService,
  ) {
    const redisHost = this.configService.get<string>('REDIS_HOST') || 'localhost';
    const redisPort = parseInt(this.configService.get<string>('REDIS_PORT') || '6379');

    this.redis = new Redis({
      host: redisHost,
      port: redisPort,
    });

    this.logger.log('ChunkedUploadService initialized', 'ChunkedUploadService');
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

    await this.redis.setex(
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
    const chunkKey = `${this.KEY_PREFIX}${uploadId}:chunk:${chunkIndex}`;
    
    // Store chunk as base64
    await this.redis.setex(
      chunkKey,
      this.SESSION_TTL,
      chunkData.toString('base64'),
    );

    // Update session with uploaded chunk
    const session = await this.getSession(uploadId);
    if (session && !session.uploadedChunks.includes(chunkIndex)) {
      session.uploadedChunks.push(chunkIndex);
      session.uploadedChunks.sort((a, b) => a - b);

      await this.redis.setex(
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
    const data = await this.redis.get(`${this.KEY_PREFIX}${uploadId}`);
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
    const session = await this.getSession(uploadId);
    if (!session) {
      throw new Error('Upload session not found');
    }

    if (!await this.isComplete(uploadId)) {
      throw new Error('Not all chunks have been uploaded');
    }

    const chunks: Buffer[] = [];

    // Retrieve all chunks in order
    for (let i = 0; i < session.totalChunks; i++) {
      const chunkKey = `${this.KEY_PREFIX}${uploadId}:chunk:${i}`;
      const chunkData = await this.redis.get(chunkKey);

      if (!chunkData) {
        throw new Error(`Chunk ${i} not found`);
      }

      chunks.push(Buffer.from(chunkData, 'base64'));
    }

    // Concatenate all chunks
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
    const session = await this.getSession(uploadId);
    if (!session) return;

    // Delete session
    await this.redis.del(`${this.KEY_PREFIX}${uploadId}`);

    // Delete all chunks
    for (let i = 0; i < session.totalChunks; i++) {
      await this.redis.del(`${this.KEY_PREFIX}${uploadId}:chunk:${i}`);
    }

    this.logger.log(
      `Upload session cleaned up: ${uploadId}`,
      'ChunkedUploadService',
    );
  }

  /**
   * Cancel upload and clean up
   */
  async cancelUpload(uploadId: string): Promise<void> {
    await this.cleanup(uploadId);
    this.logger.log(`Upload cancelled: ${uploadId}`, 'ChunkedUploadService');
  }
}
