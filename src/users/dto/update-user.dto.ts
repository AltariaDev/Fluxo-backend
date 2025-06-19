import {
  IsEmail,
  IsOptional,
  IsNumber,
  IsPositive,
  IsString,
  MinLength,
  IsBoolean,
  IsDate,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
// import { Profile } from "../entities/user.entity";

export class UpdateUserDto {
  @ApiProperty({
    example: "john.sherp@example.com",
    description: "User email (optional)",
    required: false,
  })
  @IsEmail()
  @IsOptional()
  readonly email?: string;

  @ApiProperty({
    example: "NewSecurePassword123!",
    description: "User password (optional, min 8 characters)",
    required: false,
  })
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @IsOptional()
  password?: string;

  // @ApiProperty({
  //   example: 150,
  //   description: "User XP points (optional)",
  //   required: false,
  // })
  // @Transform(({ value }) => Number(value)) // ✅ Convierte strings a números
  // @IsNumber()
  // @IsPositive()
  // @IsOptional()
  // readonly xp?: number;

  // @ApiProperty({
  //   example: 5,
  //   description: "User level (optional)",
  //   required: false,
  // })
  // @Transform(({ value }) => Number(value)) // ✅ Convierte strings a números
  // @IsNumber()
  // @IsPositive()
  // @IsOptional()
  // readonly level?: number;

  @ApiProperty({
    example: "NewSecurePassword123!",
    description: "New password for user (optional, min 8 characters)",
    required: false,
  })
  @IsString()
  @MinLength(8, { message: "Password must be at least 8 characters long" })
  @IsOptional()
  readonly updatedPassword?: string;

  @ApiProperty({
    example: "John Doe",
    description: "User's full name (optional)",
    required: false,
  })
  @IsString()
  @IsOptional()
  readonly fullname?: string;

  // @IsOptional()
  // readonly updateProfile: Profile;

  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR...",
    description: "Refresh token (optional)",
    required: false,
  })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiProperty({
    example: "cus_123456789",
    description: "Stripe customer ID (optional)",
    required: false,
  })
  @IsOptional()
  @IsString()
  stripeCustomerId?: string;

  @ApiProperty({
    example: 1234567890,
    description: "User phone number (optional)",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  phoneNumber?: number;

  @ApiProperty({
    example: "123456789",
    description: "Google ID (optional)",
    required: false,
  })
  @IsOptional()
  @IsString()
  googleId?: string;

  @ApiProperty({
    example: true,
    description: "Is deleted (optional)",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean;

  @ApiProperty({
    example: "2025-01-01",
    description: "Deleted at (optional)",
    required: false,
  })
  @IsOptional()
  @IsDate()
  deletedAt?: Date;
}