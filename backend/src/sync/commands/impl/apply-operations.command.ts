import { SyncOperation } from '../../services/sync.service';

export class ApplyOperationsCommand {
  constructor(
    public readonly userId: string,
    public readonly operations: SyncOperation[],
  ) {}
}
