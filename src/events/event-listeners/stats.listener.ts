// import { Injectable } from '@nestjs/common';
// import { OnEvent } from '@nestjs/event-emitter';
// import { StatsService } from '../../stats/stats.service';
// import { UserLogsService } from '../../user-logs/user-logs.service';
// import { EventsList } from '../list.events';
// import { Logger } from '@nestjs/common';

// @Injectable()
// export class StatsListener {
//   private readonly logger = new Logger(StatsListener.name);

//   constructor(
//     private readonly statsService: StatsService,
//     private readonly userLogsService: UserLogsService,
//   ) {}

//   @OnEvent(EventsList.USER_REGISTERED)
//   async handleUserRegistered(payload: { userId: string }) {
//     try {
//       await this.statsService.updateStats({ 
//         usersRegistered: 1,
//         lastUpdated: new Date()
//       });
//       await this.userLogsService.createLog(payload.userId, 'User registered');
//     } catch (error) {
//       this.logger.error(`Error handling user registration: ${error.message}`);
//     }
//   }

//   @OnEvent(EventsList.USER_LOGGED_IN)
//   async handleUserLogin(payload: { userId: string }) {
//     try {
//       await this.statsService.updateStats({ 
//         activeUsers: 1,
//         DAU: 1,
//         lastUpdated: new Date()
//       });
//       await this.userLogsService.createLog(payload.userId, 'User logged in');
//     } catch (error) {
//       this.logger.error(`Error handling user login: ${error.message}`);
//     }
//   }

//   @OnEvent(EventsList.TASK_CREATED)
//   async handleTaskCreated(payload: { userId: string; taskId: string }) {
//     try {
//       await this.statsService.updateStats({ 
//         totalTasks: 1,
//         pendingTasks: 1,
//         lastUpdated: new Date()
//       });
//       await this.userLogsService.createLog(payload.userId, `Task created: ${payload.taskId}`);
//     } catch (error) {
//       this.logger.error(`Error handling task creation: ${error.message}`);
//     }
//   }

//   @OnEvent(EventsList.TASK_COMPLETED)
//   async handleTaskCompleted(payload: { userId: string; taskId: string }) {
//     try {
//       await this.statsService.updateStats({ 
//         completedTasks: 1,
//         pendingTasks: -1,
//         lastUpdated: new Date()
//       });
//       await this.userLogsService.createLog(payload.userId, `Task completed: ${payload.taskId}`);
//     } catch (error) {
//       this.logger.error(`Error handling task completion: ${error.message}`);
//     }
//   }

//   @OnEvent(EventsList.HABIT_CREATED)
//   async handleHabitCreated(payload: { userId: string; habitId: string }) {
//     try {
//       await this.statsService.updateStats({ 
//         totalHabits: 1,
//         lastUpdated: new Date()
//       });
//       await this.userLogsService.createLog(payload.userId, `Habit created: ${payload.habitId}`);
//     } catch (error) {
//       this.logger.error(`Error handling habit creation: ${error.message}`);
//     }
//   }

//   @OnEvent(EventsList.POMODORO_COMPLETED)
//   async handlePomodoroCompleted(payload: { userId: string; pomodoroId: string; duration: number }) {
//     try {
//       await this.statsService.updateStats({ 
//         totalDuration: payload.duration,
//         lastUpdated: new Date()
//       });
//       await this.userLogsService.createLog(payload.userId, `Pomodoro completed: ${payload.pomodoroId}`);
//     } catch (error) {
//       this.logger.error(`Error handling pomodoro completion: ${error.message}`);
//     }
//   }

//   @OnEvent(EventsList.USER_PROFILE_UPDATED)
//   async handleProfileUpdated(payload: { userId: string }) {
//     try {
//       await this.statsService.updateStats({ 
//         totalProfileUpdates: 1,
//         lastUpdated: new Date()
//       });
//       await this.userLogsService.createLog(payload.userId, 'Profile updated');
//     } catch (error) {
//       this.logger.error(`Error handling profile update: ${error.message}`);
//     }
//   }

//   @OnEvent(EventsList.BADGE_EARNED)
//   async handleBadgeEarned(payload: { userId: string; badgeId: string }) {
//     try {
//       await this.userLogsService.createLog(payload.userId, `Badge earned: ${payload.badgeId}`);
//     } catch (error) {
//       this.logger.error(`Error handling badge earned: ${error.message}`);
//     }
//   }

//   @OnEvent(EventsList.CALENDAR_SYNCED)
//   async handleCalendarSynced(payload: { userId: string }) {
//     try {
//       await this.userLogsService.createLog(payload.userId, 'Calendar synced');
//     } catch (error) {
//       this.logger.error(`Error handling calendar sync: ${error.message}`);
//     }
//   }
// } 