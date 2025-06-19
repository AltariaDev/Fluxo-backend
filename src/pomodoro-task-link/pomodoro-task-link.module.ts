// src/pomodoro-task-link/pomodoro-task-link.module.ts

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Pomodoro, PomodoroSchema } from 'src/pomodoro/entities/pomodoro.entity';
import { Task, TaskSchema } from 'src/tasks/entities/task.entity';
import { PomodoroTaskLinkService } from './pomodoro-task-link.service';
import { AuthModule } from 'src/auth/auth.module';
import { PomodoroTaskLinkController } from './pomodoro-task-link.controller';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Pomodoro.name, schema: PomodoroSchema },
      { name: Task.name, schema: TaskSchema },
    ]),
    AuthModule,
  ],
  controllers: [PomodoroTaskLinkController],
  providers: [PomodoroTaskLinkService],
  exports: [PomodoroTaskLinkService], // 👈 importante si lo usarás desde otros módulos
})
export class PomodoroTaskLinkModule {}
