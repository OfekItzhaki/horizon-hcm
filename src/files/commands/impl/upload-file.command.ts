export class UploadFileCommand {
  constructor(
    public readonly userId: string,
    public readonly file: Express.Multer.files,
    public readonly isPublic: boolean = false,
  ) {}
}
