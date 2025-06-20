import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStopwatchDto {
  @ApiProperty({ 
    description: 'Name of the stopwatch',
    example: 'Workout Timer'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: 'Optional description of the stopwatch',
    example: 'Timer for my daily workout routine',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;
} 