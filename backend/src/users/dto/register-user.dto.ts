import { IsEmail, IsString, MinLength, IsBoolean, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ example: '+1234567890' })
  @IsString()
  @Matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, {
    message: 'Phone number must be valid',
  })
  phone: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  acceptedTerms: boolean;

  @ApiProperty({ example: 'default', required: false })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
