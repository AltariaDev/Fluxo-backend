import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from "class-validator";

export class CreateAvatarDto {
  @ApiProperty({
    description: 'Name of the avatar',
    example: 'Avatar1',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Avatar url',
    example: 'https://ejemplo.com/avatar.jpg',
  })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({
    description: 'Description of the avatar',
    example: 'Description1',
  })
  @IsOptional()
  @IsString()
  description?: string;

}