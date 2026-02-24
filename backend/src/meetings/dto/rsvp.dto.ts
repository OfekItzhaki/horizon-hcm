import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export class RsvpDto {
  @ApiProperty({ 
    description: 'RSVP status', 
    enum: ['attending', 'not_attending', 'maybe'],
    example: 'attending'
  })
  @IsEnum(['attending', 'not_attending', 'maybe'])
  status: string;
}
