import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/users/entities/user.entity';
import { Model } from 'mongoose';
import * as argon2 from 'argon2';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<User>;

  const testUser = {
    email: 'test@example.com',
    username: 'testuser',
    fullname: 'Test User',
    password: 'password123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
  });

  afterAll(async () => {
    await userModel.deleteMany({});
    await app.close();
  });

  describe('Authentication Flow', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('email', testUser.email);
          expect(res.body).toHaveProperty('username', testUser.username);
          expect(res.body).toHaveProperty('fullname', testUser.fullname);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should not register a user with existing email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send(testUser)
        .expect(400);
    });

    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body).toHaveProperty('refresh_token');
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('message', 'Login successful');
        });
    });

    it('should not login with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should refresh access token with valid refresh token', async () => {
      // First login to get tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      const refreshToken = loginResponse.body.refresh_token;

      // Then try to refresh
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', [`refresh_token=${refreshToken}`])
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('message', 'Token refreshed successfully');
        });
    });

    it('should not refresh with invalid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', ['refresh_token=invalid.token'])
        .expect(401);
    });

    it('should logout successfully', async () => {
      // First login to get tokens
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      const refreshToken = loginResponse.body.refresh_token;

      // Then logout
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', [`refresh_token=${refreshToken}`])
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('success', true);
          expect(res.body).toHaveProperty('message', 'Logged out successfully');
        });
    });

    it('should not logout without refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });
  });

  describe('Password Reset Flow', () => {
    it('should request password reset for existing user', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Password reset code sent to your email');
        });
    });

    it('should not request password reset for non-existent user', () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(404);
    });

    it('should reset password with valid code', async () => {
      // First request reset code
      await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: testUser.email });

      // Get the reset code from the service (this would normally be sent via email)
      const user = await userModel.findOne({ email: testUser.email });
      if (!user) throw new Error('User not found');
      const resetCode = user.resetCode;

      // Then reset password
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          email: testUser.email,
          resetCode,
          newPassword: 'newpassword123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'Password has been reset successfully');
        });
    });

    it('should not reset password with invalid code', () => {
      return request(app.getHttpServer())
        .post('/auth/reset-password')
        .send({
          email: testUser.email,
          resetCode: '000000',
          newPassword: 'newpassword123',
        })
        .expect(401);
    });
  });
}); 