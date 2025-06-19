import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import mongoose from 'mongoose';
import { UserLogsService } from 'src/user-logs/user-logs.service';
import { StatsService } from 'src/stats/stats.service';
import { CalendarService } from 'src/calendar/calendar.service';
import { EventsList } from '../list.events';

@Injectable()
export class EventsCalendarListener {
  private readonly logger = new Logger(EventsCalendarListener.name);

  constructor(
    @Inject(UserLogsService) private readonly userLogsService: UserLogsService,
    @Inject(StatsService) private readonly statsService: StatsService,
    @Inject(CalendarService) private readonly calendarService: CalendarService,
  ) {}

  // Escuchar evento cuando se crea un evento en el calendario
  @OnEvent(EventsList.EVENT_CREATED)
  async handleEventCreated(payload: {userId: mongoose.Types.ObjectId, eventId: mongoose.Types.ObjectId}) {
    this.logger.log('Evento de calendario creado:', payload);
    await this.userLogsService.eventCalendarCreated(payload.userId, payload.eventId);
    // Automatically add event to user's calendar
    await this.calendarService.addEvent(payload.userId, payload.eventId);
  }

  // Escuchar evento cuando se actualiza un evento en el calendario
  // @OnEvent(EventsList.EVENT_UPDATED)
  // async handleEventUpdated(payload: {userId: mongoose.Types.ObjectId, eventId: mongoose.Types.ObjectId}) {
  //   this.logger.log('Evento de calendario actualizado:', payload);
  //   // No specific method exists yet for event updates in UserLogsService
  // }

  // Escuchar evento cuando se elimina un evento en el calendario
  @OnEvent(EventsList.EVENT_DELETED)
  async handleEventDeleted(payload: {userId: mongoose.Types.ObjectId, eventId: mongoose.Types.ObjectId}) {
    this.logger.log('Evento de calendario eliminado:', payload);
    await this.userLogsService.eventCalendarDeleted(payload.userId, payload.eventId);
    // Automatically remove event from user's calendar
    await this.calendarService.removeEvent(payload.userId, payload.eventId);
  }
}
