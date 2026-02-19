export class DeleteDocumentCommand {
  constructor(
    public readonly documentId: string,
    public readonly userId: string,
  ) {}
}
