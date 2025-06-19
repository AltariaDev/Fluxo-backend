import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class CreateHabitDto {
  @ApiProperty({ description: 'Name', example: 'Name' })
  @IsString()
  readonly name: string;

  @ApiProperty({ description: 'Description', example: 'Description' })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({ description: 'Frequency', example: 'Frequency' })
  @IsString()
  @IsEnum(['daily', 'weekly', 'monthly'])
  readonly frequency: string;

  @ApiProperty({ description: 'Type', example: 'Type' })
  @IsString()
  type: string;
}
