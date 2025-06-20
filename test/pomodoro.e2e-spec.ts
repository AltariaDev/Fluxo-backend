import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/users/entities/user.entity';
import { Pomodoro } from '../src/pomodoro/entities/pomodoro.entity';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { CreatePomodoroDto } from '../src/pomodoro/dto/create-pomodoro.dto';
import mongoose from 'mongoose';
import { EmailService } from '../src/email/email.service';

describe('PomodoroController (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<User>;
  let pomodoroModel: Model<Pomodoro>;
  let jwtService: JwtService;
  let authToken: string;
  let testUserId: mongoose.Types.ObjectId;
  let testPomodoroId: mongoose.Types.ObjectId;

  const testUser = {
    email: 'pomodoro-test@example.com',
    username: 'pomodorouser',
    fullname: 'Pomodoro Test User',
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
    pomodoroModel = moduleFixture.get<Model<Pomodoro>>(getModelToken(Pomodoro.name));
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
    await pomodoroModel.deleteMany({ userId: testUserId });
    await userModel.deleteOne({ _id: testUserId });
    await app.close();
  });

  beforeEach(async () => {
    // Clean pomodoros between tests
    await pomodoroModel.deleteMany({ userId: testUserId });
  });

  describe('POST /pomodoro/create', () => {
    const createPomodoroDto: CreatePomodoroDto = {
      workDuration: 1500, // 25 minutes
      shortBreak: 300,    // 5 minutes
      longBreak: 900,     // 15 minutes
      cycles: 4,
    };

    it('should create a new pomodoro', () => {
      return request(app.getHttpServer())
        .post('/pomodoro/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createPomodoroDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.workDuration).toBe(createPomodoroDto.workDuration);
          expect(res.body.shortBreak).toBe(createPomodoroDto.shortBreak);
          expect(res.body.longBreak).toBe(createPomodoroDto.longBreak);
          expect(res.body.cycles).toBe(createPomodoroDto.cycles);
          expect(res.body.userId).toBe(testUserId.toString());
          testPomodoroId = res.body._id;
        });
    });

    it('should fail to create pomodoro without authentication', () => {
      return request(app.getHttpServer())
        .post('/pomodoro/create')
        .send(createPomodoroDto)
        .expect(401);
    });

    it('should fail to create pomodoro with invalid data', () => {
      const invalidDto = {
        workDuration: -10, // Invalid negative value
        shortBreak: 'invalid', // Invalid string
      };

      return request(app.getHttpServer())
        .post('/pomodoro/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('POST /pomodoro/default', () => {
    it('should create a default pomodoro', () => {
      return request(app.getHttpServer())
        .post('/pomodoro/default')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body).toHaveProperty('workDuration');
          expect(res.body).toHaveProperty('shortBreak');
          expect(res.body).toHaveProperty('longBreak');
          expect(res.body).toHaveProperty('cycles');
          expect(res.body.userId).toBe(testUserId.toString());
          testPomodoroId = res.body._id;
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .post('/pomodoro/default')
        .expect(401);
    });
  });

  describe('GET /pomodoro', () => {
    beforeEach(async () => {
      // Create test pomodoro for GET tests
      const response = await request(app.getHttpServer())
        .post('/pomodoro/default')
        .set('Authorization', `Bearer ${authToken}`);
      testPomodoroId = response.body._id;
    });

    it('should get all idle pomodoros', () => {
      return request(app.getHttpServer())
        .get('/pomodoro')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/pomodoro')
        .expect(401);
    });
  });

  describe('GET /pomodoro/working', () => {
    it('should get all working pomodoros', () => {
      return request(app.getHttpServer())
        .get('/pomodoro/working')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /pomodoro/@me', () => {
    it('should get all non-idle pomodoros', () => {
      return request(app.getHttpServer())
        .get('/pomodoro/@me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /pomodoro/:id', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/pomodoro/default')
        .set('Authorization', `Bearer ${authToken}`);
      testPomodoroId = response.body._id;
    });

    it('should get a specific pomodoro by ID', () => {
      return request(app.getHttpServer())
        .get(`/pomodoro/${testPomodoroId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(testPomodoroId);
          expect(res.body.userId).toBe(testUserId.toString());
        });
    });

    it('should fail with invalid ID', () => {
      return request(app.getHttpServer())
        .get('/pomodoro/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should fail with non-existent ID', () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      return request(app.getHttpServer())
        .get(`/pomodoro/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /pomodoro/:id/start', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/pomodoro/default')
        .set('Authorization', `Bearer ${authToken}`);
      testPomodoroId = response.body._id;
    });

    it('should start a pomodoro', () => {
      return request(app.getHttpServer())
        .post(`/pomodoro/${testPomodoroId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(testPomodoroId);
        });
    });

    it('should fail with invalid ID', () => {
      return request(app.getHttpServer())
        .post('/pomodoro/invalid-id/start')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('POST /pomodoro/:id/pause', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/pomodoro/default')
        .set('Authorization', `Bearer ${authToken}`);
      testPomodoroId = response.body._id;

      // Start the pomodoro first
      await request(app.getHttpServer())
        .post(`/pomodoro/${testPomodoroId}/start`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should pause a running pomodoro', () => {
      return request(app.getHttpServer())
        .post(`/pomodoro/${testPomodoroId}/pause`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('POST /pomodoro/:id/resume', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/pomodoro/default')
        .set('Authorization', `Bearer ${authToken}`);
      testPomodoroId = response.body._id;

      // Start and pause the pomodoro first
      await request(app.getHttpServer())
        .post(`/pomodoro/${testPomodoroId}/start`)
        .set('Authorization', `Bearer ${authToken}`);
      
      await request(app.getHttpServer())
        .post(`/pomodoro/${testPomodoroId}/pause`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should resume a paused pomodoro', () => {
      return request(app.getHttpServer())
        .post(`/pomodoro/${testPomodoroId}/resume`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('POST /pomodoro/:id/stop', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/pomodoro/default')
        .set('Authorization', `Bearer ${authToken}`);
      testPomodoroId = response.body._id;

      // Start the pomodoro first
      await request(app.getHttpServer())
        .post(`/pomodoro/${testPomodoroId}/start`)
        .set('Authorization', `Bearer ${authToken}`);
    });

    it('should stop a running pomodoro', () => {
      return request(app.getHttpServer())
        .post(`/pomodoro/${testPomodoroId}/stop`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('POST /pomodoro/:id/share', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/pomodoro/default')
        .set('Authorization', `Bearer ${authToken}`);
      testPomodoroId = response.body._id;
    });

    it('should share a pomodoro', () => {
      return request(app.getHttpServer())
        .post(`/pomodoro/${testPomodoroId}/share`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('PATCH /pomodoro/:id', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/pomodoro/default')
        .set('Authorization', `Bearer ${authToken}`);
      testPomodoroId = response.body._id;
    });

    it('should update a pomodoro', () => {
      const updateDto = {
        workDuration: 1800, // 30 minutes
        cycles: 6,
      };

      return request(app.getHttpServer())
        .patch(`/pomodoro/${testPomodoroId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.workDuration).toBe(updateDto.workDuration);
          expect(res.body.cycles).toBe(updateDto.cycles);
        });
    });

    it('should fail with invalid data', () => {
      const invalidDto = {
        workDuration: -100,
      };

      return request(app.getHttpServer())
        .patch(`/pomodoro/${testPomodoroId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('DELETE /pomodoro/:id', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/pomodoro/default')
        .set('Authorization', `Bearer ${authToken}`);
      testPomodoroId = response.body._id;
    });

    it('should delete (reset) a pomodoro', () => {
      return request(app.getHttpServer())
        .delete(`/pomodoro/${testPomodoroId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should fail with non-existent ID', () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      return request(app.getHttpServer())
        .delete(`/pomodoro/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
}); 