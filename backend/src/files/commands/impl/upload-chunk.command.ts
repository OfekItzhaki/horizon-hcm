export class UploadChunkCommand {
  constructor(
    public readonly userId: string,
    public readonly uploadId: string,
    public readonly chunkIndex: number,
    public readonly chunkData: Buffer,
  ) {}
}
