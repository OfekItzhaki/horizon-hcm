import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ExportUserDataCommand } from '../impl/export-user-data.command';
import { GDPRService } from '../../services/gdpr.service';

@CommandHandler(ExportUserDataCommand)
export class ExportUserDataCommandHandler
  implements ICommandHandler<ExportUserDataCommand>
{
  constructor(private readonly gdprService: GDPRService) {}

  async execute(command: ExportUserDataCommand) {
    return this.gdprService.exportUserData(command.userId);
  }
}
