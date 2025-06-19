import { ApiProperty } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsOptional,
  IsMongoId, 
  IsArray, 
  ArrayUnique, 
  IsString,
  IsNumber
} from 'class-validator';

export class CreateGamificationProfileDto {
  
  @ApiProperty({
    description: 'Banner del perfil de gamificación',
    example: 'https://example.com/banner.jpg',
  })
  @IsOptional()
  @IsString()
  banner?: string;

  @ApiProperty({
    description: 'Avatar del perfil de gamificación',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    description: 'Marco del perfil de gamificación',
    example: 'https://example.com/frame.jpg',
  })
  @IsOptional()
  @IsString()
  frame?: string;

  @ApiProperty({
    description: 'Biografía del perfil de gamificación',
    example: 'Soy un apasionado de la tecnología.',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({
    description: 'Título del perfil de gamificación',
    example: 'Novato',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Cantidad de monedas del perfil de gamificación',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  coins?: number;

  // Para las directRewards, se espera un array de IDs de Reward
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsMongoId({ each: true })
  directRewards?: string[];

  // Para los badges desbloqueados, se espera un array de IDs de Badge
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsMongoId({ each: true })
  unlockedBadges?: string[];
}
