import { ForbiddenException, Inject, Injectable, InternalServerErrorException, NotFoundException, Logger, BadRequestException, ConflictException, HttpException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { Calendar, CalendarDocument } from "./entities/calendar.entity";
import { TasksService } from "src/tasks/tasks.service";
import { EventsCalendarService } from "src/events-calendar/events-calendar.service";
import { RemindersService } from "src/reminders/reminders.service";

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(
    @InjectModel(Calendar.name) private calendarModel: Model<CalendarDocument>,
    @Inject(TasksService) private readonly tasksService: TasksService,
    @Inject(EventsCalendarService) private readonly eventsService: EventsCalendarService,
    @Inject(RemindersService) private readonly remindersService: RemindersService,
  ) {}

  private formatDate(dateString?: string): Date | undefined {
    return dateString ? new Date(dateString) : undefined;
  }

  async createCalendar(userId: mongoose.Types.ObjectId): Promise<CalendarDocument> {
    try {
      if (!userId) {
        throw new BadRequestException('User ID is required');
      }

      // Check if calendar already exists
      const existingCalendar = await this.calendarModel.findOne({ user: userId });
      if (existingCalendar) {
        return existingCalendar;
      }

      const calendar = await this.calendarModel.create({ 
        user: userId, 
        tasks: [], 
        reminders: [], 
        events: []
      });
      return calendar;
    } catch (error) {
      this.logger.error(`Error creating calendar: ${error.message}`);
      if (error.code === 11000) {
        throw new ConflictException('Calendar already exists for this user');
      }
      throw new InternalServerErrorException("Error creating calendar");
    }
  }

  async getCalendar(userId: string): Promise<CalendarDocument> {
    return await this.calendarModel.findOne({ user: userId }).populate(["tasks", "events"]);
  }

  async addTask(userId: mongoose.Types.ObjectId, taskId: mongoose.Types.ObjectId): Promise<CalendarDocument> {
    const calendar = await this.calendarModel.findOne({ user: userId });
    const task = await this.tasksService.findOne(taskId, userId);
    if (!calendar) {
      throw new NotFoundException("Calendar not found");
    }
    if (!calendar.user.equals(userId) && !task.userId.equals(userId)) {
      throw new ForbiddenException("Forbidden access");
    }
    if (!task) {
      throw new NotFoundException("Task not found");
    }
    const tasks_calendar = await this.findTaskByDate(userId, task["dueDate"]);
    // Check for task time conflicts
    // if (tasks_calendar?.length > 0) {
    //   const newTaskStart = new Date(task.startDate);
    //   const newTaskEnd = new Date(task.endDate);

    //   const conflictResults = await Promise.all(
    //     tasks_calendar.map(async (existingTask) => {
    //       const existingTaskCalendar = await this.tasksService.findOne(existingTask._id, userId);
    //       const existingStart = new Date(existingTaskCalendar.startDate);
    //       const existingEnd = new Date(existingTaskCalendar.endDate);
    //       const result = (
    //         (newTaskStart >= existingStart && newTaskStart < existingEnd) ||
    //         (newTaskEnd > existingStart && newTaskEnd <= existingEnd) ||
    //         (newTaskStart <= existingStart && newTaskEnd >= existingEnd)
    //       );
    //       return result;
    //   }));

    //   const hasConflict = conflictResults.some(Boolean);

    //   if (hasConflict) {
    //     throw new ConflictException('Task conflicts with existing task time slot');
    //   }

    // }
    try {
      const updCal = await this.calendarModel.findByIdAndUpdate(calendar._id, { $addToSet: { tasks: taskId } }, { new: true });
      return await updCal.populate("tasks");
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException("Error adding task to calendar");
    }
  }

  async addEvent(userId: mongoose.Types.ObjectId, eventID: mongoose.Types.ObjectId): Promise<Calendar> {
    const calendar = await this.calendarModel.findOne({ user: userId });
    if (!calendar) {
      throw new NotFoundException("Calendar not found");
    }
    if (!calendar.user.equals(userId)) {
      throw new ForbiddenException("Forbidden access");
    }
    const event = await this.eventsService.findOne(eventID, userId);
    if (!event) {
      throw new NotFoundException("Event not found");
    }
    try {
      const updCal = await this.calendarModel.findByIdAndUpdate(calendar._id, { $addToSet: { events: eventID } }, { new: true });
      return await updCal.populate("events");
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException("Error adding event to calendar");
    }
  }

  async addReminder(userId: mongoose.Types.ObjectId, reminderID: mongoose.Types.ObjectId): Promise<Calendar> {
    const calendar = await this.calendarModel.findOne({ user: userId });
    if (!calendar) {
      throw new NotFoundException("Calendar not found");
    }
    if (!calendar.user.equals(userId)) {
      throw new ForbiddenException("Forbidden access");
    }
    const reminder = await this.remindersService.findOne(reminderID, userId);
    if (!reminder) {
      throw new NotFoundException("Reminder not found");
    }
    try {
      const updCal = await this.calendarModel.findByIdAndUpdate(calendar._id, { $addToSet: { reminders
        : reminderID } }, { new: true });
      return await updCal.populate("tasks");
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException("Error adding reminder to calendar");
    }
  }

  async removeTask(userId: mongoose.Types.ObjectId, taskId: mongoose.Types.ObjectId): Promise<Calendar> {
    const calendar = await this.calendarModel.findOne({ user: userId });
    if (!calendar) {
      throw new NotFoundException("Calendar not found");
    }
    if (!calendar.user.equals(userId)) {
      throw new ForbiddenException("Forbidden access");
    }
    try {
      const updCal = await this.calendarModel.findByIdAndUpdate(calendar._id, { $pull: { tasks: taskId } }, { new: true });
      return await updCal.populate("tasks");
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException("Error deleting task to calendar");
    }
  }

  async removeEvent(userId: mongoose.Types.ObjectId, eventID: mongoose.Types.ObjectId): Promise<Calendar> {
    const calendar = await this.calendarModel.findOne({ user: userId });
    if (!calendar) {
      throw new NotFoundException("Calendar not found");
    }
    if (!calendar.user.equals(userId)) {
      throw new ForbiddenException("Forbidden access");
    }
    try {
      const updCal = await this.calendarModel.findByIdAndUpdate(calendar._id, { $pull: { events: eventID } }, { new: true });
      return await updCal.populate("tasks");
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException("Error deleting event to calendar");
    }
  }

  async removeReminder(userId: mongoose.Types.ObjectId, reminderID: mongoose.Types.ObjectId): Promise<Calendar> {
    const calendar = await this.calendarModel.findOne({ user: userId });
    if (!calendar) {
      throw new NotFoundException("Calendar not found");
    }
    if (!calendar.user.equals(userId)) {
      throw new ForbiddenException("Forbidden access");
    }
    try {
      const updCal = await this.calendarModel.findByIdAndUpdate(calendar._id, { $pull: { reminders: reminderID } }, { new: true });
      return await updCal.populate("tasks");
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException("Error deleting reminder to calendar");
    }
  }

  async findTasks(userId: mongoose.Types.ObjectId): Promise<Calendar> {
    return await this.calendarModel.findOne({ user: userId }).populate("tasks");
  }

  async findEvents(userId: mongoose.Types.ObjectId): Promise<Calendar> {
    return await this.calendarModel.findOne({ user: userId }).populate("events");
  }

  async findReminders(userId: mongoose.Types.ObjectId): Promise<Calendar> {
    return await this.calendarModel.findOne({ user: userId }).populate("reminders");
  } 

  async findTaskByDate(userId: mongoose.Types.ObjectId, date: Date){
    try {
      const calendar = await this.calendarModel.findOne({ user: userId }).populate("tasks");
      const start = new Date(date);
      //start.setHours(0, 0, 0, 0);// Set to beginning of day
      const end = new Date(date);
      end.setHours(24, 59, 59, 999);
      const tasks = calendar.tasks.filter((task) => {
        const taskDate = new Date(task["dueDate"]);
        return taskDate >= start && taskDate <= end;
      });
     
      // Sort tasks by start date
      tasks.sort((a, b) => {
        const dateA = new Date(a["startDate"]);
        const dateB = new Date(b["startDate"]);
        return dateA.getTime() - dateB.getTime();
      });

      return tasks;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.log(error);
      throw new InternalServerErrorException("Error finding tasks by date");
    }
  }


  async findByDate(userId: mongoose.Types.ObjectId, date: Date){
    try {
      const calendar = await this.calendarModel.findOne({ user: userId }).populate("tasks").populate("events");
      const start = new Date(date);
      //start.setHours(0, 0, 0, 0);// Set to beginning of day
      const end = new Date(date);
      end.setHours(24, 59, 59, 999);
      const tasks = calendar.tasks.filter((task) => {
        const taskDate = new Date(task["dueDate"]);
        return taskDate >= start && taskDate <= end;
      });
     
      // Sort tasks by start date
      tasks.sort((a, b) => {
        const dateA = new Date(a["startDate"]);
        const dateB = new Date(b["startDate"]);
        return dateA.getTime() - dateB.getTime();
      });

      const events = calendar.events.filter((event) => {
        const eventDate = new Date(event["startDate"]);
        return eventDate >= start && eventDate <= end;
      });
      // Sort events by start date
      events.sort((a, b) => {
        const dateA = new Date(a["startDate"]);
        const dateB = new Date(b["startDate"]);
        return dateA.getTime() - dateB.getTime();
      });

      return { tasks, events };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.log(error);
      throw new InternalServerErrorException("Error finding tasks by date");
    }
  }

  async findRange(userId: mongoose.Types.ObjectId, startDate: Date, endDate: Date){
    try {
      const calendar = await this.calendarModel.findOne({ user: userId }).populate("tasks").populate("events");
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0); // Set to beginning of day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Set to end of day
      //console.log(start, end);
      const tasks = calendar.tasks.filter((task) => {
        const taskDate = new Date(task["dueDate"]);
        return taskDate >= start && taskDate <= end;
      });
      tasks.sort((a, b) => {
        const dateA = new Date(a["startDate"]);
        const dateB = new Date(b["startDate"]);
        return dateA.getTime() - dateB.getTime();
      });

      const events = calendar.events.filter((event) => {
        const eventDate = new Date(event["startDate"]);
        return eventDate >= start && eventDate <= end;
      });
      events.sort((a, b) => {
        const dateA = new Date(a["startDate"]);
        const dateB = new Date(b["startDate"]);
        return dateA.getTime() - dateB.getTime();
      });
      
      return { tasks, events };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.log(error);
      throw new InternalServerErrorException("Error finding tasks by date range");
    }
  }

  async findToday(userId: mongoose.Types.ObjectId){
    const format_date = new Date();    
    return this.findByDate(userId, format_date);
  }

  async findWeek(userId: mongoose.Types.ObjectId){
    const format_date = new Date();
    const start = format_date.setDate(format_date.getDate() - format_date.getDay());
    const end = format_date.setDate(format_date.getDate() + 6);
    return this.findRange(userId, new Date(start), new Date(end));
  }

  async findMonth(userId: mongoose.Types.ObjectId){
    const format_date = new Date();
    const start = format_date.setDate(1);
    const end = format_date.setMonth(format_date.getMonth() + 1);
    return this.findRange(userId, new Date(start), new Date(end));
  }

  async findYear(userId: mongoose.Types.ObjectId){
    const format_date = new Date();
    const start = format_date.setMonth(0);
    const end = format_date.setFullYear(format_date.getFullYear() + 1);
    return this.findRange(userId, new Date(start), new Date(end));
  }

  async findNextWeek(userId: mongoose.Types.ObjectId){
    const format_date = new Date();
    const start = format_date.setDate(format_date.getDate() + 7 - format_date.getDay());
    const end = format_date.setDate(format_date.getDate() + 6);
    return this.findRange(userId, new Date(start), new Date(end));
  }

  async findNextMonth(userId: mongoose.Types.ObjectId){
    const format_date = new Date();
    const start = format_date.setMonth(format_date.getMonth() + 1);
    const end = format_date.setMonth(format_date.getMonth() + 1);
    return this.findRange(userId, new Date(start), new Date(end));
  }

  async findNextYear(userId: mongoose.Types.ObjectId){
    const format_date = new Date();
    const start = format_date.setFullYear(format_date.getFullYear() + 1);
    const end = format_date.setFullYear(format_date.getFullYear() + 1);
    return this.findRange(userId, new Date(start), new Date(end));
  }


  // async findRemindersDate(userId: mongoose.Types.ObjectId, date: Date){
  //   const start = date.setHours(0, 0, 0, 0);
  //   const end = date.setHours(23, 59, 59, 999);
  //   const calendar = await this.calendarModel.aggregate([
  //     {
  //       $match: { user: userId },
  //     },
  //     {
  //       $project: {
  //         reminders: { $filter: { input: "$reminders", as: "reminder", cond: { $and: [{ $gte: ["$$reminder.dueDate", start] }, { $lte: ["$$reminder.dueDate", end] }] } } },
  //       },
  //     },
  //   ]);
  //   return calendar;
  // }
  // async findTasksRange(userId: mongoose.Types.ObjectId, startDate: Date, endDate: Date){
  //   const start = startDate.setHours(0, 0, 0, 0);
  //   const end = endDate.setHours(23, 59, 59, 999);
  //   const calendar = await this.calendarModel.aggregate([
  //     {
  //       $match: { user: userId },
  //     },
  //     {
  //       $project: {
  //         tasks: { $filter: { input: "$tasks", as: "task", cond: { $and: [{ $gte: ["$$task.dueDate", start] }, { $lte: ["$$task.dueDate", end] }] } } },
  //       },
  //     },
  //   ]);
  //   return calendar;
  // }
  // async findEventsRange(userId: mongoose.Types.ObjectId, startDate: Date, endDate: Date){
  //   const start = startDate.setHours(0, 0, 0, 0);
  //   const end = endDate.setHours(23, 59, 59, 999);
  //   const calendar = await this.calendarModel.aggregate([
  //     {
  //       $match: { user: userId },
  //     },
  //     {
  //       $project: {
  //         events: { $filter: { input: "$events", as: "event", cond: { $and: [{ $gte: ["$$event.dueDate", start] }, { $lte: ["$$event.dueDate", end] }] } } },
  //       },
  //     },
  //   ]);
  //   return calendar;
  // }
  // async findRemindersRange(userId: mongoose.Types.ObjectId, startDate: Date, endDate: Date){
  //   const start = startDate.setHours(0, 0, 0, 0);
  //   const end = endDate.setHours(23, 59, 59, 999);
  //   const calendar = await this.calendarModel.aggregate([
  //     {
  //       $match: { user: userId },
  //     },
  //     {
  //       $project: {
  //         reminders: { $filter: { input: "$reminders", as: "reminder", cond: { $and: [{ $gte: ["$$reminder.dueDate", start] }, { $lte: ["$$reminder.dueDate", end] }] } } },
  //       },
  //     },
  //   ]);
  //   return calendar;
  // }

  async findPriority(userId: mongoose.Types.ObjectId, priority: string){
    const calendar = await this.calendarModel.aggregate([
      {
        $match: { user: userId },
      },
      {
        $project: {
          tasks: { $filter: { input: "$tasks", as: "task", cond: { $eq: ["$$task.priority", priority] } } },
          events: { $filter: { input: "$events", as: "event", cond: { $eq: ["$$event.priority", priority] } } },
          reminders: { $filter: { input: "$reminders", as: "reminder", cond: { $eq: ["$$reminder.priority", priority] } } },
        },
      },
      ]);
    return calendar;
  }
  async findStatus(userId: mongoose.Types.ObjectId, status: string){
    const calendar = await this.calendarModel.aggregate([
      {
        $match: { user: userId },
      },
      {
        $project: {
          tasks: { $filter: { input: "$tasks", as: "task", cond: { $eq: ["$$task.status", status] } } },
          events: { $filter: { input: "$events", as: "event", cond: { $eq: ["$$event.status", status] } } },
          reminders: { $filter: { input: "$reminders", as: "reminder", cond: { $eq: ["$$reminder.status", status] } } },
        },
      },
      ]);
    return calendar;
  }

  async findCategory(userId: mongoose.Types.ObjectId, category: string){
    const calendar = await this.calendarModel.aggregate([
      {
        $match: { user: userId },
      },
      {
        $project: {
          tasks: { $filter: { input: "$tasks", as: "task", cond: { $eq: ["$$task.category", category] } } },
          events: { $filter: { input: "$events", as: "event", cond: { $eq: ["$$event.category", category] } } },
          reminders: { $filter: { input: "$reminders", as: "reminder", cond: { $eq: ["$$reminder.category", category] } } },
        },
      },
      ]);
    return calendar;
  }

  async findAllCategories(userId: mongoose.Types.ObjectId): Promise<string[]> {
    try {
      this.logger.log(`Finding all categories for user: ${userId}`);
      
      // First get the calendar with populated tasks
      const calendar = await this.calendarModel.findOne({ user: userId }).populate('tasks');
      
      if (!calendar) {
        return [];
      }

      // Extract unique categories from tasks
      const categories = new Set(
        calendar.tasks
          .map(task => task['category'])
          .filter(category => category != null && category !== '')
      );

      return Array.from(categories);
    } catch (error) {
      this.logger.error(`Error finding all categories: ${error.message}`);
      throw new InternalServerErrorException("Error finding all categories");
    }
  }


  
  // async getTasks(
  //   userId: string,
  //   startDate?: string,
  //   endDate?: string,
  //   status?: string,
  // ) {
  //   const calendar = await this.calendarModel
  //     .findOne({ user: userId })
  //     .populate({
  //       path: "tasks",
  //       select: "date status",
  //     });

  //   if (!calendar) {
  //     throw new NotFoundException("Calendar not found");
  //   }

  //   return calendar.tasks.filter((task) => {
  //     const taskDate = new Date(task["date"]); // Accede como objeto
  //     return (
  //       (!startDate || taskDate >= new Date(startDate)) &&
  //       (!endDate || taskDate <= new Date(endDate)) &&
  //       (!status || task["status"] === status)
  //     );
  //   });
  // }

  // async getEvents(
  //   userId: string,
  //   startDate?: string,
  //   endDate?: string,
  //   category?: string,
  // ) {
  //   const calendar = await this.calendarModel
  //     .findOne({ user: userId })
  //     .populate({
  //       path: "events",
  //       select: "date category",
  //     });

  //   if (!calendar) {
  //     throw new NotFoundException("Calendar not found");
  //   }

  //   return calendar.events.filter((event) => {
  //     const eventDate = new Date(event["date"]); // Accede como objeto
  //     return (
  //       (!startDate || eventDate >= new Date(startDate)) &&
  //       (!endDate || eventDate <= new Date(endDate)) &&
  //       (!category || event["category"] === category)
  //     );
  //   });
  // }

  // async getReminders(
  //   userId: string,
  //   startDate?: string,
  //   endDate?: string,
  //   priority?: string,
  // ) {
  //   const calendar = await this.calendarModel
  //     .findOne({ user: userId })
  //     .populate({
  //       path: "reminders",
  //       select: "date priority",
  //     });

  //   if (!calendar) {
  //     throw new NotFoundException("Calendar not found");
  //   }

  //   return calendar.reminders.filter((reminder) => {
  //     const reminderDate = new Date(reminder["date"]); // Accede como objeto
  //     return (
  //       (!startDate || reminderDate >= new Date(startDate)) &&
  //       (!endDate || reminderDate <= new Date(endDate)) &&
  //       (!priority || reminder["priority"] === priority)
  //     );
  //   });
  // }
}