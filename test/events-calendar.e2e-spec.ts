import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/users/entities/user.entity';
import { EventsCalendar } from '../src/events-calendar/entities/events-calendar.entity';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import mongoose from 'mongoose';
import { EmailService } from '../src/email/email.service';
import * as cookieParser from 'cookie-parser';
import { RecurrenceFrequency, DayOfWeek } from '../src/events-calendar/entities/events-calendar.entity';

// Helper function to generate truly unique IDs
const generateUniqueId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${process.hrtime.bigint().toString(36)}`;
};

describe('EventsCalendarController (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<User>;
  let eventsCalendarModel: Model<EventsCalendar>;
  let jwtService: JwtService;
  let testUserId: mongoose.Types.ObjectId;
  let secondTestUserId: mongoose.Types.ObjectId;

  const testUser = {
    email: `events-test-user-${generateUniqueId()}@example.com`,
    username: `eventsuser-${generateUniqueId()}`,
    fullname: 'Events Test User',
    password: 'password123!',
  };

  const secondTestUser = {
    email: `events-test-user2-${generateUniqueId()}@example.com`,
    username: `eventsuser2-${generateUniqueId()}`,
    fullname: 'Events usero',
    password: 'password123!',
  };

  let accessToken: string;
  let secondUserAccessToken: string;
  let testEventId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.use(cookieParser());

    jwtService = moduleFixture.get<JwtService>(JwtService);
    const emailService = moduleFixture.get<EmailService>(EmailService);
    jest.spyOn(emailService, 'sendWelcomeEmail').mockResolvedValue(undefined);
    jest.spyOn(emailService, 'sendPasswordResetCode').mockResolvedValue(undefined);
    
    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
    eventsCalendarModel = moduleFixture.get<Model<EventsCalendar>>(getModelToken(EventsCalendar.name));

    await app.init();

    // Clean existing test users
    await userModel.deleteMany({ 
      email: { $in: [testUser.email, secondTestUser.email] } 
    });

    // Register first test user
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    testUserId = registerResponse.body.user;
    accessToken = registerResponse.body.access_token;

    // Register second test user
    const secondRegisterResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(secondTestUser);


    secondTestUserId = secondRegisterResponse.body.user;
    secondUserAccessToken = secondRegisterResponse.body.access_token;
    expect(secondUserAccessToken).toBeDefined();
  });

  afterAll(async () => {
    // Clean up test data
    await eventsCalendarModel.deleteMany({ 
      userId: { $in: [testUserId, secondTestUserId] } 
    });
    await userModel.deleteMany({ 
      email: { $in: [testUser.email, secondTestUser.email] } 
    });
    await app.close();
  });

  beforeEach(async () => {
    // Clean events before each test
    await eventsCalendarModel.deleteMany({ 
      userId: { $in: [testUserId, secondTestUserId] } 
    });
  });

  describe('POST /events-calendar - Create Event', () => {
    const validEventData = {
      title: 'Test Event',
      description: 'Test event description',
      location: 'Test Location',
      startDate: '2024-12-01T10:00:00Z',
      duration: 60,
      category: 'Meeting',
      color: '#ff0000'
    };

    it('should create a new event with valid data', () => {
      return request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(validEventData)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.title).toBe(validEventData.title);
          expect(res.body.description).toBe(validEventData.description);
          expect(res.body.location).toBe(validEventData.location);
          expect(res.body.category).toBe(validEventData.category);
          expect(res.body.duration).toBe(validEventData.duration);
          expect(res.body.color).toBe(validEventData.color);
          expect(res.body.userId.toString()).toBe(testUserId.toString());
          testEventId = res.body._id;
        });
    });

    it('should create event with minimal required data', () => {
      const minimalEvent = {
        title: 'Minimal Event',
        startDate: '2024-12-01T10:00:00Z',
        category: 'General',
        location: "test location",
        description: "test description",
      };

      return request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(minimalEvent)
        .expect(201)
        .expect((res) => {
          expect(res.body.title).toBe(minimalEvent.title);
          expect(res.body.category).toBe('General'); // Default value
        });
    });

    it('should create recurring event with weekly frequency', () => {
      const recurringEvent = {
        title: 'Weekly Team Meeting',
        description: 'Weekly standup meeting',
        location: "test location",
        startDate: '2024-12-02T09:00:00Z',
        duration: 30,
        category: 'Meeting',
        recurrence: {
          frequency: RecurrenceFrequency.WEEKLY,
          interval: 1,
          daysOfWeek: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY],
          maxOccurrences: 10
        }
      };

      return request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(recurringEvent)
        .expect(201)
        .expect((res) => {
          expect(res.body.title).toBe(recurringEvent.title);
          expect(res.body.recurrence).toBeDefined();
          expect(res.body.recurrence.frequency).toBe(RecurrenceFrequency.WEEKLY);
          expect(res.body.recurrence.daysOfWeek).toEqual([DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY]);
          expect(res.body.recurrence.maxOccurrences).toBe(10);
        });
    });

    it('should create recurring event with monthly frequency and end date', () => {
       const recurringEvent = {
        title: 'Weekly Team Meeting',
        description: 'Weekly standup meeting',
        location: "test location",
        startDate: '2024-12-02T09:00:00Z',
        duration: 30,
        category: 'Meeting',
        recurrence: {
          frequency: RecurrenceFrequency.MONTHLY,
          interval: 1,
          endDate: '2025-06-01T23:59:59.999Z'
        }
      };

      return request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(recurringEvent)
        .expect(201)
        .expect((res) => {
          expect(res.body.recurrence.frequency).toBe('monthly');
          expect(res.body.recurrence.endDate).toBeDefined();
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/events-calendar')
        .send(validEventData)
        .expect(401);
    });

    it('should fail with invalid title length', () => {
      const invalidEvent = {
        ...validEventData,
        title: 'A'.repeat(26), // Too long
      };

      return request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidEvent)
        .expect(400);
    });

    it('should fail without required title', () => {
      const invalidEvent = {
        ...validEventData,
        title: undefined,
      };

      return request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidEvent)
        .expect(400);
    });

    it('should fail without required startDate', () => {
      const invalidEvent = {
        ...validEventData,
        startDate: undefined,
      };

      return request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidEvent)
        .expect(400);
    });

    it('should fail with invalid description length', () => {
      const invalidEvent = {
        ...validEventData,
        description: 'A'.repeat(101), // Too long
      };

      return request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidEvent)
        .expect(400);
    });

    it('should fail with invalid location length', () => {
      const invalidEvent = {
        ...validEventData,
        location: 'A'.repeat(51), // Too long
      };

      return request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidEvent)
        .expect(400);
    });

    it('should fail with invalid category length', () => {
      const invalidEvent = {
        ...validEventData,
        category: 'A'.repeat(26), // Too long
      };

      return request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidEvent)
        .expect(400);
    });

    it('should fail with invalid recurrence frequency', () => {
      const invalidEvent = {
        ...validEventData,
        recurrence: {
          frequency: 'invalid_frequency',
          interval: 1
        }
      };

      return request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidEvent)
        .expect(400);
    });
  });

  describe('GET /events-calendar - Find All Events', () => {
    beforeEach(async () => {
      // Create test events
      await request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Event 1',
          description: 'Test event description 1',
          startDate: new Date('2024-12-01T10:00:00Z').toISOString(),
          category: 'Meeting'
        });

      await request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Event 2',
          startDate: new Date('2024-12-02T14:00:00Z').toISOString(),
          category: 'Task'
        });

      // Create event for second user (should not be visible)
      await request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${secondUserAccessToken}`)
        .send({
          title: 'Other User Event',
          startDate: new Date('2024-12-03T16:00:00Z').toISOString(),
          category: 'Personal'
        });
    });

    it('should return all events for authenticated user', () => {
      return request(app.getHttpServer())
        .get('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(2);
          expect(res.body[0].title).toBe('Test Event 1');
          expect(res.body[1].title).toBe('Test Event 2');
          // Verify user isolation
          expect(res.body.every(event => event.userId.toString() === testUserId.toString())).toBe(true);
        });
    });

    it('should return empty array when user has no events', async () => {
      // Clean user events first
      await eventsCalendarModel.deleteMany({ userId: testUserId });

      return request(app.getHttpServer())
        .get('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(0);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/events-calendar')
        .expect(401);
    });
  });

  describe('GET /events-calendar/range - Find Events in Range', () => {
    beforeEach(async () => {
      // Create events across different dates
      await request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Event in Range 1',
          startDate: new Date('2024-12-05T10:00:00Z').toISOString(),
          category: 'Meeting'
        });

      await request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Event in Range 2',
          startDate: new Date('2024-12-15T14:00:00Z').toISOString(),
          category: 'Task'
        });

      await request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Event Outside Range',
          startDate: new Date('2024-11-30T16:00:00Z').toISOString(),
          category: 'Personal'
        });
    });

    it('should return events within specified date range', () => {
      const startDate = new Date('2024-12-01T00:00:00Z').toISOString();
      const endDate = new Date('2024-12-20T23:59:59Z').toISOString();

      return request(app.getHttpServer())
        .get(`/events-calendar/range?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(2);
          expect(res.body.some(event => event.title === 'Event in Range 1')).toBe(true);
          expect(res.body.some(event => event.title === 'Event in Range 2')).toBe(true);
          expect(res.body.some(event => event.title === 'Event Outside Range')).toBe(false);
        });
    });

    it('should return empty array when no events in range', () => {
      const startDate = new Date('2025-01-01T00:00:00Z').toISOString();
      const endDate = new Date('2025-01-31T23:59:59Z').toISOString();

      return request(app.getHttpServer())
        .get(`/events-calendar/range?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(0);
        });
    });

    it('should fail with invalid date format', () => {
      const startDate = 'invalid-date';
      const endDate = new Date('2024-12-31T23:59:59Z').toISOString();

      return request(app.getHttpServer())
        .get(`/events-calendar/range?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should fail without date parameters', () => {
      return request(app.getHttpServer())
        .get('/events-calendar/range')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should fail without authentication', () => {
      const startDate = new Date('2024-12-01T00:00:00Z').toISOString();
      const endDate = new Date('2024-12-31T23:59:59Z').toISOString();

      return request(app.getHttpServer())
        .get(`/events-calendar/range?startDate=${startDate}&endDate=${endDate}`)
        .expect(401);
    });
  });

  describe('GET /events-calendar/:id - Find One Event', () => {
    let createdEventId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Event for Find One',
          description: 'Test description',
          startDate: new Date('2024-12-01T10:00:00Z').toISOString(),
          category: 'Meeting'
        });
      
      createdEventId = response.body._id;
    });

    it('should return specific event by ID', () => {
      return request(app.getHttpServer())
        .get(`/events-calendar/${createdEventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(createdEventId);
          expect(res.body.title).toBe('Test Event for Find One');
          expect(res.body.description).toBe('Test description');
          expect(res.body.category).toBe('Meeting');
        });
    });

    it('should fail with invalid ObjectId format', () => {
      return request(app.getHttpServer())
        .get('/events-calendar/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should fail when event does not exist', () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      return request(app.getHttpServer())
        .get(`/events-calendar/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should fail when trying to access another user event', async () => {
      // Create event with second user
      const response = await request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${secondUserAccessToken}`)
        .send({
          title: 'Other User Event',
          description: 'Other user event description',
          startDate: new Date('2024-12-01T10:00:00Z').toISOString(),
          category: 'Meeting'
        });

      const otherUserEventId = response.body._id;
      // Try to access with first user
      return request(app.getHttpServer())
        .get(`/events-calendar/${otherUserEventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/events-calendar/${createdEventId}`)
        .expect(401);
    });
  });

  describe('PATCH /events-calendar/:id - Update Event', () => {
    let createdEventId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Original Event',
          description: 'Original description',
          startDate: new Date('2024-12-01T10:00:00Z').toISOString(),
          duration: 60,
          category: 'Meeting',
          location: 'Original Location'
        });
      
      createdEventId = response.body._id;
    });

    it('should update event with valid data', () => {
      const updateData = {
        title: 'Updated Event',
        description: 'Updated description',
        duration: 90,
        category: 'Workshop'
      };

      return request(app.getHttpServer())
        .patch(`/events-calendar/${createdEventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(createdEventId);
          expect(res.body.title).toBe(updateData.title);
          expect(res.body.description).toBe(updateData.description);
          expect(res.body.duration).toBe(updateData.duration);
          expect(res.body.category).toBe(updateData.category);
          // Unchanged fields should remain
          expect(res.body.location).toBe('Original Location');
        });
    });

    it('should update partial data', () => {
      const updateData = {
        title: 'Partially Updated Event'
      };

      return request(app.getHttpServer())
        .patch(`/events-calendar/${createdEventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe(updateData.title);
          expect(res.body.description).toBe('Original description'); // Should remain unchanged
        });
    });

    it('should update recurrence pattern', () => {
      const updateData = {
        recurrence: {
          frequency: RecurrenceFrequency.WEEKLY,
          interval: 2,
          daysOfWeek: [DayOfWeek.TUESDAY, DayOfWeek.THURSDAY],
          maxOccurrences: 5
        }
      };

      return request(app.getHttpServer())
        .patch(`/events-calendar/${createdEventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.recurrence).toBeDefined();
          expect(res.body.recurrence.frequency).toBe(RecurrenceFrequency.WEEKLY);
          expect(res.body.recurrence.interval).toBe(2);
          expect(res.body.recurrence.daysOfWeek).toEqual([DayOfWeek.TUESDAY, DayOfWeek.THURSDAY]);
        });
    });

    it('should fail with invalid ObjectId format', () => {
      return request(app.getHttpServer())
        .patch('/events-calendar/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated' })
        .expect(400);
    });

    it('should fail when event does not exist', () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      return request(app.getHttpServer())
        .patch(`/events-calendar/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated' })
        .expect(404);
    });

    it('should fail when trying to update another user event', async () => {
      // Create event with second user
      const response = await request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${secondUserAccessToken}`)
        .send({
          title: 'Other User Event',
          startDate: new Date('2024-12-01T10:00:00Z').toISOString()
        });

      const otherUserEventId = response.body._id;

      // Try to update with first user
      return request(app.getHttpServer())
        .patch(`/events-calendar/${otherUserEventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Hacked' })
        .expect(403);
    });

    it('should fail with invalid validation data', () => {
      const invalidData = {
        title: 'A'.repeat(26), // Too long
      };

      return request(app.getHttpServer())
        .patch(`/events-calendar/${createdEventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidData)
        .expect(400);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/events-calendar/${createdEventId}`)
        .send({ title: 'Updated' })
        .expect(401);
    });
  });

  describe('DELETE /events-calendar/:id - Delete Event', () => {
    let createdEventId: string;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Event to Delete',
          description: 'This event will be deleted',
          startDate: new Date('2024-12-01T10:00:00Z').toISOString(),
          category: 'Meeting'
        });
      
      createdEventId = response.body._id;
    });

    it('should delete event successfully', () => {
      return request(app.getHttpServer())
        .delete(`/events-calendar/${createdEventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(createdEventId);
          expect(res.body.title).toBe('Event to Delete');
        });
    });

    it('should verify event is actually deleted', async () => {
      // Delete the event
      await request(app.getHttpServer())
        .delete(`/events-calendar/${createdEventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Try to find the deleted event
      return request(app.getHttpServer())
        .get(`/events-calendar/${createdEventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should fail with invalid ObjectId format', () => {
      return request(app.getHttpServer())
        .delete('/events-calendar/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);
    });

    it('should fail when event does not exist', () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      return request(app.getHttpServer())
        .delete(`/events-calendar/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);
    });

    it('should fail when trying to delete another user event', async () => {
      // Create event with second user
      const response = await request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${secondUserAccessToken}`)
        .send({
          title: 'Other User Event',
          startDate: new Date('2024-12-01T10:00:00Z').toISOString()
        });

      const otherUserEventId = response.body._id;

      // Try to delete with first user
      return request(app.getHttpServer())
        .delete(`/events-calendar/${otherUserEventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/events-calendar/${createdEventId}`)
        .expect(401);
    });
  });

  describe('GET /events-calendar/admin/test - Admin Test Endpoint', () => {
    it('should return test information for admin endpoint', () => {
      return request(app.getHttpServer())
        .get('/events-calendar/admin/test')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Recurring events module working correctly');
          expect(res.body).toHaveProperty('examples');
          expect(Array.isArray(res.body.examples)).toBe(true);
          expect(res.body.examples).toHaveLength(2);
          
          // Verify example structure
          const weeklyExample = res.body.examples[0];
          expect(weeklyExample).toHaveProperty('description');
          expect(weeklyExample).toHaveProperty('payload');
          expect(weeklyExample.payload).toHaveProperty('recurrence');
          expect(weeklyExample.payload.recurrence.frequency).toBe('weekly');
          
          const monthlyExample = res.body.examples[1];
          expect(monthlyExample.payload.recurrence.frequency).toBe('monthly');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/events-calendar/admin/test')
        .expect(401);
    });
  });

  describe('Complex Integration Tests', () => {
    it('should handle complete event lifecycle (create, read, update, delete)', async () => {
      // Create event
      const createResponse = await request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Lifecycle Test Event',
          description: 'Testing complete lifecycle',
          startDate: new Date('2024-12-01T10:00:00Z').toISOString(),
          duration: 60,
          category: 'Meeting'
        });

      const eventId = createResponse.body._id;
      expect(createResponse.status).toBe(201);

      // Read event
      const readResponse = await request(app.getHttpServer())
        .get(`/events-calendar/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(readResponse.status).toBe(200);
      expect(readResponse.body.title).toBe('Lifecycle Test Event');

      // Update event
      const updateResponse = await request(app.getHttpServer())
        .patch(`/events-calendar/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Lifecycle Event',
          duration: 90
        });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.title).toBe('Updated Lifecycle Event');
      expect(updateResponse.body.duration).toBe(90);

      // Delete event
      const deleteResponse = await request(app.getHttpServer())
        .delete(`/events-calendar/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(deleteResponse.status).toBe(200);

      // Verify deletion
      const verifyResponse = await request(app.getHttpServer())
        .get(`/events-calendar/${eventId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(verifyResponse.status).toBe(404);
    });

    it('should properly handle recurring events with date range queries', async () => {
      // Create recurring event
      const recurringEvent = {
        title: 'Weekly Recurring Meeting',
        description: 'Team standup every Monday',
        startDate: new Date('2024-12-02T09:00:00Z').toISOString(), // Monday
        duration: 30,
        category: 'Meeting',
        recurrence: {
          frequency: RecurrenceFrequency.WEEKLY,
          interval: 1,
          daysOfWeek: [DayOfWeek.MONDAY],
          maxOccurrences: 4
        }
      };

      const createResponse = await request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(recurringEvent);

      expect(createResponse.status).toBe(201);

      // Query for events in December 2024
      const startDate = new Date('2024-12-01T00:00:00Z').toISOString();
      const endDate = new Date('2024-12-31T23:59:59Z').toISOString();

      const rangeResponse = await request(app.getHttpServer())
        .get(`/events-calendar/range?startDate=${startDate}&endDate=${endDate}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(rangeResponse.status).toBe(200);
      expect(Array.isArray(rangeResponse.body)).toBe(true);
      
      // Should include the main recurring event and potentially generated instances
      const events = rangeResponse.body.filter(event => 
        event.title === 'Weekly Recurring Meeting'
      );
      expect(events.length).toBeGreaterThan(0);
    });

    it('should maintain user data isolation across all operations', async () => {
      // Create events for both users
      const user1Event = await request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'User 1 Event',
          startDate: new Date('2024-12-01T10:00:00Z').toISOString()
        });

      const user2Event = await request(app.getHttpServer())
        .post('/events-calendar')
        .set('Authorization', `Bearer ${secondUserAccessToken}`)
        .send({
          title: 'User 2 Event',
          startDate: new Date('2024-12-01T10:00:00Z').toISOString()
        });

      // Verify user 1 can only see their events
      const user1AllEvents = await request(app.getHttpServer())
        .get('/events-calendar')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(user1AllEvents.body).toHaveLength(1);
      expect(user1AllEvents.body[0].title).toBe('User 1 Event');

      // Verify user 2 can only see their events
      const user2AllEvents = await request(app.getHttpServer())
        .get('/events-calendar')
        .set('Authorization', `Bearer ${secondUserAccessToken}`);

      expect(user2AllEvents.body).toHaveLength(1);
      expect(user2AllEvents.body[0].title).toBe('User 2 Event');

      // Verify cross-user access restrictions
      const user1TryingUser2Event = await request(app.getHttpServer())
        .get(`/events-calendar/${user2Event.body._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(user1TryingUser2Event.status).toBe(403);
    });
  });
});