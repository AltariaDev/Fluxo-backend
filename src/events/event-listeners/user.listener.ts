// src/events/user.listener.ts
import { Inject, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CalendarService } from 'src/calendar/calendar.service';
import { GamificationProfileService } from 'src/gamification-profile/gamification-profile.service';
import { StatsService } from 'src/stats/stats.service';
import { UserLogsService } from 'src/user-logs/user-logs.service';
import { EventsList } from '../list.events';
import mongoose from 'mongoose';
import { HabitsService } from 'src/habits/habits.service';
import { SubscriptionsService } from 'src/subscriptions/subscriptions.service';

@Injectable()
export class UserListener {
  private readonly logger = new Logger(UserListener.name);

  constructor(
    @Inject(UserLogsService) private readonly userLogsService: UserLogsService, // Asegúrate de importar el servicio correcto
    @Inject(CalendarService) private readonly calendarService: CalendarService, // Asegúrate de importar el servicio correcto
    @Inject(GamificationProfileService) private readonly gamificationProfileService: GamificationProfileService,
    @Inject(StatsService) private readonly statsService: StatsService,
    @Inject(HabitsService) private readonly habitsService: HabitsService,
    @Inject(SubscriptionsService) private readonly subscriptionsService: SubscriptionsService,
    // Asegúrate de importar el servicio correcto
  ) {}
  // Escuchar evento cuando un usuario se registre
  @OnEvent(EventsList.USER_REGISTERED)
  async handleUserRegistered(payload: {userId: mongoose.Types.ObjectId}) {
    this.logger.log('Usuario registrado:', payload);
    await this.userLogsService.create(payload.userId); // Crear logs de usuario
    await this.calendarService.createCalendar(payload.userId); // Crear calendario de usuario
    await this.gamificationProfileService.create(payload.userId); // Crear perfil de gamificación
    await this.statsService.updateUsersCount();// Crear estadísticas de usuario
    await this.subscriptionsService.createFreeSubscription(payload.userId); // Crear suscripción gratuita
  }
  @OnEvent(EventsList.USER_REGISTERED_GOOGLE)
  async handleUserRegisteredGoogle(payload: {userId: string, avatar?: string}) {
    // const profile = await this.gamificationProfileService.findMe(new mongoose.Types.ObjectId(payload.userId));
    // await this.gamificationProfileService.update(profile.id, {avatar: payload.avatar}, profile.user); // Crear perfil de gamificación
    await this.statsService.updateUsersCount(true);
  }

  // Escuchar evento cuando un usuario inicie sesión
  @OnEvent(EventsList.USER_LOGGED_IN)
  async handleUserLoggedIn(payload: {userId: mongoose.Types.ObjectId}) {
    this.logger.log('Usuario logueado:', payload);
    await this.userLogsService.updateLogin(payload.userId);
    await this.habitsService.checkHabits(payload.userId); 
  }

  @OnEvent(EventsList.USER_PROFILE_UPDATED)
  async handleUserProfileUpdated(payload: {userId: mongoose.Types.ObjectId}) {
    this.logger.log('Usuario actualizado:', payload);
    await this.userLogsService.updateProfile(payload.userId, new Date());
  }


  // Escuchar evento cuando un usuario actualice su perfil
  @OnEvent('user.updated')
  handleUserUpdated(payload: any) {
    this.logger.log('Usuario actualizado:', payload);
    // Aquí podrías registrar qué se ha cambiado en el perfil del usuario
  }

  // Escuchar evento cuando un usuario elimine su cuenta
  @OnEvent(EventsList.USER_DELETED)
  async handleUserDeleted(payload: any) {
    await this.statsService.userDeleted();
    // Aquí puedes realizar limpieza de datos o registros asociados al usuario eliminado
  }
}
