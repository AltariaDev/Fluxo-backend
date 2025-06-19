import { Module} from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CalendarController } from "./calendar.controller";
import { CalendarService } from "./calendar.service";
import { Calendar, CalendarSchema } from "./entities/calendar.entity";
import { AuthModule } from "../auth/auth.module"; // ✅ Importar AuthModule
import { Reminders, RemindersSchema } from "src/reminders/entities/reminders.entity";
import { Task, TaskSchema } from "src/tasks/entities/task.entity";
import { EventsCalendar, EventsCalendarSchema } from "src/events-calendar/entities/events-calendar.entity";
import { TasksModule } from "src/tasks/tasks.module";
import { RemindersModule } from "src/reminders/reminders.module";
import { EventsCalendarModule } from "src/events-calendar/events-calendar.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Calendar.name, schema: CalendarSchema }
    ]),
    AuthModule,
    TasksModule,
    RemindersModule,
    EventsCalendarModule,
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}