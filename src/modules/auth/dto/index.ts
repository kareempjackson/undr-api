import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class VerifyMagicLinkDto {
  @ApiProperty({ description: 'Magic link token received in email' })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export * from './login.dto';
export * from './verify-magic-link.dto'; 