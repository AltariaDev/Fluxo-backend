// src/events/pomodoro.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventsList } from '../list.events';
import mongoose from 'mongoose';
import { UserLogsService } from 'src/user-logs/user-logs.service';

@Injectable()
export class PomodoroListener {
  private readonly logger = new Logger(PomodoroListener.name);

  constructor(private readonly userLogsService: UserLogsService) {}

  // Escuchar evento cuando comienza un pomodoro
  @OnEvent(EventsList.POMODORO_CREATED)
  async handlePomodoroStarted(payload: {userId: mongoose.Types.ObjectId, pomodoroId: mongoose.Types.ObjectId, duration: number, cycles: number}) {
    this.userLogsService.pomodoroCreated(payload.userId, payload.pomodoroId, payload.duration, payload.cycles);
  }

  // Escuchar evento cuando se detiene un pomodoro
  @OnEvent(EventsList.POMODORO_COMPLETED)
  async handlePomodoroStopped(payload: {userId: mongoose.Types.ObjectId, pomodoroId: mongoose.Types.ObjectId, duration: number, cycles: number}) {
    this.userLogsService.pomodoroCompleted(payload.userId, payload.pomodoroId, payload.duration, payload.cycles);
  }

  // Escuchar evento cuando se actualiza la duración de un pomodoro
  @OnEvent(EventsList.POMODORO_STARTED)
  async handlePomodoroDurationUpdated(payload: {userId: mongoose.Types.ObjectId, pomodoroId: mongoose.Types.ObjectId, duration: number, cycles: number}) {
    this.userLogsService.pomodoroStarted(payload.userId, payload.pomodoroId, payload.duration, payload.cycles);
  }

  // Escuchar evento cuando se finaliza un pomodoro
  @OnEvent(EventsList.POMODORO_FINISHED)
  async handlePomodoroFinished(payload: {userId: mongoose.Types.ObjectId, pomodoroId: mongoose.Types.ObjectId, duration: number, cycles: number}) {
    this.userLogsService.pomodoroFinished(payload.userId, payload.pomodoroId, payload.duration, payload.cycles);
  }
}
