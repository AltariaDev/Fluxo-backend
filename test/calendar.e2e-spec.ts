import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/users/entities/user.entity';
import { Calendar } from '../src/calendar/entities/calendar.entity';
import { Task, TaskStatus } from '../src/tasks/entities/task.entity';
import { EventsCalendar } from '../src/events-calendar/entities/events-calendar.entity';
import { Reminders } from '../src/reminders/entities/reminders.entity';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import mongoose from 'mongoose';
import { EmailService } from '../src/email/email.service';

describe('CalendarController (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<User>;
  let calendarModel: Model<Calendar>;
  let taskModel: Model<Task>;
  let eventModel: Model<EventsCalendar>;
  let reminderModel: Model<Reminders>;
  let jwtService: JwtService;
  let authToken: string;
  let testUserId: mongoose.Types.ObjectId;
  let testCalendarId: mongoose.Types.ObjectId;
  let testTaskId: mongoose.Types.ObjectId;
  let testEventId: mongoose.Types.ObjectId;
  let testReminderId: mongoose.Types.ObjectId;

  const testUser = {
    email: 'calendar-test@example.com',
    username: 'calendaruser',
    fullname: 'Calendar Test User',
    password: 'password123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
    calendarModel = moduleFixture.get<Model<Calendar>>(getModelToken(Calendar.name));
    taskModel = moduleFixture.get<Model<Task>>(getModelToken(Task.name));
    eventModel = moduleFixture.get<Model<EventsCalendar>>(getModelToken(EventsCalendar.name));
    reminderModel = moduleFixture.get<Model<Reminders>>(getModelToken(Reminders.name));
    jwtService = moduleFixture.get<JwtService>(JwtService);
    const emailService = moduleFixture.get<EmailService>(EmailService);
    jest.spyOn(emailService, 'sendWelcomeEmail').mockResolvedValue(undefined);
    jest.spyOn(emailService, 'sendPasswordResetCode').mockResolvedValue(undefined);
    // Create test user
    const userResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    testUserId = userResponse.body._id;
    authToken = jwtService.sign({ sub: testUserId });
  });

  afterAll(async () => {
    await calendarModel.deleteMany({ userId: testUserId });
    await taskModel.deleteMany({ userId: testUserId });
    await eventModel.deleteMany({ userId: testUserId });
    await reminderModel.deleteMany({ userId: testUserId });
    await userModel.deleteOne({ _id: testUserId });
    await app.close();
  });

  beforeEach(async () => {
    // Clean calendar data between tests
    await calendarModel.deleteMany({ userId: testUserId });
    await taskModel.deleteMany({ userId: testUserId });
    await eventModel.deleteMany({ userId: testUserId });
    await reminderModel.deleteMany({ userId: testUserId });
  });

  describe('GET /calendar', () => {
    it('should get user calendar', () => {
      return request(app.getHttpServer())
        .get('/calendar')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.userId).toBe(testUserId.toString());
          testCalendarId = res.body._id;
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/calendar')
        .expect(401);
    });

    it('should create calendar if it does not exist', () => {
      return request(app.getHttpServer())
        .get('/calendar')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body).toHaveProperty('tasks');
          expect(res.body).toHaveProperty('events');
          expect(res.body).toHaveProperty('reminders');
          expect(Array.isArray(res.body.tasks)).toBe(true);
          expect(Array.isArray(res.body.events)).toBe(true);
          expect(Array.isArray(res.body.reminders)).toBe(true);
        });
    });
  });

  describe('PATCH /calendar/addTask/:taskId', () => {
    beforeEach(async () => {
      // Create test task
      const taskResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Calendar Task',
          status: TaskStatus.PENDING,
          dueDate: new Date().toISOString(),
        });
      testTaskId = taskResponse.body._id;

      // Get calendar
      const calendarResponse = await request(app.getHttpServer())
        .get('/calendar')
        .set('Authorization', `Bearer ${authToken}`);
      testCalendarId = calendarResponse.body._id;
    });

    it('should add task to calendar', () => {
      return request(app.getHttpServer())
        .patch(`/calendar/addTask/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.tasks).toContain(testTaskId);
        });
    });

    it('should fail with invalid task ID', () => {
      return request(app.getHttpServer())
        .patch('/calendar/addTask/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should fail with non-existent task ID', () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      return request(app.getHttpServer())
        .patch(`/calendar/addTask/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /calendar/addEvent/:eventId', () => {
    beforeEach(async () => {
      // Create test event
      const eventResponse = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Calendar Event',
          description: 'Test event for calendar',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 3600000).toISOString(), // 1 hour later
        });
      testEventId = eventResponse.body._id;
    });

    it('should add event to calendar', () => {
      return request(app.getHttpServer())
        .patch(`/calendar/addEvent/${testEventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.events).toContain(testEventId);
        });
    });

    it('should fail with invalid event ID', () => {
      return request(app.getHttpServer())
        .patch('/calendar/addEvent/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('PATCH /calendar/addReminder/:reminderId', () => {
    beforeEach(async () => {
      // Create test reminder
      const reminderResponse = await request(app.getHttpServer())
        .post('/reminders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Calendar Reminder',
          description: 'Test reminder for calendar',
          reminderDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        });
      testReminderId = reminderResponse.body._id;
    });

    it('should add reminder to calendar', () => {
      return request(app.getHttpServer())
        .patch(`/calendar/addReminder/${testReminderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.reminders).toContain(testReminderId);
        });
    });

    it('should fail with invalid reminder ID', () => {
      return request(app.getHttpServer())
        .patch('/calendar/addReminder/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('PATCH /calendar/removeTask/:taskId', () => {
    beforeEach(async () => {
      // Create and add task to calendar
      const taskResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Remove Task',
          status: TaskStatus.PENDING,
        });
      testTaskId = taskResponse.body._id;

      await request(app.getHttpServer())
        .patch(`/calendar/addTask/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should remove task from calendar', () => {
      return request(app.getHttpServer())
        .patch(`/calendar/removeTask/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.tasks).not.toContain(testTaskId);
        });
    });

    it('should fail with non-existent task', () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      return request(app.getHttpServer())
        .patch(`/calendar/removeTask/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /calendar/removeEvent/:eventId', () => {
    beforeEach(async () => {
      // Create and add event to calendar
      const eventResponse = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Remove Event',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 3600000).toISOString(),
        });
      testEventId = eventResponse.body._id;

      await request(app.getHttpServer())
        .patch(`/calendar/addEvent/${testEventId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should remove event from calendar', () => {
      return request(app.getHttpServer())
        .patch(`/calendar/removeEvent/${testEventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.events).not.toContain(testEventId);
        });
    });
  });

  describe('PATCH /calendar/removeReminder/:reminderId', () => {
    beforeEach(async () => {
      // Create and add reminder to calendar
      const reminderResponse = await request(app.getHttpServer())
        .post('/reminders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Remove Reminder',
          reminderDate: new Date().toISOString(),
        });
      testReminderId = reminderResponse.body._id;

      await request(app.getHttpServer())
        .patch(`/calendar/addReminder/${testReminderId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should remove reminder from calendar', () => {
      return request(app.getHttpServer())
        .patch(`/calendar/removeReminder/${testReminderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.reminders).not.toContain(testReminderId);
        });
    });
  });

  describe('GET /calendar/tasks', () => {
    beforeEach(async () => {
      // Create and add tasks to calendar
      const task1Response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Calendar Task 1',
          status: TaskStatus.PENDING,
        });

      const task2Response = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Calendar Task 2',
          status: TaskStatus.COMPLETED,
        });

      await request(app.getHttpServer())
        .patch(`/calendar/addTask/${task1Response.body._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      await request(app.getHttpServer())
        .patch(`/calendar/addTask/${task2Response.body._id}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should get all tasks from calendar', () => {
      return request(app.getHttpServer())
        .get('/calendar/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('tasks');
          expect(Array.isArray(res.body.tasks)).toBe(true);
        });
    });
  });

  describe('GET /calendar/events', () => {
    beforeEach(async () => {
      // Create and add events to calendar
      const eventResponse = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Calendar Event',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 3600000).toISOString(),
        });

      await request(app.getHttpServer())
        .patch(`/calendar/addEvent/${eventResponse.body._id}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should get all events from calendar', () => {
      return request(app.getHttpServer())
        .get('/calendar/events')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('events');
          expect(Array.isArray(res.body.events)).toBe(true);
        });
    });
  });

  describe('GET /calendar/reminders', () => {
    beforeEach(async () => {
      // Create and add reminders to calendar
      const reminderResponse = await request(app.getHttpServer())
        .post('/reminders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Calendar Reminder',
          reminderDate: new Date().toISOString(),
        });

      await request(app.getHttpServer())
        .patch(`/calendar/addReminder/${reminderResponse.body._id}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should get all reminders from calendar', () => {
      return request(app.getHttpServer())
        .get('/calendar/reminders')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('reminders');
          expect(Array.isArray(res.body.reminders)).toBe(true);
        });
    });
  });

  describe('GET /calendar/today', () => {
    beforeEach(async () => {
      const today = new Date();
      
      // Create task for today
      const taskResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Today Task',
          status: TaskStatus.PENDING,
          dueDate: today.toISOString(),
        });

      // Create event for today
      const eventResponse = await request(app.getHttpServer())
        .post('/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Today Event',
          startDate: today.toISOString(),
          endDate: new Date(today.getTime() + 3600000).toISOString(),
        });

      await request(app.getHttpServer())
        .patch(`/calendar/addTask/${taskResponse.body._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      await request(app.getHttpServer())
        .patch(`/calendar/addEvent/${eventResponse.body._id}`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should get today items from calendar', () => {
      return request(app.getHttpServer())
        .get('/calendar/today')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('tasks');
          expect(res.body).toHaveProperty('events');
          expect(res.body).toHaveProperty('reminders');
        });
    });
  });

  describe('GET /calendar/week', () => {
    it('should get this week items from calendar', () => {
      return request(app.getHttpServer())
        .get('/calendar/week')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('tasks');
          expect(res.body).toHaveProperty('events');
          expect(res.body).toHaveProperty('reminders');
        });
    });
  });

  describe('GET /calendar/month', () => {
    it('should get this month items from calendar', () => {
      return request(app.getHttpServer())
        .get('/calendar/month')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('tasks');
          expect(res.body).toHaveProperty('events');
          expect(res.body).toHaveProperty('reminders');
        });
    });
  });

  describe('GET /calendar/year', () => {
    it('should get this year items from calendar', () => {
      return request(app.getHttpServer())
        .get('/calendar/year')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('tasks');
          expect(res.body).toHaveProperty('events');
          expect(res.body).toHaveProperty('reminders');
        });
    });
  });

  describe('GET /calendar/nextWeek', () => {
    it('should get next week items from calendar', () => {
      return request(app.getHttpServer())
        .get('/calendar/nextWeek')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('tasks');
          expect(res.body).toHaveProperty('events');
          expect(res.body).toHaveProperty('reminders');
        });
    });
  });

  describe('GET /calendar/nextMonth', () => {
    it('should get next month items from calendar', () => {
      return request(app.getHttpServer())
        .get('/calendar/nextMonth')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('tasks');
          expect(res.body).toHaveProperty('events');
          expect(res.body).toHaveProperty('reminders');
        });
    });
  });

  describe('GET /calendar/all-categories', () => {
    beforeEach(async () => {
      // Create tasks with different categories
      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Work Task',
          status: TaskStatus.PENDING,
          category: 'work',
        });

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Personal Task',
          status: TaskStatus.PENDING,
          category: 'personal',
        });
    });

    it('should get all categories from calendar', () => {
      return request(app.getHttpServer())
        .get('/calendar/all-categories')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthorized access properly', () => {
      return request(app.getHttpServer())
        .get('/calendar')
        .expect(401);
    });

    it('should handle invalid ObjectId gracefully', () => {
      return request(app.getHttpServer())
        .patch('/calendar/addTask/invalid-object-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should handle missing resources gracefully', () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      return request(app.getHttpServer())
        .patch(`/calendar/addTask/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple operations in sequence', async () => {
      // Create task
      const taskResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Complex Task',
          status: TaskStatus.PENDING,
        });

      // Add to calendar
      await request(app.getHttpServer())
        .patch(`/calendar/addTask/${taskResponse.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Get calendar
      const calendarResponse = await request(app.getHttpServer())
        .get('/calendar')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(calendarResponse.body.tasks).toContain(taskResponse.body._id);

      // Remove from calendar
      await request(app.getHttpServer())
        .patch(`/calendar/removeTask/${taskResponse.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify removal
      const updatedCalendarResponse = await request(app.getHttpServer())
        .get('/calendar')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(updatedCalendarResponse.body.tasks).not.toContain(taskResponse.body._id);
    });

    it('should handle concurrent operations', async () => {
      // Create multiple tasks
      const taskPromises = Array.from({ length: 3 }, (_, i) =>
        request(app.getHttpServer())
          .post('/tasks')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: `Concurrent Task ${i + 1}`,
            status: TaskStatus.PENDING,
          })
      );

      const taskResponses = await Promise.all(taskPromises);

      // Add all tasks to calendar concurrently
      const addPromises = taskResponses.map(response =>
        request(app.getHttpServer())
          .patch(`/calendar/addTask/${response.body._id}`)
          .set('Authorization', `Bearer ${authToken}`)
      );

      const addResponses = await Promise.all(addPromises);
      addResponses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Verify all tasks are in calendar
      const calendarResponse = await request(app.getHttpServer())
        .get('/calendar')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      taskResponses.forEach(taskResponse => {
        expect(calendarResponse.body.tasks).toContain(taskResponse.body._id);
      });
    });
  });
}); 