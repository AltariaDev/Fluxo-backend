import { PartialType } from "@nestjs/mapped-types";
import { CreateDictDto } from "./create-dict.dto";
import { IsOptional, IsString, MinLength, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateDictDto extends PartialType(CreateDictDto) {
  
  @ApiProperty({ description: 'Name of the Dictionary', example: 'Dictionary' })
  @IsString()
  @MinLength(3)
  @IsOptional()
  readonly name?: string;

  @ApiProperty({ description: 'Description of the Dictionary', example: 'Description' })
  @IsString()
  @IsOptional()
  readonly description?: string;

  @ApiProperty({ description: 'Public status of the Dictionary', example: true })
  @IsBoolean()
  @IsOptional()
  readonly public?: boolean;

  @ApiProperty({ description: 'Tags list of a Dictionary', example: ['tag1', 'tag2'] })
  @IsOptional()
  readonly updateTags?: string[];

  @ApiProperty({ description: 'Shared with list to be eliminated from a Dictionary', example: ['tag1', 'tag2'] })
  @IsOptional()
  readonly deleteTags?: string[];

}
