import { IsUUID, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddCommitteeMemberDto {
  @ApiProperty({
    description: 'User ID to add as committee member',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Committee role (e.g., Chairman, Treasurer, Secretary)',
    example: 'Chairman',
  })
  @IsString()
  @IsNotEmpty()
  role: string;
}
