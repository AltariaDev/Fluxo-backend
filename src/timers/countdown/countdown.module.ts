import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CountdownService } from './countdown.service';
import { CountdownController } from './countdown.controller';
import { Countdown, CountdownSchema } from './entities/countdown.entity';
import { TimerGateway } from '../interfaces/timer.gateway';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from '../../auth/auth.module';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Countdown.name, schema: CountdownSchema }
    ]),
    ScheduleModule.forRoot(),
    AuthModule,
  ],
  controllers: [CountdownController],
  providers: [CountdownService, TimerGateway],
  exports: [CountdownService]
})
export class CountdownModule {} 