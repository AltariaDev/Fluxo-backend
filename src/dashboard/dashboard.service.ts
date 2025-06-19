// import { Injectable, Logger } from '@nestjs/common';
// import { TasksService } from 'src/tasks/tasks.service';
// import { HabitsService } from 'src/habits/habits.service';
// import { PomodoroService } from 'src/pomodoro/pomodoro.service';
// import { UserLogsService } from 'src/user-logs/user-logs.service';
// import { InjectModel } from '@nestjs/mongoose';
// import { Model } from 'mongoose';
// import { User, UserDocument } from 'src/users/entities/user.entity';
// import { Task, TaskDocument } from 'src/tasks/entities/task.entity';
// import { Habit, HabitDocument } from 'src/habits/entities/habit.entity';
// import { Pomodoro, PomodoroDocument } from 'src/pomodoro/entities/pomodoro.entity';
// import mongoose from 'mongoose';

// @Injectable()
// export class DashboardService {
//   private readonly logger = new Logger(DashboardService.name);

//   constructor(
//     private readonly tasksService: TasksService,
//     private readonly habitsService: HabitsService,
//     private readonly pomodoroService: PomodoroService,
//     private readonly userLogsService: UserLogsService,
//     @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
//     @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
//     @InjectModel(Habit.name) private readonly habitModel: Model<HabitDocument>,
//     @InjectModel(Pomodoro.name) private readonly pomodoroModel: Model<PomodoroDocument>,
//   ) {}

//   async getUserDashboard(userId: mongoose.Types.ObjectId) {
//     try {
//       const [tasks, habits, pomodoroStats, userLogs] = await Promise.all([
//         this.getTasksData(userId),
//         this.getHabitsData(userId),
//         this.getPomodoroData(userId),
//         this.userLogsService.getUserLogs(userId),
//       ]);

//       return {
//         tasks,
//         habits,
//         pomodoro: pomodoroStats,
//         userActivity: {
//           streak: userLogs?.streak || 0,
//           loginCount: userLogs?.loginCount || 0,
//           lastLogin: userLogs?.lastLogin,
//         },
//       };
//     } catch (error) {
//       this.logger.error(`Error fetching user dashboard data: ${error.message}`);
//       throw error;
//     }
//   }

//   async getGlobalDashboard() {
//     try {
//       const [
//         totalUsers,
//         totalTasks, 
//         completedTasks,
//         totalHabits,
//         totalPomodoros,
//         completedPomodoros
//       ] = await Promise.all([
//         this.userModel.countDocuments(),
//         this.taskModel.countDocuments(),
//         this.taskModel.countDocuments({ status: 'completed' }),
//         this.habitModel.countDocuments(),
//         this.pomodoroModel.countDocuments(),
//         this.pomodoroModel.countDocuments({ completed: true }),
//       ]);


//       const last7Days = this.getLast7Days();
//       const dailyStats = await this.getDailyStats(last7Days);
//       const topUsers = await this.getTopUsers(5);

//       return {
//         summary: {
//           totalUsers,
//           totalTasks,
//           completedTasks,
//           completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100).toFixed(1) + '%' : '0%',
//           totalHabits,
//           totalPomodoros,
//           completedPomodoros,
//         },
//         trends: {
//           dailyStats,
//         },
//         topUsers,
//       };
//     } catch (error) {
//       this.logger.error(`Error fetching global dashboard data: ${error.message}`);
//       throw error;
//     }
//   }

//   async getSpecificUserDashboard(userId: mongoose.Types.ObjectId) {
//     return this.getUserDashboard(userId);
//   }

//   private async getTasksData(userId: mongoose.Types.ObjectId) {
//     const allTasks = await this.tasksService.findAll(userId);
    
//     return {
//       totalTasks: allTasks.length,
//       completedTasks: allTasks.filter(task => task.status === 'completed').length,
//       pendingTasks: allTasks.filter(task => task.status === 'pending').length,
//       tasksByCategory: this.groupByCategory(allTasks),
//       tasksByPriority: this.groupByPriority(allTasks),
//       recentTasks: allTasks
//         .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
//         .slice(0, 5),
//     };
//   }

