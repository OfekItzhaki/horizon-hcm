export class GetTemplateQuery {
  constructor(
    public readonly name: string,
    public readonly language: string = 'en',
  ) {}
}
