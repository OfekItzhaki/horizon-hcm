export class CompleteChunkedUploadCommand {
  constructor(
    public readonly userId: string,
    public readonly uploadId: string,
    public readonly isPublic: boolean = false,
  ) {}
}
