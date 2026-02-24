export class UploadFileCommand {
  constructor(
    public readonly userId: string,
    public readonly file: Express.Multer.File,
    public readonly isPublic: boolean = false,
  ) {}
}
