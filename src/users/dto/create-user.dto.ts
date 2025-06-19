import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength, IsDateString, IsOptional, MaxLength, Length, Matches } from "class-validator";
import { Transform, Type } from "class-transformer";
import { IsFullName } from "src/auth/decorators/is_fullname.decorator";

export class CreateUserDto {
  @ApiProperty({
    example: "johnan.sherp@example.com",
    description: "User email",
  })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "johnan", description: "Unique username" })
  @IsString()
  @MinLength(3)
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: "Johnan", description: "Full name of the user" })
  @IsString()
  @Length(3, 128)
  @IsFullName ({
    message: 'Fullname contains invalid characters',
  })
  @IsNotEmpty()
  fullname: string;

  @ApiProperty({
    example: "StrongPassword123!",
    description: "User password (min 8 characters)",
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: "1990-01-01",
    description: "User's birth date (YYYY-MM-DD)",
    required: false
  })
  @IsDateString()
  @IsOptional()
  @Type(() => Date)
  birthDate?: Date;
}