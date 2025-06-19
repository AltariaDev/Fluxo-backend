import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";

export class CreateDictDto {

  @ApiProperty({ description: 'Name of the Dictionary', example: 'Dictionary' })
  @IsString()
  @MinLength(3)
  @IsNotEmpty({ message: "Name is required" })
  readonly name: string;

  @ApiProperty({ description: 'Description of the Dictionary', example: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Public status of the Dictionary', example: true })
  @IsBoolean()
  @IsOptional()
  readonly public?: boolean;

  @ApiProperty({ description: 'Tags list of a Dictionary', example: ['tag1', 'tag2'] })
  @IsOptional()
  readonly tags?: string[];
}
