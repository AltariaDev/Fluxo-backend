import { HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import { UserLog, UserLogDocument } from './entities/user-log.entity';
import { InjectModel } from '@nestjs/mongoose';
import { PomodoroDocument } from 'src/pomodoro/entities/pomodoro.entity';
import { Pomodoro } from 'src/pomodoro/entities/pomodoro.entity';
import { PomodoroResponse, UserLogResponse } from './interfaces/user-log.interface';
import { Task, TaskDocument } from 'src/tasks/entities/task.entity';
import { Calendar, CalendarDocument } from 'src/calendar/entities/calendar.entity';
import { EventsCalendar, EventsCalendarDocument } from 'src/events-calendar/entities/events-calendar.entity';
import { Habit, HabitDocument } from 'src/habits/entities/habit.entity';

@Injectable()
export class UserLogsService {
  private readonly logger = new Logger(UserLogsService.name);

  constructor(
    @InjectModel(UserLog.name)
    private readonly userLogModel: Model<UserLogDocument>,
    @InjectModel(Pomodoro.name)
    private readonly pomodoroModel: Model<PomodoroDocument>,
    @InjectModel(Task.name)
    private readonly taskModel: Model<TaskDocument>,
    @InjectModel(Calendar.name)
    private readonly calendarModel: Model<CalendarDocument>,
    @InjectModel(EventsCalendar.name)
    private readonly eventsCalendarModel: Model<EventsCalendarDocument>,
    @InjectModel(Habit.name)
    private readonly habitModel: Model<HabitDocument>,
  ){}

  async create(userId: mongoose.Types.ObjectId) {
    try {
      const userLog = new this.userLogModel({
        userId: userId,
        registerTime: new Date(),
        lastLogin: new Date(),
        loginCount: 1,
        streak: 1,
        bestStreak: 1,
        taskCount: 0,
        logs: [],
        lastUpdate: new Date(),
      });
      return await userLog.save();
    } catch (error) {
      this.logger.error('Error creating user log:', error);
      throw new InternalServerErrorException('Error creating user log');
    }
  }

  async updateLogin(userId: mongoose.Types.ObjectId) {
    try {
      await this.checkStreak(userId, new Date());
      const log={type: 'login', date: new Date()};
      const result = await this.userLogModel.findOneAndUpdate(
        { userId },
        { 
          $set: { 
            lastLogin: new Date(), 
            lastUpdate: new Date()
          },
          $inc: { loginCount: 1 },
          $addToSet: { logs: log, loginDates: new Date() }
        },
        { new: true, upsert: true }
      );
      return result;
    } catch (error) {
      this.logger.error(`Error updating login for user ${userId}: ${error.message}`);
      throw new InternalServerErrorException('Error updating login');
    }
  }

  async checkStreak(userId: mongoose.Types.ObjectId, currentDate: Date) {
    try {
      // Find the user log
      let userLog = await this.userLogModel.findOne({ userId });
      
      if (!userLog) {
        throw new NotFoundException('User log not found');
      }

      const lastLogin = userLog.lastLogin;
      if (!lastLogin) {
        // First login ever, initialize streak
        await this.userLogModel.updateOne(
          { userId },
          { 
            $set: { 
              lastLogin: currentDate,
              streak: 1,
              bestStreak: 1
            }
          }
        );
        return 1;
      }

      // Normalize dates to midnight for comparison
      const lastLoginDate = new Date(lastLogin);
      const normalizedLastLogin = new Date(
        lastLoginDate.getFullYear(), 
        lastLoginDate.getMonth(), 
        lastLoginDate.getDate()
      );
      const normalizedCurrentDate = new Date(
        currentDate.getFullYear(), 
        currentDate.getMonth(), 
        currentDate.getDate()
      );
      // If already logged in today, don't change anything
      if (normalizedLastLogin.getTime() === normalizedCurrentDate.getTime()) {
        this.logger.log("already logged in today, returning streak");
        if (userLog.streak === 0) {
          await this.userLogModel.updateOne(
            { userId },
            { 
              $set: { 
                streak: 1,
                bestStreak: 1
              }
            }
          );
        }
        return userLog.streak;
      }

      // Check if last login was yesterday
      const oneDayInMs = 24 * 60 * 60 * 1000;
      const daysDifference = Math.round(
        (normalizedCurrentDate.getTime() - normalizedLastLogin.getTime()) / oneDayInMs
      );

      let newStreak = userLog.streak || 0;
      let bestStreak = userLog.bestStreak || 0;

      if (daysDifference === 1) {
        // User logged in yesterday, increment streak
        newStreak += 1;
        // Update best streak if current streak is higher
        if (newStreak > bestStreak) {
          bestStreak = newStreak;
        }
      } else {
        // User didn't log in yesterday, reset streak
        newStreak = 1; // Set to 1 because they're logging in today
      }
      // Update the user log
      await this.userLogModel.updateOne(
        { userId },
        { 
          $set: { 
            streak: newStreak,
            bestStreak: bestStreak,
            lastLogin: currentDate
          }
        }
      );
      
      return newStreak;
    } catch (error) {
      this.logger.error(`Error checking streak for user ${userId}: ${error.message}`);
      throw new InternalServerErrorException('Error checking streak');
    }
  }

  async taskCreated(userId: mongoose.Types.ObjectId, taskId: mongoose.Types.ObjectId) {
    try {
      const log = {type: 'task-created', object: taskId, date: new Date()};
      const userLog = await this.userLogModel.findOneAndUpdate(
        { userId },
        { $inc: { taskCounts: 1 }, $push: { logs: log }, $set: { lastUpdate: new Date() } },
        { new: true }
      );
      return userLog.save();
    } catch (error) {
      console.error('Error updating task count:', error);
      throw new InternalServerErrorException('Error updating task count');
    }
  }

  async habitCreated(userId: mongoose.Types.ObjectId, habitId: mongoose.Types.ObjectId) {
    try {
      const log = {type: 'habit-created', object: habitId, date: new Date()};
      const userLog = await this.userLogModel.findOneAndUpdate(
        { userId },
        { $inc: { habitCounts: 1 }, $push: { logs: log }, $set: { lastUpdate: new Date() } },
        { new: true }
      );
      return userLog.save();
    } catch (error) {
      console.error('Error updating habit count:', error);
      throw new InternalServerErrorException('Error updating habit count');
    }
  }

  async updateProfile(userId: mongoose.Types.ObjectId, updateTime: Date) {
    try {
      const log = {type: 'profile-updated', date: updateTime};
      const userLog = await this.userLogModel.findOneAndUpdate(
        { userId },
        { $push: { logs: log }, $set: { lastUpdate: updateTime } },
        { new: true }
      );
      return userLog;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new InternalServerErrorException('Error updating profile');
    }
  }

  async getUserLogs(userId: mongoose.Types.ObjectId) {
    try {
      const userLog = await this.userLogModel.findOne({ userId });
      if (!userLog) {
        throw new NotFoundException('User log not found');
      }
      return userLog;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error getting user logs:', error);
      throw new InternalServerErrorException('Error getting user logs');
    }
  }

  async getPomodoroTime(userId: mongoose.Types.ObjectId) {
    try {
      // Get only completed pomodoros
      const pomodoros = await this.pomodoroModel.find({ 
        userId,
        completed: true,
        endTime: { $exists: true }
      });

      // Calculate actual time spent for each pomodoro
      const totalTime = pomodoros.reduce((acc, pomodoro) => {
        if (pomodoro.startAt && pomodoro.endAt) {
          // Calculate actual time spent in seconds
          const timeSpent = Math.floor(
            (pomodoro.endAt.getTime() - pomodoro.startAt.getTime()) / 1000
          );
          return acc + timeSpent;
        }
        return acc;
      }, 0);

      return {
        totalTimeInSeconds: totalTime,
        totalTimeFormatted: this.formatTime(totalTime),
        completedPomodoros: pomodoros.length
      };
    } catch (error) {
      this.logger.error('Error getting pomodoro time:', error);
      throw new InternalServerErrorException('Error getting pomodoro time');
    }
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}s`);

    return parts.join(' ');
  }

  async getStreak(userId: mongoose.Types.ObjectId) {
    const userLog = await this.userLogModel.findOne({ userId });
    return userLog.streak;
  }

  async findAll() {
    return `This action returns all userLogs`;
  }

  async taskDeleted(userId: mongoose.Types.ObjectId, taskId: mongoose.Types.ObjectId) {
    const log = {type: 'task-deleted', object: taskId, date: new Date()};
    const userLog = await this.userLogModel.findOneAndUpdate(
      { userId },
      { $inc: { taskDeleted: 1 }, $push: { logs: log }, $set: { lastUpdate: new Date() } },
      { new: true }
    );
    return userLog;
  }

  async habitDeleted(userId: mongoose.Types.ObjectId, habitId: mongoose.Types.ObjectId) {
    const log = {type: 'habit-deleted', object: habitId, date: new Date()};
    const userLog = await this.userLogModel.findOneAndUpdate(
      { userId },
      { $inc: { habitDeleted: 1 }, $push: { logs: log }, $set: { lastUpdate: new Date() } },
      { new: true } 
    );
    return userLog;
  }

  async taskCompleted(userId: mongoose.Types.ObjectId, taskId: mongoose.Types.ObjectId) {
    const log = {type: 'task-completed', object: taskId, date: new Date()};
    const userLog = await this.userLogModel.findOneAndUpdate(
      { userId },
      { $inc: { taskCompleted: 1 }, $push: { logs: log }, $set: { lastUpdate: new Date() } },
      { new: true }
    );
    return userLog;
  }

  async habitCompleted(userId: mongoose.Types.ObjectId, habitId: mongoose.Types.ObjectId) {
    const log = {type: 'habit-completed', object: habitId, date: new Date()};
    const userLog = await this.userLogModel.findOneAndUpdate(
      { userId },
      { $inc: { habitCompleted: 1 }, $push: { logs: log }, $set: { lastUpdate: new Date() } },
      { new: true }
    );
    return userLog;
  }

  async taskCalendarCreated(userId: mongoose.Types.ObjectId, taskId: mongoose.Types.ObjectId) {
    const log = {type: 'task-calendar-created', object: taskId, date: new Date()};
    const userLog = await this.userLogModel.findOneAndUpdate(
      { userId },
      { $inc: { taskCalendarCreated: 1 }, $push: { logs: log }, $set: { lastUpdate: new Date() } },
      { new: true }
    );
    return userLog;
  }

  async pomodoroCreated(userId: mongoose.Types.ObjectId, pomodoroId: mongoose.Types.ObjectId, duration: number, cycles: number) {
    const log = {type: 'pomodoro-created', date: new Date(), object: pomodoroId, value: {duration: duration, cycles: cycles}};
    const userLog = await this.userLogModel.findOneAndUpdate(
      { userId },
      { $inc: { pomodoroCreated: 1 }, $push: { logs: log }, $set: { lastUpdate: new Date() } },
      { new: true }
    );
    return userLog;
  }


  async pomodoroStarted(userId: mongoose.Types.ObjectId, pomodoroId: mongoose.Types.ObjectId, duration: number, cycles: number) {
    const log = {type: 'pomodoro-started', date: new Date(), object: pomodoroId, value: {duration: duration, cycles: cycles}};
    const userLog = await this.userLogModel.findOneAndUpdate(
      { userId },
      { $inc: { pomodoroStarted: 1 }, $push: { logs: log }, $set: { lastUpdate: new Date() } },
      { new: true }
    );
    return userLog;
  }

  async pomodoroCompleted(userId: mongoose.Types.ObjectId, pomodoroId: mongoose.Types.ObjectId, duration: number, cycles: number) {
    const log = {type: 'pomodoro-completed', object: pomodoroId, value: {duration: duration, cycles: cycles}};
    const userLog = await this.userLogModel.findOneAndUpdate(
      { userId },
      { $inc: { pomodoroCompleted: 1 }, $push: { logs: log }, $set: { lastUpdate: new Date() } },
      { new: true }
    );
    return userLog;
  }

  async eventCalendarCreated(userId: mongoose.Types.ObjectId, eventId: mongoose.Types.ObjectId) {
    const log = {type: 'event-calendar-created', object: eventId, date: new Date()};
    const userLog = await this.userLogModel.findOneAndUpdate(
      { userId },
      { $inc: { EventsCalendarCreated: 1 }, $push: { logs: log }, $set: { lastUpdate: new Date() } },
      { new: true }
    );
    return userLog;
  }


  async eventCalendarDeleted(userId: mongoose.Types.ObjectId, eventId: mongoose.Types.ObjectId) {
    const log = {type: 'event-calendar-deleted', object: eventId, date: new Date()};
    const userLog = await this.userLogModel.findOneAndUpdate(
      { userId },
      { $inc: { EventsCalendarDeleted: 1 }, $push: { logs: log }, $set: { lastUpdate: new Date() } },
      { new: true }
    );
    return userLog;
  }

  async pomodoroFinished(userId: mongoose.Types.ObjectId, pomodoroId: mongoose.Types.ObjectId, duration: number, cycles: number) {
    const log = {type: 'pomodoro-finished', object: pomodoroId, value: {duration: duration, cycles: cycles}};
    const userLog = await this.userLogModel.findOneAndUpdate(
      { userId },
      { $inc: { pomodoroFinished: 1 }, $push: { logs: log }, $set: { lastUpdate: new Date() } },
      { new: true }
    );
    return userLog;
  }

  async getUserStats(userId: mongoose.Types.ObjectId) {
    try {
      const userLog = await this.userLogModel.findOne({ userId });
      if (!userLog) {
        throw new NotFoundException('User log not found');
      }
      let lastLogin = userLog.loginDates[userLog.loginDates.length - 1];

      const tasks = await this.taskModel.find({ userId });
      const habits = await this.habitModel.find({ userId });
      const events = await this.eventsCalendarModel.find({ userId });
      const pomodoros = await this.pomodoroModel.find({ userId });
      const calendar = await this.calendarModel.find({ userId });

      const completedTasks = tasks.filter(task => task.status === 'completed');
      const pendingTasks = tasks.filter(task => task.status === 'pending');
      const droppedTasks = tasks.filter(task => task.status === 'dropped');

      // Get current date for all calculations
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      // Calculate total time spent in events
      const pastEvents = events.filter(event => new Date(event.endDate) < currentDate);
      const totalTimeSpent = pastEvents.reduce((total, event) => {
        if (event.duration) {
          return total + event.duration;
        } else if (event.startDate && event.endDate) {
          const start = new Date(event.startDate);
          const end = new Date(event.endDate);
          const durationInMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
          return total + durationInMinutes;
        }
        return total;
      }, 0);
      
      // Get days in current month
      const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      
      // Initialize array with zeros for each day of the month
      const completedDates = new Array(daysInMonth).fill(0);
      
      // Process each habit's completion dates
      habits.forEach(habit => {
        habit.completedDates.forEach(date => {
          const completionDate = new Date(date);
          if (completionDate.getMonth() === currentMonth && 
              completionDate.getFullYear() === currentYear) {
            completedDates[completionDate.getDate() - 1]++;
          }
        });
      });

      const pomodoroCompleted = pomodoros.filter(pomodoro => pomodoro.state === 'completed');
      let interruptions = 0;
      for (const pomodoro of pomodoroCompleted) {
        interruptions += pomodoro.interruptions;
      }
      const mediumInterruptions = interruptions / pomodoroCompleted.length;
      const PomodoroWithoutInterruptions = pomodoros.filter(pomodoroCompleted => pomodoroCompleted.interruptions === 0);

      let totalTimeDone=0;
      let totalTimePlanned=0;
      pomodoros.forEach(pomodoro => {
        if (pomodoro.state === 'completed') {
          totalTimeDone += (pomodoro.workDuration * pomodoro.cycles);
          totalTimePlanned += totalTimeDone;
        }
        if (pomodoro.state === 'finished') {
          totalTimeDone += (pomodoro.workDuration * pomodoro.currentCycle);
          totalTimePlanned += (pomodoro.workDuration * pomodoro.cycles);
        }
      });

      

      const stats: UserLogResponse = {
        Login: {
          registerTime: userLog.registerTime,
          lastLogin: lastLogin,
        },
        Streak: {
          currentStreak: userLog.streak,
          bestStreak: userLog.bestStreak,
        },
        Tasks: {
          totalTasks: userLog.taskCounts,
          totalActualTasks: tasks.length,
          completedTasks: completedTasks.length,
          pendingTasks: pendingTasks.length,
          droppedTasks: droppedTasks.length,
        },
        Habits: {
          activeHabits: habits.length,
          completedHabits: {
            month: currentMonth,
            completedDate: completedDates,
          },
        },
        Events: {
          totalEvents: userLog.EventsCalendarCreated,
          totalActualEvents: events.length,
          spendTimeEvents: totalTimeSpent,
        },
        Pomodoros: {
          totalPomodoros: userLog.pomodoroCreated,
          totalActualPomodoros: pomodoros.length,
          completedPomodoros: pomodoroCompleted.length,
          completedPausedPomodoros: pomodoros.filter(pomodoro => pomodoro.interruptions > 0).length,
          droppedPomodoros: pomodoros.filter(pomodoro => pomodoro.state === 'finished').length,
          mediumInterruptions: mediumInterruptions,
          PomodoroWithoutInterruptions: PomodoroWithoutInterruptions.length,
          totalInterruptions: interruptions,
          totalTimeDone: totalTimeDone,
          totalTimePlanned: totalTimePlanned,
        },
        Calendar: {
          totalEvents: calendar[0]?.events?.length || 0,
          totalTasks: calendar[0]?.tasks?.length || 0,
          percentageTasks: tasks.length > 0 ? 
            ((calendar[0]?.tasks?.length || 0) / tasks.length) * 100 : 0
        }
      }
      return stats;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error getting user stats:', error);
      throw new InternalServerErrorException('Error getting user stats');
    }
  }

  async getPomodoroStats(userId: mongoose.Types.ObjectId, year: number, week: number) {
    try {
      const pomodoros = await this.pomodoroModel.find({ userId });
      if (!pomodoros) {
        throw new NotFoundException('Pomodoros not found');
      }

      // Get start and end dates for the specified week
      const startDate = new Date(year, 0, 1 + (week - 1) * 7);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6);

      // Initialize array for each day of the week
      const pomodorosPerDay = Array(7).fill(0).map((_, index) => ({
        day: index + 1,
        pomodoros: 0
      }));

      // Count pomodoros for each day
      pomodoros.forEach(pomodoro => {
        if (pomodoro.startAt && pomodoro.startAt >= startDate && pomodoro.startAt <= endDate) {
          const dayIndex = pomodoro.startAt.getDay(); // 0-6 (Sunday-Saturday)
          const adjustedIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Convert to 0-6 (Monday-Sunday)
          pomodorosPerDay[adjustedIndex].pomodoros++;
        }
      });

      const pomodoroResponse: PomodoroResponse = {
        pomodoros: pomodorosPerDay
      };
      
      return pomodoroResponse;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Error getting pomodoro stats');
    }
  }

  async getTasksStats(userId: mongoose.Types.ObjectId, monthInit: string, monthEnd: string) {
    try {
      // Validación de formato y rango
      const monthYearRegex = /^([1-9]|1[0-2])-\d{4}$/;
      if (!monthYearRegex.test(monthInit) || !monthYearRegex.test(monthEnd)) {
        throw new BadRequestException('monthInit and monthEnd must be in format M-YYYY or MM-YYYY');
      }
      const [initMonth, initYear] = monthInit.split('-').map(Number);
      const [endMonth, endYear] = monthEnd.split('-').map(Number);
      if (initMonth < 1 || initMonth > 12 || endMonth < 1 || endMonth > 12) {
        throw new BadRequestException('Month must be between 1 and 12');
      }
      if (isNaN(initYear) || isNaN(endYear)) {
        throw new BadRequestException('Year must be a valid number');
      }
      if (endYear < initYear || (endYear === initYear && endMonth < initMonth)) {
        throw new BadRequestException('monthEnd must be equal or after monthInit');
      }

      const tasks = await this.taskModel.find({ userId });
      if (!tasks) {
        throw new NotFoundException('Tasks not found');
      }

      // Calculate total months between dates
      const totalMonths = (endYear - initYear) * 12 + (endMonth - initMonth) + 1;
      
      // Initialize response array
      const response = Array(totalMonths).fill(null).map((_, index) => {
        const currentMonth = (initMonth + index - 1) % 12 + 1;
        const currentYear = initYear + Math.floor((initMonth + index - 1) / 12);
        return {
          month: currentMonth,
          year: currentYear,
          completedTasks: 0,
          pendingTasks: 0,
          droppedTasks: 0,
          createdTasks: 0
        };
      });

      // Count tasks for each month
      tasks.forEach(task => {
        const taskDate = task.completedAt;
        if (!taskDate) return;

        const taskMonth = taskDate.getMonth() + 1; // getMonth() returns 0-11
        const taskYear = taskDate.getFullYear();

        // Find the corresponding month in our response array
        const monthIndex = (taskYear - initYear) * 12 + (taskMonth - initMonth);
        if (monthIndex < 0 || monthIndex >= totalMonths) return;

        const monthStats = response[monthIndex];
        
        // Count by status
        if (task.status === 'completed') {
          monthStats.completedTasks++;
        } else if (task.status === 'pending' || task.status === 'progress') {
          monthStats.pendingTasks++;
        } else if (task.status === 'dropped') {
          monthStats.droppedTasks++;
        }

        // Calculate total created tasks
        monthStats.createdTasks = monthStats.completedTasks + monthStats.pendingTasks + monthStats.droppedTasks;
      });

      return { response };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Error getting tasks stats');
    }
  }

  async getHabitsStats(userId: mongoose.Types.ObjectId, monthInit: string, monthEnd: string) {
    try {
      // Validación de formato y rango
      const monthYearRegex = /^([1-9]|1[0-2])-\d{4}$/;
      if (!monthYearRegex.test(monthInit) || !monthYearRegex.test(monthEnd)) {
        throw new BadRequestException('monthInit and monthEnd must be in format M-YYYY or MM-YYYY');
      }
      const [initMonth, initYear] = monthInit.split('-').map(Number);
      const [endMonth, endYear] = monthEnd.split('-').map(Number);
      if (initMonth < 1 || initMonth > 12 || endMonth < 1 || endMonth > 12) {
        throw new BadRequestException('Month must be between 1 and 12');
      }
      if (isNaN(initYear) || isNaN(endYear)) {
        throw new BadRequestException('Year must be a valid number');
      }
      if (endYear < initYear || (endYear === initYear && endMonth < initMonth)) {
        throw new BadRequestException('monthEnd must be equal or after monthInit');
      }

      const habits = await this.habitModel.find({ userId });
      if (!habits) {
        throw new NotFoundException('Habits not found');
      }

      // Calculate total months between dates
      const totalMonths = (endYear - initYear) * 12 + (endMonth - initMonth) + 1;

      // Initialize response array
      const response = Array(totalMonths).fill(null).map((_, index) => {
        const currentMonth = (initMonth + index - 1) % 12 + 1;
        const currentYear = initYear + Math.floor((initMonth + index - 1) / 12);
        // Get days in current month
        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
        return {
          month: currentMonth,
          year: currentYear,
          completedDates: new Array(daysInMonth).fill(0)
        };
      });

      // Count completed habits for each day in each month
      habits.forEach(habit => {
        habit.completedDates.forEach(date => {
          const completionDate = new Date(date);
          const month = completionDate.getMonth() + 1;
          const year = completionDate.getFullYear();
          const day = completionDate.getDate();
          // Find the corresponding month in our response array
          const monthIndex = (year - initYear) * 12 + (month - initMonth);
          if (monthIndex < 0 || monthIndex >= totalMonths) return;
          const monthStats = response[monthIndex];
          // Increment the count for the day (days are 1-indexed)
          if (day > 0 && day <= monthStats.completedDates.length) {
            monthStats.completedDates[day - 1]++;
          }
        });
      });

      return { response };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException('Error getting habits stats');
    }
  }





  
}