import { IsArray, IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import mongoose from 'mongoose';

export class CreateChecklistDto {
  @ApiProperty({ description: 'Name', example: 'Name' })
  @IsString()
  readonly name: string;

  @ApiProperty({ description: 'Description', example: 'Description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'list of tasks id', example: ['60d5f484f1b2c8a4d8e4b8c1', '60d5f484f1b2c8a4d8e4b8c2'] })
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  taskId?: mongoose.Types.ObjectId[];
}
