export class DeleteFileCommand {
  constructor(
    public readonly fileId: string,
    public readonly userId: string,
  ) {}
}
