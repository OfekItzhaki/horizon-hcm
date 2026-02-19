import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTemplateCommand } from '../impl/create-template.command';

@Injectable()
@CommandHandler(CreateTemplateCommand)
export class CreateTemplateHandler
  implements ICommandHandler<CreateTemplateCommand>
{
  constructor(private prisma: PrismaService) {}

  async execute(command: CreateTemplateCommand) {
    const { name, title, body, language } = command;

    // Create notification template
    const template = await this.prisma.notificationTemplate.create({
      data: {
        name,
        title,
        body,
        language,
        is_active: true,
      },
    });

    return template;
  }
}
