import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDeltaQuery } from '../impl/get-delta.query';
import { SyncService, SyncDelta } from '../../services/sync.service';

@QueryHandler(GetDeltaQuery)
export class GetDeltaQueryHandler implements IQueryHandler<GetDeltaQuery> {
  constructor(private readonly syncService: SyncService) {}

  async execute(query: GetDeltaQuery): Promise<SyncDelta> {
    const { userId, entityType, lastSyncTimestamp } = query;
    return this.syncService.getDelta(userId, entityType, lastSyncTimestamp);
  }
}
