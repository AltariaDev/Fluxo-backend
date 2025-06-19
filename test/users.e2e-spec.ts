import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestDatabaseModule } from './setup';
import { User, UserSchema } from '../src/users/entities/user.entity';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let configService: ConfigService;
  let testUserId: string;
  let deleteUserId: string;
  let authToken: string;
  let userModel: Model<User>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TestDatabaseModule,
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
    await app.init();

    // Create test user
    const testUser = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        fullname: 'Test User',
        email: 'test@example.com',
        username: 'testuser',
        password: 'Test123!',
      });

    testUserId = testUser.body._id;
    authToken = jwtService.sign({ sub: testUserId });

    // Create user for delete test
    const deleteUser = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        fullname: 'Delete User',
        email: 'delete@example.com',
        username: 'deleteuser',
        password: 'Test123!',
      });

    deleteUserId = deleteUser.body._id;
  });

  afterAll(async () => {
    await userModel.deleteMany({});
    await app.close();
  });

  beforeEach(async () => {
    // Clean up any users created during tests
    await userModel.deleteMany({
      email: { $nin: ['test@example.com', 'delete@example.com'] }
    });
  });

  describe('POST /users', () => {
    it('should create a new user', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullname: 'New User',
          email: 'newuser@example.com',
          username: 'newuser',
          password: 'Test123!',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.fullname).toBe('New User');
          expect(res.body.email).toBe('newuser@example.com');
          expect(res.body.username).toBe('newuser');
        });
    });

    it('should fail with invalid data', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullname: 'Invalid',
          email: 'invalid',
          username: 'in',
          password: '123',
        })
        .expect(400);
    });
  });

  describe('GET /users', () => {
    it('should return all users', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('GET /users/:term', () => {
    it('should return a user by id', () => {
      return request(app.getHttpServer())
        .get(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(testUserId);
        });
    });

    it('should return a user by email', () => {
      return request(app.getHttpServer())
        .get('/users/test@example.com')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe('test@example.com');
        });
    });
  });

  describe('PATCH /users/:id', () => {
    it('should update a user', () => {
      return request(app.getHttpServer())
        .patch(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullname: 'Updated User',
          email: 'test@example.com', // Keep the same email to avoid conflicts
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.fullname).toBe('Updated User');
        });
    });
  });

  describe('DELETE /users/:id', () => {
    it('should delete a user', () => {
      return request(app.getHttpServer())
        .delete(`/users/${deleteUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(deleteUserId);
        });
    });
  });
}); 