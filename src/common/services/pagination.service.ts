import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PaginationQueryDto,
  PaginationMetaDto,
  PaginatedResponseDto,
} from '../dto/pagination.dto';

interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
}

@Injectable()
export class PaginationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Offset-based pagination
   * Best for: Small to medium datasets, when total count is needed
   */
  async paginateOffset<T>(
    model: any,
    options: PaginationOptions,
    where: any = {},
    orderBy: any = {},
  ): Promise<PaginatedResponseDto<T>> {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    // Get total count
    const total = await model.count({ where });

    // Get paginated data
    const data = await model.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    const pagination: PaginationMetaDto = {
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
    };

    return new PaginatedResponseDto(data, pagination);
  }

  /**
   * Cursor-based pagination
   * Best for: Large datasets, real-time data, infinite scroll
   * 
   * Cursor format: base64 encoded JSON with cursor field and direction
   */
  async paginateCursor<T>(
    model: any,
    options: PaginationOptions,
    cursorField: string = 'id',
    where: any = {},
    orderBy: any = {},
  ): Promise<PaginatedResponseDto<T>> {
    const limit = options.limit || 10;
    let cursor: any = undefined;

    // Decode cursor if provided
    if (options.cursor) {
      try {
        const decodedCursor = JSON.parse(
          Buffer.from(options.cursor, 'base64').toString('utf-8'),
        );
        cursor = { [cursorField]: decodedCursor.value };
      } catch (error) {
        // Invalid cursor, ignore
      }
    }

    // Fetch data with cursor
    const data = await model.findMany({
      where,
      orderBy,
      take: limit + 1, // Fetch one extra to check if there's more
      ...(cursor && { cursor, skip: 1 }), // Skip the cursor item itself
    });

    // Check if there's more data
    const hasNext = data.length > limit;
    if (hasNext) {
      data.pop(); // Remove the extra item
    }

    // Generate next cursor
    let nextCursor: string | undefined;
    if (hasNext && data.length > 0) {
      const lastItem = data[data.length - 1];
      nextCursor = Buffer.from(
        JSON.stringify({ value: lastItem[cursorField] }),
      ).toString('base64');
    }

    // For cursor pagination, we don't have total count (by design for performance)
    const pagination: PaginationMetaDto = {
      total: -1, // Unknown for cursor pagination
      page: 1, // Not applicable for cursor pagination
      limit,
      totalPages: -1, // Unknown for cursor pagination
      hasNext,
      hasPrev: !!cursor,
      nextCursor,
    };

    return new PaginatedResponseDto(data, pagination);
  }

  /**
   * Helper to create pagination metadata manually
   */
  createPaginationMeta(
    total: number,
    page: number,
    limit: number,
  ): PaginationMetaDto {
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      total,
      page,
      limit,
      totalPages,
      hasNext,
      hasPrev,
    };
  }
}
