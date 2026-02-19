export class GetUploadProgressQuery {
  constructor(
    public readonly uploadId: string,
    public readonly userId: string,
  ) {}
}
