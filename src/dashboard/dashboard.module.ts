// import { Module } from '@nestjs/common';
// import { DashboardController } from './dashboard.controller';
// import { DashboardService } from './dashboard.service';
// import { TasksModule } from 'src/tasks/tasks.module';
// import { HabitsModule } from 'src/habits/habits.module';
// import { PomodoroModule } from 'src/pomodoro/pomodoro.module';
// import { UserLogsModule } from 'src/user-logs/user-logs.module';
// import { AuthModule } from 'src/auth/auth.module';
// import { MongooseModule } from '@nestjs/mongoose';
// import { User, UserSchema } from 'src/users/entities/user.entity';
// import { Task, TaskSchema } from 'src/tasks/entities/task.entity';
// import { Habit, HabitSchema } from 'src/habits/entities/habit.entity';
// import { Pomodoro, PomodoroSchema } from 'src/pomodoro/entities/pomodoro.entity';

// @Module({
//   imports: [
//     TasksModule,
//     HabitsModule,
//     PomodoroModule,
//     UserLogsModule,
//     AuthModule,
//     MongooseModule.forFeature([
//       { name: User.name, schema: UserSchema },
//       { name: Task.name, schema: TaskSchema },
//       { name: Habit.name, schema: HabitSchema },
//       { name: Pomodoro.name, schema: PomodoroSchema },
//     ]),
//   ],
//   controllers: [DashboardController],
//   providers: [DashboardService],
// })
// export class DashboardModule {}