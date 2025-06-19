import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { CreateHabitDto } from '../src/habits/dto/create-habit.dto';
import { UpdateHabitDto } from '../src/habits/dto/update-habit.dto';
import mongoose from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { User } from '../src/users/entities/user.entity';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';

describe('HabitsController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let userModel: Model<User>;
  let authToken: string;
  let testUserId: mongoose.Types.ObjectId;
  let testHabitId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));

    // Create a test user
    const testUser = await userModel.create({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    }) as User;
    testUserId = testUser._id as mongoose.Types.ObjectId;

    // Generate JWT token
    authToken = jwtService.sign({ id: testUserId.toString() });
  });

  afterAll(async () => {
    // Clean up test data
    await userModel.deleteOne({ _id: testUserId });
    await app.close();
  });

  describe('POST /habits', () => {
    const createHabitDto: CreateHabitDto = {
      name: 'Test Habit',
      description: 'Test Description',
      type: 'health',
      frequency: 'daily',
    };

    it('should create a new habit', () => {
      return request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createHabitDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.name).toBe(createHabitDto.name);
          expect(res.body.description).toBe(createHabitDto.description);
          expect(res.body.type).toBe(createHabitDto.type);
          expect(res.body.frequency).toBe(createHabitDto.frequency);
          expect(res.body.userId).toBe(testUserId.toString());
          testHabitId = res.body._id;
        });
    });

    it('should fail to create a habit without authentication', () => {
      return request(app.getHttpServer())
        .post('/habits')
        .send(createHabitDto)
        .expect(401);
    });

    it('should fail to create a habit with invalid data', () => {
      const invalidHabitDto = {
        name: 'Test Habit',
        // Missing required fields
      };

      return request(app.getHttpServer())
        .post('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidHabitDto)
        .expect(400);
    });
  });

  describe('GET /habits', () => {
    it('should return all habits for the authenticated user', () => {
      return request(app.getHttpServer())
        .get('/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('_id');
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[0]).toHaveProperty('userId');
        });
    });

    it('should fail to get habits without authentication', () => {
      return request(app.getHttpServer())
        .get('/habits')
        .expect(401);
    });
  });

  describe('GET /habits/:id', () => {
    it('should return a specific habit by ID', () => {
      return request(app.getHttpServer())
        .get(`/habits/${testHabitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id', testHabitId);
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('userId', testUserId.toString());
        });
    });

    it('should fail to get a habit with invalid ID', () => {
      const invalidId = 'invalid-id';
      return request(app.getHttpServer())
        .get(`/habits/${invalidId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should fail to get a non-existent habit', () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      return request(app.getHttpServer())
        .get(`/habits/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PATCH /habits/:id', () => {
    const updateHabitDto: UpdateHabitDto = {
      name: 'Updated Habit',
      status: true,
    };

    it('should update a habit', () => {
      return request(app.getHttpServer())
        .patch(`/habits/${testHabitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateHabitDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id', testHabitId);
          expect(res.body.name).toBe(updateHabitDto.name);
          expect(res.body.status).toBe(updateHabitDto.status);
        });
    });

    it('should fail to update a habit with invalid data', () => {
      const invalidUpdateDto = {
        frequency: 'invalid-frequency',
      };

      return request(app.getHttpServer())
        .patch(`/habits/${testHabitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdateDto)
        .expect(400);
    });
  });

  describe('DELETE /habits/:id', () => {
    it('should delete a habit', () => {
      return request(app.getHttpServer())
        .delete(`/habits/${testHabitId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id', testHabitId);
        });
    });

    it('should fail to delete a non-existent habit', () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      return request(app.getHttpServer())
        .delete(`/habits/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
}); 