import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { UserRole } from "../../../entities/user.entity";

export class LoginDto {
  @ApiProperty({
    example: "user@example.com",
    description: "User email address",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "User's role",
    example: "FAN",
    enum: UserRole,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class VerifyMagicLinkDto {
  @ApiProperty({ description: "Magic link token received in email" })
  @IsString()
  @IsNotEmpty()
  token: string;
}

export class CheckUserDto {
  @ApiProperty({
    example: "user@example.com",
    description: "User email address",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export * from "./verify-magic-link.dto";
