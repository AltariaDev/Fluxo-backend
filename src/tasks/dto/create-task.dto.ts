import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, IsMongoId, isDate, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '../entities/task.entity';
import mongoose from 'mongoose';

export class CreateTaskDto{

  @ApiProperty({ description: 'Title of the Task', example: 'Task' })
  @IsString()
  @IsNotEmpty()
  readonly title: string;

  @ApiProperty({ description: 'Description of the Task', example: 'Description' })
  @IsString()
  @IsOptional()
  readonly description?: string;

  @ApiProperty({ description: 'Status of the Task', example: 'completed' })
  @IsEnum(TaskStatus)
  @IsNotEmpty()
  readonly status: TaskStatus;

  @ApiProperty({ description: 'Start Date of the Task', example: '2025-02-24T00:00:00Z' })
  @IsOptional()
  @IsString()
  readonly startDate?: string;

  @ApiProperty({ description: 'End Date of the Task', example: '2025-02-28T23:59:59Z' })
  @IsOptional()
  @IsString()
  readonly endDate?: string;

  @ApiProperty({ description: 'Due Date of the Task', example: '2025-02-28T23:59:59Z' })
  @IsOptional()
  @IsString()
  readonly dueDate?: string;

  @ApiProperty({ description: 'tags of the task', example: ['tag1', 'tag2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  readonly tags?: string[];

  @ApiProperty({ description: 'Priority of the task', example: 'high' })
  @IsOptional()
  @IsEnum(TaskPriority)
  @IsNotEmpty()
  readonly priority?: TaskPriority;

  @ApiProperty({ description: 'Category of the task', example: 'category' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly category?: string;

  @ApiProperty({ description: 'Subtasks of the task', example: ['subtask1', 'subtask2'] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  readonly subTasks?: mongoose.Types.ObjectId[];

  @ApiProperty({ description: 'Colour of the task', example: '#000000' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  readonly color?: string;
}
