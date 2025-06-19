import { Controller, Get, Post, Query, Patch, UseGuards, Param, UsePipes, ValidationPipe } from "@nestjs/common";
import { CalendarService } from "./calendar.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from "@nestjs/swagger";
import { GetUser } from "../users/decorators/get-user.decorator";
import { User } from "../users/entities/user.entity";
import mongoose from "mongoose";
import { ParseDatePipe } from "src/common/pipes/parse-date.pipe";
import { ParseMongoIdPipe } from "src/common/pipes/parse-mongo-id.pipe";
import { Calendar, CalendarDocument } from "./entities/calendar.entity";

@ApiTags("Calendar")
@Controller("calendar")
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true}))
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  // @Post()
  // @ApiOperation({ summary: "Create a new Calendar" })
  // @ApiResponse({ status: 201, description: "Calendar successfully created" })
  // @ApiResponse({ status: 400, description: "Invalid request" })
  // async createCalendar(@GetUser() user: User): Promise<CalendarDocument>{
  //   return this.calendarService.createCalendar(user.id);
  // }

  @Get()
  @ApiOperation({ summary: "Retrieve the user's calendar" })
  @ApiResponse({ status: 200, description: "Calendar retrieved" })
  @ApiResponse({ status: 404, description: "Calendar not found" })
  @ApiResponse({ status: 401, description: "Unauthorized access" })
  async getCalendar(@GetUser() user: User): Promise<CalendarDocument> {
    return this.calendarService.getCalendar(user.id);
  }

  @Patch('addTask/:taskId')
  @ApiOperation({ summary: 'Add a task to a calendar' })
  @ApiResponse({ status: 200, description: "Calendar successfully updated" })
  @ApiResponse({ status: 400, description: "Invalid request" })
  @ApiResponse({ status: 404, description: "Calendar not found" })
  @ApiResponse({ status: 401, description: "Unauthorized access" })
  async addTask(@GetUser() user: User, @Param('taskId', ParseMongoIdPipe) taskId: mongoose.Types.ObjectId): Promise<CalendarDocument> {
    return this.calendarService.addTask(user.id, taskId);
  }

  @Patch('addEvent/:eventId')
  @ApiOperation({ summary: 'Add a Event to a calendar' })
  @ApiResponse({ status: 200, description: "Calendar successfully updated" })
  @ApiResponse({ status: 400, description: "Invalid request" })
  @ApiResponse({ status: 404, description: "Calendar not found" })
  @ApiResponse({ status: 401, description: "Unauthorized access" })
  async addEvent( @GetUser() user: User, @Param('eventId', ParseMongoIdPipe) eventId: mongoose.Types.ObjectId): Promise<CalendarDocument> {
    return this.calendarService.addEvent(user.id, eventId);
  }

  @Patch('addReminder/:reminderId')
  @ApiOperation({ summary: 'Add a Event to a calendar' })
  @ApiResponse({ status: 200, description: "Calendar successfully updated" })
  @ApiResponse({ status: 400, description: "Invalid request" })
  @ApiResponse({ status: 404, description: "Calendar not found" })
  @ApiResponse({ status: 401, description: "Unauthorized access" })
  async addReminder(
     @GetUser() user: User, @Param('reminderId', ParseMongoIdPipe) reminderId: mongoose.Types.ObjectId): Promise<CalendarDocument> {
    return this.calendarService.addReminder(user.id, reminderId);
  }

  @Patch('removeTask/:taskId')
  @ApiOperation({ summary: 'Remove a task from a calendar' })
  @ApiResponse({ status: 200, description: "Calendar successfully updated" })
  @ApiResponse({ status: 400, description: "Invalid request" })
  @ApiResponse({ status: 404, description: "Calendar not found" })
  @ApiResponse({ status: 401, description: "Unauthorized access" })
  async removeTask(@GetUser() user: User, @Param('taskId', ParseMongoIdPipe) taskId: mongoose.Types.ObjectId): Promise<CalendarDocument> {
    return this.calendarService.removeTask( user.id, taskId);
  }

  @Patch('removeEvent/:eventId')
  @ApiOperation({ summary: 'Remove a Event from a calendar' })
  @ApiResponse({ status: 200, description: "Calendar successfully updated" })
  @ApiResponse({ status: 400, description: "Invalid request" })
  @ApiResponse({ status: 404, description: "Calendar not found" })
  @ApiResponse({ status: 401, description: "Unauthorized access" })
  async removeEvent(@GetUser() user: User, @Param('eventId', ParseMongoIdPipe) eventId: mongoose.Types.ObjectId): Promise<CalendarDocument> {
    return this.calendarService.removeEvent(user.id, eventId);
  }

  @Patch('removeReminder/:reminderId')
  @ApiOperation({ summary: 'Remove a Reminder from a calendar' })
  @ApiResponse({ status: 200, description: "Calendar successfully updated" })
  @ApiResponse({ status: 400, description: "Invalid request" })
  @ApiResponse({ status: 404, description: "Calendar not found" })
  @ApiResponse({ status: 401, description: "Unauthorized access" })
  async removeReminder(@GetUser() user: User, @Param('reminderId', ParseMongoIdPipe) reminderId: mongoose.Types.ObjectId): Promise<CalendarDocument> {
    return this.calendarService.removeReminder(user.id, reminderId);
  }

  // @Get(':id')
  // @ApiOperation({ summary: 'Retrieve a calendar by id' })
  // @ApiResponse({ status: 200, description: 'Calendar retrieved' })
  // @ApiResponse({ status: 401, description: 'Unauthorized access' })
  // @ApiResponse({ status: 404, description: 'Calendar not found' })
  // async findOne(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @GetUser() user: User) {
  //   return this.calendarService.findOne(id, user.id);
  // }

  @Get('tasks')
  @ApiOperation({ summary: 'Retrieve all tasks from a calendar' })
  @ApiResponse({ status: 200, description: 'Tasks retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Calendar not found' })
  async findTasks(@GetUser() user: User): Promise<CalendarDocument> {
    return this.calendarService.findTasks(user.id);
  }

  @Get('events')
  @ApiOperation({ summary: 'Retrieve all events from a calendar' })
  @ApiResponse({ status: 200, description: 'Events retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Calendar not found' })
  async findEvents( @GetUser() user: User): Promise<CalendarDocument> {
    return this.calendarService.findEvents(user.id);
  }

  @Get('reminders')
  @ApiOperation({ summary: 'Retrieve all reminders from a calendar' })
  @ApiResponse({ status: 200, description: 'Reminders retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Calendar not found' })
  async findReminders( @GetUser() user: User): Promise<CalendarDocument> {
    return this.calendarService.findReminders(user.id);
  }

  @Get('today')
  @ApiOperation({ summary: 'Retrieve all tasks, events and reminders from today' })
  @ApiResponse({ status: 200, description: 'Tasks, events and reminders retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Calendar not found' })
  async findToday( @GetUser() user: User){
    return this.calendarService.findToday( user.id);
  }

  @Get('week')
  @ApiOperation({ summary: 'Retrieve all tasks, events and reminders from this week' })
  @ApiResponse({ status: 200, description: 'Tasks, events and reminders retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Calendar not found' })
  async findWeek(@GetUser() user: User) {
    return this.calendarService.findWeek(user.id);
  }

  @Get('month')
  @ApiOperation({ summary: 'Retrieve all tasks, events and reminders from this month' })
  @ApiResponse({ status: 200, description: 'Tasks, events and reminders retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Calendar not found' })
  async findMonth( @GetUser() user: User) {
    return this.calendarService.findMonth(user.id);
  }

  @Get('year')
  @ApiOperation({ summary: 'Retrieve all tasks, events and reminders from this year' })
  @ApiResponse({ status: 200, description: 'Tasks, events and reminders retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Calendar not found' })
  async findYear(@GetUser() user: User) {
    return this.calendarService.findYear(user.id);
  }

  @Get('nextWeek')
  @ApiOperation({ summary: 'Retrieve all tasks, events and reminders from next week' })
  @ApiResponse({ status: 200, description: 'Tasks, events and reminders retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Calendar not found' })
  async findNextWeek(@GetUser() user: User) {
    return this.calendarService.findNextWeek( user.id);
  }

  @Get('nextMonth')
  @ApiOperation({ summary: 'Retrieve all tasks, events and reminders from next month' })
  @ApiResponse({ status: 200, description: 'Tasks, events and reminders retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Calendar not found' })
  async findNextMonth( @GetUser() user: User) {
    return this.calendarService.findNextMonth( user.id);
  }

  @Get('all-categories')
  @ApiOperation({ summary: 'Retrieve all categories from a calendar' })
  @ApiResponse({ status: 200, description: 'Categories retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Calendar not found' })
  async findCategories( @GetUser() user: User) {
    return this.calendarService.findAllCategories( user.id);
  }

  @Get(':date')
  @ApiOperation({ summary: 'Retrieve all tasks, events and reminders from a specific date' })
  @ApiResponse({ status: 200, description: 'Tasks, events and reminders retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Calendar not found' })
  async findDate(@Param('date', ParseDatePipe) date: Date, @GetUser() user: User) {
    //console.log('date', date);
    return this.calendarService.findByDate( user.id, date);
  }

  @Get(':startDate/:endDate')
  @ApiOperation({ summary: 'Retrieve all tasks, events and reminders from a date range' })
  @ApiResponse({ status: 200, description: 'Tasks, events and reminders retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Calendar not found' })
  async findRange(@Param('startDate', ParseDatePipe) startDate: Date, @Param('endDate', ParseDatePipe) endDate: Date, @GetUser() user: User) {
    return this.calendarService.findRange( user.id, startDate, endDate);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Retrieve all tasks, events and reminders from a specific category' })
  @ApiResponse({ status: 200, description: 'Tasks, events and reminders retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Calendar not found' })
  async findCategory( @Param('category') category: string, @GetUser() user: User) {
    return this.calendarService.findCategory( user.id, category);
  }

  @Get('priority/:priority')
  @ApiOperation({ summary: 'Retrieve all tasks, events and reminders from a specific priority' })
  @ApiResponse({ status: 200, description: 'Tasks, events and reminders retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Calendar not found' })
  async findPriority( @Param('priority') priority: string, @GetUser() user: User) {
    return this.calendarService.findPriority( user.id, priority);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Retrieve all tasks, events and reminders from a specific status' })
  @ApiResponse({ status: 200, description: 'Tasks, events and reminders retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Calendar not found' })
  async findStatus( @Param('status') status: string, @GetUser() user: User) {
    return this.calendarService.findStatus( user.id, status);
  }

  // @Get(':startDate/tasks')
  // @ApiOperation({ summary: 'Retrieve all tasks from a date range' })
  // @ApiResponse({ status: 200, description: 'Tasks retrieved' })
  // @ApiResponse({ status: 401, description: 'Unauthorized access' })
  // @ApiResponse({ status: 404, description: 'Calendar not found' })
  // async findTasksDate( @Param('startDate', ParseDatePipe) startDate: Date, @GetUser() user: User) {
  //   return this.calendarService.findTasksDate(user.id, startDate);
  // }

  // @Get(':startDate/events')
  // @ApiOperation({ summary: 'Retrieve all events from a date range' })
  // @ApiResponse({ status: 200, description: 'Events retrieved' })
  // @ApiResponse({ status: 401, description: 'Unauthorized access' })
  // @ApiResponse({ status: 404, description: 'Calendar not found' })
  // async findEventsDate( @Param('startDate', ParseDatePipe) startDate: Date, @GetUser() user: User) {
  //   return this.calendarService.findEventsDate( user.id, startDate);
  // }

  // @Get(':startDate/reminders')
  // @ApiOperation({ summary: 'Retrieve all reminders from a date range' })
  // @ApiResponse({ status: 200, description: 'Reminders retrieved' })
  // @ApiResponse({ status: 401, description: 'Unauthorized access' })
  // @ApiResponse({ status: 404, description: 'Calendar not found' })
  // async findRemindersDate(@Param('startDate', ParseDatePipe) startDate: Date, @GetUser() user: User) {
  //   return this.calendarService.findRemindersDate( user.id, startDate);
  // }

  // @Get(':startDate/:endDate/tasks')
  // @ApiOperation({ summary: 'Retrieve all tasks from a date range' })
  // @ApiResponse({ status: 200, description: 'Tasks retrieved' })
  // @ApiResponse({ status: 401, description: 'Unauthorized access' })
  // @ApiResponse({ status: 404, description: 'Calendar not found' })
  // async findTasksRange( @Param('startDate', ParseDatePipe) startDate: Date, @Param('endDate', ParseDatePipe) endDate: Date, @GetUser() user: User) {
  //   return this.calendarService.findTasksRange(user.id, startDate, endDate);
  // }

  // @Get(':startDate/:endDate/events')
  // @ApiOperation({ summary: 'Retrieve all events from a date range' })
  // @ApiResponse({ status: 200, description: 'Events retrieved' })
  // @ApiResponse({ status: 401, description: 'Unauthorized access' })
  // @ApiResponse({ status: 404, description: 'Calendar not found' })
  // async findEventsRange( @Param('startDate', ParseDatePipe) startDate: Date, @Param('endDate', ParseDatePipe) endDate: Date, @GetUser() user: User) {
  //   return this.calendarService.findEventsRange( user.id, startDate, endDate);
  // }

  // @Get(':startDate/:endDate/reminders')
  // @ApiOperation({ summary: 'Retrieve all reminders from a date range' })
  // @ApiResponse({ status: 200, description: 'Reminders retrieved' })
  // @ApiResponse({ status: 401, description: 'Unauthorized access' })
  // @ApiResponse({ status: 404, description: 'Calendar not found' })
  // async findRemindersRange(@Param('startDate', ParseDatePipe) startDate: Date, @Param('endDate', ParseDatePipe) endDate: Date, @GetUser() user: User) {
  //   return this.calendarService.findRemindersRange( user.id, startDate, endDate);
  // }






  // @Get("tasks")
  // @ApiOperation({ summary: "Get tasks by filters" })
  // @ApiQuery({
  //   name: "startDate",
  //   required: false,
  //   example: "2025-02-24T00:00:00Z",
  // })
  // @ApiQuery({
  //   name: "endDate",
  //   required: false,
  //   example: "2025-02-28T23:59:59Z",
  // })
  // @ApiQuery({ name: "status", required: false, example: "completed | pending" })
  // async getTasks(
  //   @GetUser() user: User,
  //   @Query("startDate") startDate?: string,
  //   @Query("endDate") endDate?: string,
  //   @Query("status") status?: string,
  // ) {
  //   return this.calendarService.getTasks(user.id, startDate, endDate, status);
  // }

  // @Get("events")
  // @ApiOperation({ summary: "Get events by filters" })
  // @ApiQuery({
  //   name: "startDate",
  //   required: false,
  //   example: "2025-02-24T00:00:00Z",
  // })
  // @ApiQuery({
  //   name: "endDate",
  //   required: false,
  //   example: "2025-02-28T23:59:59Z",
  // })
  // @ApiQuery({
  //   name: "category",
  //   required: false,
  //   example: "meeting | study | personal",
  // })
  // async getEvents(
  //   @GetUser() user: User,
  //   @Query("startDate") startDate?: string,
  //   @Query("endDate") endDate?: string,
  //   @Query("category") category?: string,
  // ) {
  //   return this.calendarService.getEvents(
  //     user.id,
  //     startDate,
  //     endDate,
  //     category,
  //   );
  // }

  // @Get("reminders")
  // @ApiOperation({ summary: "Get reminders by filters" })
  // @ApiQuery({
  //   name: "startDate",
  //   required: false,
  //   example: "2025-02-24T00:00:00Z",
  // })
  // @ApiQuery({
  //   name: "endDate",
  //   required: false,
  //   example: "2025-02-28T23:59:59Z",
  // })
  // @ApiQuery({
  //   name: "priority",
  //   required: false,
  //   example: "high | medium | low",
  // })
  // async getReminders(
  //   @GetUser() user: User,
  //   @Query("startDate") startDate?: string,
  //   @Query("endDate") endDate?: string,
  //   @Query("priority") priority?: string,
  // ) {
  //   return this.calendarService.getReminders(
  //     user.id,
  //     startDate,
  //     endDate,
  //     priority,
  //   );
  // }
}