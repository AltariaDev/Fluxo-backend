import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class CreateFrameDto {

  @ApiProperty({ description: 'Frame', example: 'Frame' })
  @IsString()
  readonly frame: string;

  @ApiProperty({ description: 'Description', example: 'Description' })
  @IsString()
  readonly description: string;

  @ApiProperty({ description: 'Image', example: 'Image' })
  @IsString()
  readonly image: string;
}
