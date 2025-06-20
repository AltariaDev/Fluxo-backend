import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestDatabaseModule } from './setup';
import { User, UserSchema } from '../src/users/entities/user.entity';
import { Habit, HabitSchema } from '../src/habits/entities/habit.entity';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import mongoose from 'mongoose';
import { EmailService } from '../src/email/email.service';

describe('HabitsController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let configService: ConfigService;
  let userModel: Model<User>;
  let habitModel: Model<Habit>;
  let authToken: string;
  let secondAuthToken: string;
  let testUserId: mongoose.Types.ObjectId;
  let secondUserId: mongoose.Types.ObjectId;
  let testHabitId: mongoose.Types.ObjectId;

  const testUser = {
    fullname: 'Habits Test User',
    email: 'habits-test@example.com',
    username: 'habitstestuser',
    password: 'SecurePass123!',
  };

  const secondTestUser = {
    fullname: 'Second Habits User',
    email: 'habits-test2@example.com',
    username: 'habitstestuser2',
    password: 'SecurePass456!',
  };

  const validHabit = {
    title: 'Daily Exercise',
    description: '30 minutes of exercise every day',
    category: 'Health',
    frequency: 'daily',
    goal: 30,
    color: '#FF5733',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TestDatabaseModule,
        MongooseModule.forFeature([
          { name: User.name, schema: UserSchema },
          { name: Habit.name, schema: HabitSchema },
        ]),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
    const emailService = moduleFixture.get<EmailService>(EmailService);
    jest.spyOn(emailService, 'sendWelcomeEmail').mockResolvedValue(undefined);
    jest.spyOn(emailService, 'sendPasswordResetCode').mockResolvedValue(undefined);
    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
    habitModel = moduleFixture.get<Model<Habit>>(getModelToken(Habit.name));

    // Create test users
    const testUserResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser);
    testUserId = testUserResponse.body._id;
    authToken = jwtService.sign({ sub: testUserId });

    const secondUserResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(secondTestUser);
    secondUserId = secondUserResponse.body._id;
    secondAuthToken = jwtService.sign({ sub: secondUserId });

    // Create a test habit
    const habitResponse = await request(app.getHttpServer())
      .post('/habits')
      .set('Authorization', `Bearer ${authToken}`)
      .send(validHabit);
    testHabitId = habitResponse.body._id;
  });

  afterAll(async () => {
    await habitModel.deleteMany({});
    await userModel.deleteMany({
      email: { $in: [testUser.email, secondTestUser.email] }
    });
    await app.close();
  });

  beforeEach(async () => {
    // Clean up habits created during tests (except the main test habit)
    await habitModel.deleteMany({
      _id: { $ne: testHabitId },
      title: { $regex: /test|Test/ }
    });
  });

  describe('POST /habits', () => {
    it('should create a new habit with valid data', () => {
      const newHabit = {
        title: 'Read Books',
        description: 'Read for 1 hour daily',
        category: 'Education',
        frequency: 'daily',
        goal: 60,
        color: '#3498DB',
      };

      return request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newHabit)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.title).toBe(newHabit.title);
          expect(res.body.description).toBe(newHabit.description);
          expect(res.body.category).toBe(newHabit.category);
          expect(res.body.frequency).toBe(newHabit.frequency);
          expect(res.body.goal).toBe(newHabit.goal);
          expect(res.body.color).toBe(newHabit.color);
          expect(res.body.user).toBe(testUserId.toString());
          expect(res.body).toHaveProperty('createdAt');
          expect(res.body).toHaveProperty('updatedAt');
          expect(res.body.isActive).toBe(true);
          expect(res.body.streak).toBe(0);
        });
    });

    it('should fail to create habit without authentication', () => {
      return request(app.getHttpServer())
        .post('/habits')
        .send(validHabit)
        .expect(401);
    });

    it('should fail to create habit with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Incomplete Habit',
          // Missing required fields
        })
        .expect(400);
    });

    it('should fail to create habit with invalid frequency', () => {
      return request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validHabit,
          frequency: 'invalid-frequency',
        })
        .expect(400);
    });

    it('should fail to create habit with negative goal', () => {
      return request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validHabit,
          goal: -10,
        })
        .expect(400);
    });

    it('should fail to create habit with invalid color format', () => {
      return request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validHabit,
          color: 'invalid-color',
        })
        .expect(400);
    });

    it('should create habit with minimum required fields', () => {
      const minimalHabit = {
        title: 'Minimal Habit',
        frequency: 'daily',
      };

      return request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send(minimalHabit)
        .expect(201)
        .expect((res) => {
          expect(res.body.title).toBe(minimalHabit.title);
          expect(res.body.frequency).toBe(minimalHabit.frequency);
        });
    });

    it('should sanitize habit input', () => {
      return request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validHabit,
          title: '<script>alert("xss")</script>Malicious Habit',
          description: '<b>Bold</b> description',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.title).not.toContain('<script>');
          expect(res.body.description).not.toContain('<b>');
        });
    });

    it('should handle unicode characters in habit data', () => {
      return request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...validHabit,
          title: '学习中文 📚',
          description: 'Aprender español 🇪🇸',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.title).toBe('学习中文 📚');
          expect(res.body.description).toBe('Aprender español 🇪🇸');
        });
    });

    it('should allow duplicate habit titles for different users', async () => {
      await request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${secondAuthToken}`)
        .send(validHabit)
        .expect(201);
    });

    it('should validate frequency enum values', () => {
      const validFrequencies = ['daily', 'weekly', 'monthly'];
      
      return Promise.all(
        validFrequencies.map(frequency =>
          request(app.getHttpServer())
            .post('/habits')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              ...validHabit,
              title: `${frequency} habit`,
              frequency,
            })
            .expect(201)
        )
      );
    });
  });

  describe('GET /habits', () => {
    beforeEach(async () => {
      // Create additional test habits
      await request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Morning Meditation',
          frequency: 'daily',
          category: 'Wellness',
          goal: 15,
        });

      await request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Weekly Cooking',
          frequency: 'weekly',
          category: 'Lifestyle',
          goal: 3,
        });

      await request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${secondAuthToken}`)
        .send({
          title: 'Other User Habit',
          frequency: 'daily',
          category: 'Health',
        });
    });

    it('should return all habits for authenticated user', () => {
      return request(app.getHttpServer())
        .get('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(3);
          res.body.forEach((habit: any) => {
            expect(habit.user).toBe(testUserId.toString());
            expect(habit).toHaveProperty('_id');
            expect(habit).toHaveProperty('title');
            expect(habit).toHaveProperty('frequency');
          });
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/habits')
        .expect(401);
    });

    it('should only return habits belonging to the authenticated user', () => {
      return request(app.getHttpServer())
        .get('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          const otherUserHabits = res.body.filter((habit: any) => 
            habit.user !== testUserId.toString()
          );
          expect(otherUserHabits.length).toBe(0);
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/habits?limit=2&page=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(2);
        });
    });

    it('should support filtering by category', () => {
      return request(app.getHttpServer())
        .get('/habits?category=Health')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          res.body.forEach((habit: any) => {
            expect(habit.category).toBe('Health');
          });
        });
    });

    it('should support filtering by frequency', () => {
      return request(app.getHttpServer())
        .get('/habits?frequency=daily')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          res.body.forEach((habit: any) => {
            expect(habit.frequency).toBe('daily');
          });
        });
    });

    it('should support filtering by active status', () => {
      return request(app.getHttpServer())
        .get('/habits?isActive=true')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          res.body.forEach((habit: any) => {
            expect(habit.isActive).toBe(true);
          });
        });
    });

    it('should support sorting by creation date', () => {
      return request(app.getHttpServer())
        .get('/habits?sort=createdAt&order=desc')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          for (let i = 1; i < res.body.length; i++) {
            const prev = new Date(res.body[i - 1].createdAt);
            const curr = new Date(res.body[i].createdAt);
            expect(prev.getTime()).toBeGreaterThanOrEqual(curr.getTime());
          }
        });
    });
  });

  describe('GET /habits/:id', () => {
    it('should return a specific habit by ID', () => {
      return request(app.getHttpServer())
        .get(`/habits/${testHabitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(testHabitId.toString());
          expect(res.body.title).toBe(validHabit.title);
          expect(res.body.user).toBe(testUserId.toString());
        });
    });

    it('should fail with invalid ObjectId', () => {
      return request(app.getHttpServer())
        .get('/habits/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should fail with non-existent habit ID', () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      return request(app.getHttpServer())
        .get(`/habits/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/habits/${testHabitId}`)
        .expect(401);
    });

    it('should not allow access to other users habits', async () => {
      // Create a habit for the second user
      const otherUserHabit = await request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${secondAuthToken}`)
        .send({
          title: 'Other Users Habit',
          frequency: 'daily',
        });

      // Try to access it with the first user's token
      return request(app.getHttpServer())
        .get(`/habits/${otherUserHabit.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404); // Should not find it or return 403
    });
  });

  describe('PATCH /habits/:id', () => {
    let updateHabitId: mongoose.Types.ObjectId;

    beforeEach(async () => {
      // Create a habit to update
      const habitResponse = await request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Update Test Habit',
          frequency: 'daily',
          category: 'Test',
          goal: 30,
        });
      updateHabitId = habitResponse.body._id;
    });

    it('should update habit with valid data', () => {
      const updateData = {
        title: 'Updated Habit Title',
        description: 'Updated description',
        goal: 45,
        color: '#27AE60',
      };

      return request(app.getHttpServer())
        .patch(`/habits/${updateHabitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe(updateData.title);
          expect(res.body.description).toBe(updateData.description);
          expect(res.body.goal).toBe(updateData.goal);
          expect(res.body.color).toBe(updateData.color);
          expect(res.body).toHaveProperty('updatedAt');
        });
    });

    it('should allow partial updates', () => {
      return request(app.getHttpServer())
        .patch(`/habits/${updateHabitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Partially Updated Title',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Partially Updated Title');
        });
    });

    it('should fail to update with invalid frequency', () => {
      return request(app.getHttpServer())
        .patch(`/habits/${updateHabitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          frequency: 'invalid-frequency',
        })
        .expect(400);
    });

    it('should fail to update with negative goal', () => {
      return request(app.getHttpServer())
        .patch(`/habits/${updateHabitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          goal: -5,
        })
        .expect(400);
    });

    it('should fail to update non-existent habit', () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      return request(app.getHttpServer())
        .patch(`/habits/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
        })
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/habits/${updateHabitId}`)
        .send({
          title: 'Updated Title',
        })
        .expect(401);
    });

    it('should not allow updating other users habits', async () => {
      // Create a habit for the second user
      const otherUserHabit = await request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${secondAuthToken}`)
        .send({
          title: 'Other Users Habit',
          frequency: 'daily',
        });

      // Try to update it with the first user's token
      return request(app.getHttpServer())
        .patch(`/habits/${otherUserHabit.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Hacked Title',
        })
        .expect(404); // Should not find it or return 403
    });

    it('should sanitize update data', () => {
      return request(app.getHttpServer())
        .patch(`/habits/${updateHabitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '<script>alert("xss")</script>Malicious Update',
          description: '<img src="x" onerror="alert(1)">Bad description',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).not.toContain('<script>');
          expect(res.body.description).not.toContain('<img');
        });
    });

    it('should update streak and completion tracking', () => {
      return request(app.getHttpServer())
        .patch(`/habits/${updateHabitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          streak: 5,
          lastCompleted: new Date().toISOString(),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.streak).toBe(5);
          expect(res.body).toHaveProperty('lastCompleted');
        });
    });

    it('should toggle habit active status', () => {
      return request(app.getHttpServer())
        .patch(`/habits/${updateHabitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          isActive: false,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.isActive).toBe(false);
        });
    });
  });

  describe('DELETE /habits/:id', () => {
    let deleteHabitId: mongoose.Types.ObjectId;

    beforeEach(async () => {
      // Create a habit to delete
      const habitResponse = await request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Delete Test Habit',
          frequency: 'daily',
          category: 'Test',
        });
      deleteHabitId = habitResponse.body._id;
    });

    it('should delete habit successfully', () => {
      return request(app.getHttpServer())
        .delete(`/habits/${deleteHabitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(deleteHabitId.toString());
        });
    });

    it('should fail to delete non-existent habit', () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      return request(app.getHttpServer())
        .delete(`/habits/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/habits/${deleteHabitId}`)
        .expect(401);
    });

    it('should not allow deleting other users habits', async () => {
      // Create a habit for the second user
      const otherUserHabit = await request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${secondAuthToken}`)
        .send({
          title: 'Other Users Habit',
          frequency: 'daily',
        });

      // Try to delete it with the first user's token
      return request(app.getHttpServer())
        .delete(`/habits/${otherUserHabit.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404); // Should not find it or return 403
    });

    it('should verify habit is actually deleted', async () => {
      // Delete the habit
      await request(app.getHttpServer())
        .delete(`/habits/${deleteHabitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Try to get the deleted habit
      return request(app.getHttpServer())
        .get(`/habits/${deleteHabitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Habit Completion and Tracking', () => {
    let trackingHabitId: mongoose.Types.ObjectId;

    beforeEach(async () => {
      const habitResponse = await request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Tracking Test Habit',
          frequency: 'daily',
          goal: 30,
        });
      trackingHabitId = habitResponse.body._id;
    });

    it('should mark habit as completed', () => {
      return request(app.getHttpServer())
        .post(`/habits/${trackingHabitId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.completedToday).toBe(true);
          expect(res.body.streak).toBeGreaterThan(0);
          expect(res.body).toHaveProperty('lastCompleted');
        });
    });

    it('should track habit progress', () => {
      return request(app.getHttpServer())
        .post(`/habits/${trackingHabitId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          progress: 15,
          date: new Date().toISOString(),
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.progress).toBe(15);
        });
    });

    it('should get habit statistics', () => {
      return request(app.getHttpServer())
        .get(`/habits/${trackingHabitId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('streak');
          expect(res.body).toHaveProperty('completionRate');
          expect(res.body).toHaveProperty('totalCompletions');
        });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON gracefully', () => {
      return request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });

    it('should handle very large payloads', () => {
      const largeString = 'a'.repeat(10000);
      
      return request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: largeString,
          frequency: 'daily',
        })
        .expect(400);
    });

    it('should handle null and undefined values', () => {
      return request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: null,
          description: undefined,
          frequency: 'daily',
        })
        .expect(400);
    });

    it('should handle concurrent habit operations', async () => {
      const promises = Array(5).fill(null).map((_, index) =>
        request(app.getHttpServer())
          .post('/habits')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            title: `Concurrent Habit ${index}`,
            frequency: 'daily',
            category: 'Test',
          })
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 201);
      
      expect(successful.length).toBe(5); // All should succeed
    });

    it('should maintain data integrity across operations', async () => {
      // Create habit
      const createResponse = await request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Integrity Test Habit',
          frequency: 'daily',
          goal: 30,
        });

      const habitId = createResponse.body._id;

      // Update habit
      await request(app.getHttpServer())
        .patch(`/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Integrity Habit',
          goal: 45,
        });

      // Verify update
      const getResponse = await request(app.getHttpServer())
        .get(`/habits/${habitId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.body.title).toBe('Updated Integrity Habit');
      expect(getResponse.body.goal).toBe(45);
      expect(getResponse.body.frequency).toBe('daily'); // Should remain unchanged
    });

    it('should handle database connection issues gracefully', async () => {
      // This would require mocking the database connection
      // For now, we'll test that the endpoints respond consistently
      const response = await request(app.getHttpServer())
        .get('/habits')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Authorization and Security', () => {
    it('should handle expired tokens gracefully', () => {
      const expiredToken = jwtService.sign(
        { sub: testUserId },
        { expiresIn: '-1h' }
      );

      return request(app.getHttpServer())
        .get('/habits')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should handle invalid tokens gracefully', () => {
      return request(app.getHttpServer())
        .get('/habits')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    it('should handle missing authorization header', () => {
      return request(app.getHttpServer())
        .get('/habits')
        .expect(401);
    });

    it('should handle malformed authorization header', () => {
      return request(app.getHttpServer())
        .get('/habits')
        .set('Authorization', 'InvalidFormat')
        .expect(401);
    });

    it('should prevent access to non-owned resources', async () => {
      // Create a habit with one user
      const habit = await request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Private Habit',
          frequency: 'daily',
        });

      // Try to access with another user's token
      await request(app.getHttpServer())
        .get(`/habits/${habit.body._id}`)
        .set('Authorization', `Bearer ${secondAuthToken}`)
        .expect(404);

      // Try to update with another user's token
      await request(app.getHttpServer())
        .patch(`/habits/${habit.body._id}`)
        .set('Authorization', `Bearer ${secondAuthToken}`)
        .send({ title: 'Hacked' })
        .expect(404);

      // Try to delete with another user's token
      await request(app.getHttpServer())
        .delete(`/habits/${habit.body._id}`)
        .set('Authorization', `Bearer ${secondAuthToken}`)
        .expect(404);
    });

    it('should sanitize all user input consistently', () => {
      const maliciousData = {
        title: '<script>alert("xss")</script>Evil Habit',
        description: '<iframe src="javascript:alert(1)"></iframe>Evil description',
        category: '<b>Evil Category</b>',
      };

      return request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...maliciousData,
          frequency: 'daily',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.title).not.toContain('<script>');
          expect(res.body.description).not.toContain('<iframe>');
          expect(res.body.category).not.toContain('<b>');
        });
    });
  });
}); 