//   private async getHabitsData(userId: mongoose.Types.ObjectId) {
//     const allHabits = await this.habitsService.findAll(userId);
    
//     return {
//       totalHabits: allHabits.length,
//       activeHabits: allHabits.filter(habit => !habit.status).length,
//       completedToday: allHabits.filter(habit => 
//         habit.status && 
//         habit.lastCompletedDate && 
//         new Date(habit.lastCompletedDate).toDateString() === new Date().toDateString()
//       ).length,
//       bestStreak: Math.max(...allHabits.map(habit => habit.bestStreak || 0), 0),
//       habitsByFrequency: {
//         daily: allHabits.filter(habit => habit.frequency === 'daily').length,
//         weekly: allHabits.filter(habit => habit.frequency === 'weekly').length,
//         monthly: allHabits.filter(habit => habit.frequency === 'monthly').length,
//       },
//     };
//   }

//   private async getPomodoroData(userId: mongoose.Types.ObjectId) {
//     return await this.userLogsService.getPomodoroTime(userId);
//   }

//   private groupByCategory(items: any[]) {
//     const result = {};
    
//     items.forEach(item => {
//       if (item.category) {
//         result[item.category] = (result[item.category] || 0) + 1;
//       }
//     });
    
//     return result;
//   }

//   private groupByPriority(items: any[]) {
//     const result = {
//       high: 0,
//       medium: 0,
//       low: 0
//     };
    
//     items.forEach(item => {
//       if (item.priority && result[item.priority] !== undefined) {
//         result[item.priority]++;
//       }
//     });
    
//     return result;
//   }

//   private getLast7Days() {
//     const days = [];
//     for (let i = 6; i >= 0; i--) {
//       const date = new Date();
//       date.setDate(date.getDate() - i);
//       days.push(date);
//     }
//     return days;
//   }

//   private async getDailyStats(days: Date[]) {
//     const dailyStats = [];

//     for (const day of days) {
//       const startOfDay = new Date(day);
//       startOfDay.setHours(0, 0, 0, 0);
      
//       const endOfDay = new Date(day);
//       endOfDay.setHours(23, 59, 59, 999);

//       const [tasksCreated, tasksCompleted, habitsCreated, pomodorosStarted] = await Promise.all([
//         this.taskModel.countDocuments({ 
//           createdAt: { $gte: startOfDay, $lte: endOfDay } 
//         }),
//         this.taskModel.countDocuments({ 
//           status: 'completed',
//           updatedAt: { $gte: startOfDay, $lte: endOfDay } 
//         }),
//         this.habitModel.countDocuments({ 
//           createdAt: { $gte: startOfDay, $lte: endOfDay } 
//         }),
//         this.pomodoroModel.countDocuments({ 
//           startTime: { $gte: startOfDay, $lte: endOfDay } 
//         }),
//       ]);

//       dailyStats.push({
//         date: day.toLocaleDateString(),//.split('T')[0], // formato YYYY-MM-DD
//         tasksCreated,
//         tasksCompleted,
//         habitsCreated,
//         pomodorosStarted,
//       });
//     }

//     return dailyStats;
//   }

//   private async getTopUsers(limit: number) {
//     const topUsersByTasks = await this.userModel.aggregate([
//       {
//         $lookup: {
//           from: 'tasks',
//           localField: '_id',
//           foreignField: 'userId',
//           as: 'tasks'
//         }
//       },
//       {
//         $project: {
//           _id: 1,
//           username: 1,
//           email: 1,
//           completedTasks: {
//             $size: {
//               $filter: {
//                 input: '$tasks',
//                 as: 'task',
//                 cond: { $eq: ['$$task.status', 'completed'] }
//               }
//             }
//           }
//         }
//       },
//       { $sort: { completedTasks: -1 } },
//       { $limit: limit }
//     ]);

//     return topUsersByTasks.map(user => ({
//       username: user.username,
//       completedTasks: user.completedTasks
//     }));
//   }
// }