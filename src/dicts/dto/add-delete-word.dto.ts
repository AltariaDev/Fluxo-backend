import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class AddDeleteWordDto {
  
  @ApiProperty({ description: 'Word to be added to the dictionary', example: 'word' })
  @IsString()
  @IsNotEmpty()
  readonly word: string;

  @ApiProperty({ description: 'Meaning of the word to be added', example: 'meaning' })
  @IsString()
  @IsNotEmpty()
  readonly definition: string;

  @ApiProperty({ description: 'Example of the word to be added', example: 'example' })
  @IsOptional()
  @IsString()
  readonly example?: string;
}
