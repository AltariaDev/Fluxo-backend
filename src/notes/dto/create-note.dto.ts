import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsMongoId, IsArray, IsBoolean, IsEnum } from 'class-validator';

export class CreateNoteDto {
  @ApiProperty({
    example: 'Meeting Notes',
    description: 'The title of the note',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example: 'Discussed project timeline and deliverables',
    description: 'The content of the note',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    example: '507f1f77bcf86cd799439011',
    description: 'The ID of the task this note is linked to',
  })
  @IsOptional()
  @IsMongoId()
  taskId?: string;

  @ApiPropertyOptional({
    example: '507f1f77bcf86cd799439012',
    description: 'The ID of the section this note is linked to',
  })
  @IsOptional()
  @IsMongoId()
  sectionId?: string;

  @ApiPropertyOptional({
    example: ['meeting', 'project', 'timeline'],
    description: 'Tags for categorizing the note',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the note is pinned',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({
    example: 'markdown',
    description: 'The format of the note content',
    enum: ['text', 'markdown', 'code'],
    default: 'text',
  })
  @IsOptional()
  @IsEnum(['text', 'markdown', 'code'])
  format?: string;
}
