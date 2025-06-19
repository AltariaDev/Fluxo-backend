import { forwardRef, Module } from '@nestjs/common';
import { GamificationProfileService } from './gamification-profile.service';
import { GamificationProfileController } from './gamification-profile.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { GamificationProfile, GamificationProfileSchema } from './entities/gamification-profile.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [MongooseModule.forFeature([{ name: GamificationProfile.name, schema: GamificationProfileSchema }]), AuthModule, UsersModule],
  controllers: [GamificationProfileController],
  providers: [GamificationProfileService],
  exports: [GamificationProfileService],
})
export class GamificationProfileModule {}
