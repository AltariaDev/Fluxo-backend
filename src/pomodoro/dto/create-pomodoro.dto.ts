import { IsInt, IsOptional, Min } from "class-validator";
import { ApiProperty } from '@nestjs/swagger';

export class CreatePomodoroDto {
  @ApiProperty({ description: 'Work duration in seconds', required: false, minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  workDuration?: number; // seconds

  @ApiProperty({ description: 'Short break duration in seconds', required: false, minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  shortBreak?: number; // seconds

  @ApiProperty({ description: 'Long break duration in seconds', required: false, minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  longBreak?: number; // seconds

  @ApiProperty({ description: 'Number of work cycles', required: false, minimum: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  cycles?: number;
}
