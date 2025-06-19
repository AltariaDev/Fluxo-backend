import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateHabitDto } from './create-habit.dto';
import mongoose from 'mongoose';
import { IsDate, IsMongoId, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateHabitDto extends PartialType(CreateHabitDto) {

  @ApiProperty({ description: 'TaskID', example: '289bnfsd01bas0123' })
  @IsOptional()
  @IsMongoId()
  taskId?: mongoose.Types.ObjectId;

  @ApiProperty({ description: 'Status', example: 'true' })
  @IsOptional()
  @Type(() => Boolean)
  status?: boolean;

  // @ApiProperty({ description: 'new completed date', example: '2023-10-01' })
  // @IsOptional()
  // @Type(() => Date)
  // @IsDate()
  // completedDate?: Date;

  // @ApiProperty({ description: 'completed date to delete', example: '2023-10-01' })
  // @IsOptional()
  // @Type(() => Date)
  // @IsDate()
  // completedDateToDelete?: Date;

}
