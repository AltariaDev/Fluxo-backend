// src/events/calendar.listener.ts
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GamificationProfileService } from 'src/gamification-profile/gamification-profile.service';

@Injectable()
export class CalendarListener {
  private readonly logger = new Logger(CalendarListener.name);

  constructor(private readonly gamificationProfileService: GamificationProfileService) {}

  // Escuchar evento cuando se crea un evento en el calendario
  @OnEvent('calendar.event.created')
  async handleCalendarEventCreated(payload: any) {
    this.logger.log('Evento creado en el calendario:', payload);
    // Aquí puedes registrar la acción o hacer cualquier otra cosa que desees
  }

  // Escuchar evento cuando se actualiza un evento en el calendario
  @OnEvent('calendar.event.updated')
  async handleCalendarEventUpdated(payload: any) {
    this.logger.log('Evento actualizado en el calendario:', payload);
  }

  // Escuchar evento cuando se elimina un evento del calendario
  @OnEvent('calendar.event.deleted')
  async handleCalendarEventDeleted(payload: any) {
    this.logger.log('Evento eliminado del calendario:', payload);
  }
}
