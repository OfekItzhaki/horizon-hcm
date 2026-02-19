export class CreateTemplateCommand {
  constructor(
    public readonly name: string,
    public readonly title: string,
    public readonly body: string,
    public readonly language: string,
  ) {}
}
