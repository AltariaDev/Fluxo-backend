import { IsOptional } from "class-validator";
import { SharedUser } from "../entities/dict.entity";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserSharedWithDto {
  
  @ApiProperty({ description: 'Shared with list of a Dictionary', example: [{userId: 'userId', role: 'viewer'},{userId: 'userId2', role: 'editor'}] })
  @IsOptional()
  readonly sharedUsers?: SharedUser[];

  @ApiProperty({ description: 'userId list of users to be eliminated', example: ['userid1', 'userid2']})
  @IsOptional()
  readonly deleteSharedWith?: string[];
}