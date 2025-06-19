import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';


export class CreateTitleDto {

  @ApiProperty({ description: 'Title', example: 'Title' })
  @IsString()
  readonly title: string;

  @IsString()
  @ApiProperty({ description: 'Description', example: 'Description' })
  readonly description: string;
}
