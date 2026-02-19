export class GetDeltaQuery {
  constructor(
    public readonly userId: string,
    public readonly entityType: string,
    public readonly lastSyncTimestamp: Date,
  ) {}
}
