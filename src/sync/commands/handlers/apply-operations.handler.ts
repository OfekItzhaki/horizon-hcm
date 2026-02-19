import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ApplyOperationsCommand } from '../impl/apply-operations.command';
import { SyncService } from '../../services/sync.service';

@CommandHandler(ApplyOperationsCommand)
export class ApplyOperationsCommandHandler
  implements ICommandHandler<ApplyOperationsCommand>
{
  constructor(private readonly syncService: SyncService) {}

  async execute(command: ApplyOperationsCommand) {
    const { userId, operations } = command;
    return this.syncService.applyOperations(userId, operations);
  }
}
