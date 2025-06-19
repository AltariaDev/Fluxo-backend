import { PartialType } from '@nestjs/swagger';
import { CreateTokenBlackListDto } from './create-token-black-list.dto';

export class UpdateTokenBlackListDto extends PartialType(CreateTokenBlackListDto) {}
