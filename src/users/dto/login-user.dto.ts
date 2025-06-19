import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginUserDto {
  @ApiProperty({ example: "johnan.sherp@example.com", description: "User email" })
  @IsEmail()
  email: string;

  @ApiProperty({ example: "StrongPassword123!", description: "User password" })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}