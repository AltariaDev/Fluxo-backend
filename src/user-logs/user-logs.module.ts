import { forwardRef, Module } from '@nestjs/common';
import { UserLogsService } from './user-logs.service';
// import { UserLogsGateway } from './user-logs.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { UserLog, UserLogSchema } from './entities/user-log.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from 'src/users/users.module';
import { PomodoroModule } from 'src/pomodoro/pomodoro.module';
import { UserLogsController } from './user-logs.controller';
import { Pomodoro, PomodoroSchema } from 'src/pomodoro/entities/pomodoro.entity';
import { Habit, HabitSchema } from 'src/habits/entities/habit.entity';
import { Task, TaskSchema } from 'src/tasks/entities/task.entity';
import { EventsCalendar, EventsCalendarSchema } from 'src/events-calendar/entities/events-calendar.entity';
import { Calendar, CalendarSchema } from 'src/calendar/entities/calendar.entity';

@Module({
  providers: [UserLogsService],
  controllers: [UserLogsController],
  imports: [
    MongooseModule.forFeature([
      { name: UserLog.name, schema: UserLogSchema },
      { name: Pomodoro.name, schema: PomodoroSchema },
      { name: Habit.name, schema: HabitSchema },
      { name: Task.name, schema: TaskSchema },
      { name: EventsCalendar.name, schema: EventsCalendarSchema },
      { name: Calendar.name, schema: CalendarSchema },
    ]), 
    AuthModule, 
    UsersModule, 
    PomodoroModule
  ],
  exports: [UserLogsService]
})
export class UserLogsModule {}
