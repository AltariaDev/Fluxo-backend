import { Module } from '@nestjs/common';
import { EventsCalendarService } from './events-calendar.service';
import { EventsCalendarController } from './events-calendar.controller';
import { Mongoose } from 'mongoose';
import { EventsCalendar, EventsCalendarSchema } from './entities/events-calendar.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [EventsCalendarController],
  providers: [EventsCalendarService],
  exports: [EventsCalendarService],
  imports: [MongooseModule.forFeature([{ name: EventsCalendar.name, schema: EventsCalendarSchema }]), AuthModule],
})
export class EventsCalendarModule {}
