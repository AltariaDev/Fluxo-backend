// src/events/task.listener.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import mongoose from 'mongoose';
import { UserLogsService } from 'src/user-logs/user-logs.service';
import { EventsList } from '../list.events';
import { StatsService } from 'src/stats/stats.service';

@Injectable()
export class TaskListener {
  private readonly logger = new Logger(TaskListener.name);

  constructor(
    @Inject(UserLogsService) private readonly userLogsService: UserLogsService,
    @Inject(StatsService) private readonly statsService: StatsService,
  ) {}
  // Escuchar evento cuando se crea una tarea
  @OnEvent(EventsList.TASK_CREATED)
  handleTaskCreated(payload: {userId: mongoose.Types.ObjectId, taskId: mongoose.Types.ObjectId}) {
    this.userLogsService.taskCreated(payload.userId, payload.taskId);
    this.statsService.taskCreated();
    
  }

  // Escuchar evento cuando se actualiza una tarea
  @OnEvent('task.updated')
  handleTaskUpdated(payload: any) {
    this.logger.log('Tarea actualizada:', payload);
  }

  // Escuchar evento cuando se elimina una tarea
  @OnEvent(EventsList.TASK_DELETED)
  handleTaskDeleted(payload: {userId: mongoose.Types.ObjectId, taskId: mongoose.Types.ObjectId}) {
    this.userLogsService.taskDeleted(payload.userId, payload.taskId);
    this.statsService.taskDeleted();
  }

  // Escuchar evento cuando se marca una tarea como completada
  @OnEvent(EventsList.TASK_COMPLETED)
  handleTaskCompleted(payload: any) {
    this.userLogsService.taskCompleted(payload.userId, payload.taskId);
    this.statsService.taskCompleted();
  }
}
