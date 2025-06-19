import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsMongoId, isDate, IsDate, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSectionDto {

  @ApiProperty({ description: 'Name of the Section', example: 'Section' })
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @ApiProperty({ description: 'Description of the Section', example: 'Description' })
  @IsString()
  @IsOptional()
  readonly description?: string;

  @ApiProperty({ description: 'Tags of the Section', example: ['tag1', 'tag2'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  readonly tags?: string[];

  @ApiProperty({ description: 'Category of the Section', example: 'Category' })
  @IsString()
  @IsOptional()
  readonly category?: string;

  @ApiProperty({ description: 'Order of the Section', example: 0 })
  @IsNumber()
  @IsOptional()
  readonly order?: number;

  @ApiProperty({ description: 'Notes of the Section', example: ['note1', 'note2'] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  readonly notes?: string[];

  @ApiProperty({ description: 'Tasks of the Section', example: ['task1', 'task2'] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  readonly tasks?: string[];

}
