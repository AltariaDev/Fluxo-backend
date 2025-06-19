import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateGamificationProfileDto } from './create-gamification-profile.dto';
import { OmitType } from '@nestjs/mapped-types';
import { ArrayUnique, IsArray, IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateGamificationProfileDto extends PartialType(CreateGamificationProfileDto){

  // La XP se puede dejar opcional y asignar un valor por defecto en el esquema (0)
  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: 'XP of the user', example: 100 })
  xp?: number;

  // El nivel también se deja opcional, ya que se asigna un default (1)
  @IsOptional()
  @IsNumber()
  @ApiProperty({ description: 'Level of the user', example: 2 })
  level?: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Banner of the user', example: 'user-banner' })
  banner?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ description: 'Avatar of the user', example: 'user-avatar' })
  avatar?: string;

  // Para las directRewards, se espera un array de IDs de Reward
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsMongoId({ each: true })
  @ApiProperty({ description: 'Direct rewards of the user', example: ['reward-1', 'reward-2'] })
  directRewards?: string[];

  // Para los badges desbloqueados, se espera un array de IDs de Badge
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsMongoId({ each: true })
  @ApiProperty({ description: 'Unlocked badges of the user', example: ['badge-1', 'badge-2'] })
  unlockedBadges?: string[];
}
