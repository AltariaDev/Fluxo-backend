import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { CreateTaskDto } from './create-task.dto';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @ApiProperty({ description: 'tags to delete', example: ['tag1', 'tag2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  deleteTags?: string[];

  @ApiProperty({ description: 'tags to add', example: ['tag3', 'tag4'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  addTags?: string[];

  // @ApiProperty({ description: 'soft delete task', example: true })
  // @IsOptional()
  // readonly isDeleted?: boolean;
}
