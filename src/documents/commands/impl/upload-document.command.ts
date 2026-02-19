export class UploadDocumentCommand {
  constructor(
    public readonly buildingId: string,
    public readonly fileId: string,
    public readonly title: string,
    public readonly category: string,
    public readonly accessLevel: string,
    public readonly uploadedBy: string,
    public readonly previousVersionId?: string,
  ) {}
}
