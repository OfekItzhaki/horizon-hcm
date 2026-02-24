import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DeleteUserDataCommand } from '../impl/delete-user-data.command';
import { GDPRService } from '../../services/gdpr.service';

@CommandHandler(DeleteUserDataCommand)
export class DeleteUserDataCommandHandler
  implements ICommandHandler<DeleteUserDataCommand>
{
  constructor(private readonly gdprService: GDPRService) {}

  async execute(command: DeleteUserDataCommand) {
    await this.gdprService.deleteUserData(command.userId);
    return { success: true, message: 'User data deleted successfully' };
  }
}
