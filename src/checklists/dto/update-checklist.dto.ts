import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateChecklistDto } from './create-checklist.dto';
import { IsArray, IsMongoId, IsOptional } from 'class-validator';
import mongoose from 'mongoose';

/* The UpdateChecklistDto class extends the CreateChecklistDto class and includes a property for a list
of task IDs to be eliminated. */
export class UpdateChecklistDto extends PartialType(CreateChecklistDto) {
  
  @ApiProperty({description: 'list of task to be eliminated', example: ['60d5f484f1b2c8a4d8e4b8c1', '60d5f484f1b2c8a4d8e4b8c2']})
  @IsArray()
  @IsMongoId({ each: true })
  @IsOptional()
  taskToDelete?: mongoose.Types.ObjectId[];
}
