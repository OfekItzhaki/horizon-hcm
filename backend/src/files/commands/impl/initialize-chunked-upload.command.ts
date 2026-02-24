export class InitializeChunkedUploadCommand {
  constructor(
    public readonly userId: string,
    public readonly filename: string,
    public readonly totalChunks: number,
    public readonly totalSize: number,
    public readonly mimeType: string,
  ) {}
}
