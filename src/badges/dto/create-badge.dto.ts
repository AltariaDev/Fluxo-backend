import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
import mongoose from "mongoose";

export class CreateBadgeDto {

  @ApiProperty({ description: 'Name of the Badge', example: 'Badge' })
  @IsString()
  readonly name: string;

  @ApiProperty({ description: 'Description of the Badge', example: 'Badge description' })
  @IsString()
  readonly description: string;

  @ApiProperty({ description: 'Icon of the Badge', example: 'badge-icon' })
  @IsString()
  readonly icon: string;

  @ApiProperty({ description: 'Reward of the Badge', example: 'BadgeId' })
  readonly reward: mongoose.Types.ObjectId;

  @ApiProperty({ description: 'Category of the Badge', example: 'BadgeCategory' })
  @IsString()
  readonly category: string;

}
