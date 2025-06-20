import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StopwatchService } from './stopwatch.service';
import { StopwatchController } from './stopwatch.controller';
import { Stopwatch, StopwatchSchema } from './entities/stopwatch.entity';
import { AuthModule } from '../../auth/auth.module';
import { TimerGateway } from '../interfaces/timer.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Stopwatch.name, schema: StopwatchSchema }
    ]),
    AuthModule,
  ],
  controllers: [StopwatchController],
  providers: [StopwatchService, TimerGateway],
  exports: [StopwatchService]
})
export class StopwatchModule {} 