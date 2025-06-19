import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateSectionDto } from './create-section.dto';
import { IsArray, IsString, IsOptional, IsMongoId } from 'class-validator';

export class UpdateSectionDto extends PartialType(CreateSectionDto) {

  @ApiProperty({ description: 'Tags to be deleted', example: ['tag1', 'tag2'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  readonly deleteTags?: string[];

  @ApiProperty({ description: 'Tasks to be deleted', example: ['task1', 'task2'] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  readonly deleteTasks?: string[];

  @ApiProperty({ description: 'notes to be deleted', example: ['note1', 'note2'] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  readonly deleteNotes?: string[];

  @ApiProperty({ description: 'SubSections to be added', example: ['subs1', 'subs2'] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  readonly addSubSections?: string[];

  @ApiProperty({ description: 'SubSections to be deleted', example: ['subSection1', 'subSection2'] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  readonly deleteSubSections?: string[];
}
