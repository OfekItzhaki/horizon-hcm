import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RegistrationService } from './registration.service';
import { RegisterUserDto } from '../users/dto/register-user.dto';
import { Public } from '@ofeklabs/horizon-auth';

@ApiTags('registration')
@Controller('api/register')
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: 'Register a new user with HCM profile' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Invalid input or terms not accepted' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() dto: RegisterUserDto) {
    return this.registrationService.register(dto);
  }
}
