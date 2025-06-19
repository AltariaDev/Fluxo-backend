// src/events/habit.listener.ts
import { Injectable, Inject, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import mongoose from 'mongoose';
import { UserLogsService } from 'src/user-logs/user-logs.service';
import { EventsList } from '../list.events';
import { StatsService } from 'src/stats/stats.service';
@Injectable()
export class HabitListener {
  private readonly logger = new Logger(HabitListener.name);

  constructor(
    @Inject(UserLogsService) private readonly userLogsService: UserLogsService, // Asegúrate de importar el servicio correcto
    @Inject(StatsService) private readonly statsService: StatsService,
  ) {}
  // Escuchar evento cuando se crea un hábito
  @OnEvent(EventsList.HABIT_CREATED)
  async handleHabitCreated(payload: {userId: mongoose.Types.ObjectId, habitId: mongoose.Types.ObjectId}) {
    await this.userLogsService.habitCreated(payload.userId, payload.habitId);
    await this.statsService.habitCreated();
  }

  // Escuchar evento cuando se actualiza un hábito
  @OnEvent('habit.updated')
  handleHabitUpdated(payload: any) {
    this.logger.log('Hábito actualizado:', payload);
  }

  // Escuchar evento cuando se marca un hábito como completado
  @OnEvent(EventsList.HABIT_COMPLETED)
  handleHabitCompleted(payload: any) {
    this.userLogsService.habitCompleted(payload.userId, payload.habitId);
    this.statsService.habitCompleted();
  }

  // Escuchar evento cuando se elimina un hábito
  @OnEvent(EventsList.HABIT_DELETED)
  handleHabitDeleted(payload: {userId: mongoose.Types.ObjectId, habitId: mongoose.Types.ObjectId}) {
    this.userLogsService.habitDeleted(payload.userId, payload.habitId);
    this.statsService.habitDeleted();
  }


}
