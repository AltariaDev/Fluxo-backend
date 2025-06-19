import { Module } from '@nestjs/common';
import { AvatarsService } from './avatars.service';
import { AvatarsController } from './avatars.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Avatar, AvatarSchema } from './entities/avatar.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [AvatarsController],
  providers: [AvatarsService],
  exports: [AvatarsService],
  imports: [MongooseModule.forFeature([{ name: Avatar.name, schema: AvatarSchema }]), AuthModule],
})
export class AvatarsModule {}
