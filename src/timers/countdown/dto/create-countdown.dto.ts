import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCountdownDto {
  @ApiProperty({ 
    description: 'Name of the countdown timer',
    example: 'Workout Countdown'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: 'Optional description of the countdown timer',
    example: 'Countdown for my daily workout routine',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    description: 'Duration of the countdown in milliseconds',
    example: 300000,
    minimum: 0
  })
  @IsNumber()
  @Min(0)
  duration: number; // in milliseconds
} 