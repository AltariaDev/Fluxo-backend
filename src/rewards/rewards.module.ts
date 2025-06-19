import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RewardsService } from './rewards.service';
import { RewardsGateway } from './rewards.gateway';
import { RewardsController} from './rewards.controller';
import { Reward, RewardSchema } from './entities/reward.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Reward.name, schema: RewardSchema }]), AuthModule
  ],
  controllers: [RewardsController],
  providers: [RewardsService, RewardsGateway],
  exports: [RewardsService],
})
export class RewardsModule {}
