export class GetSignedUrlQuery {
  constructor(
    public readonly fileId: string,
    public readonly userId: string,
    public readonly expiresIn: number = 3600, // 1 hour default
  ) {}
}
