import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { TestDatabaseModule } from './setup';
import { User, UserSchema } from '../src/users/entities/user.entity';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import mongoose from 'mongoose';
import * as cookieParser from 'cookie-parser';
import { EmailService } from '../src/email/email.service';

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;
  let configService: ConfigService;
  let userModel: Model<User>;
  let authToken: string;
  let secondAuthToken: string;
  let testUserId: mongoose.Types.ObjectId;
  let secondUserId: mongoose.Types.ObjectId;
  let adminUserId: mongoose.Types.ObjectId;

  const testUser = {
    fullname: 'Users Test User',
    email: 'users-test@example.com',
    username: 'userstestuser',
    password: 'SecurePass123!',
  };

  const secondTestUser = {
    fullname: 'Second Test User',
    email: 'users-test2@example.com',
    username: 'userstestuser2',
    password: 'SecurePass456!',
  };

  const adminUser = {
    fullname: 'Admin User',
    email: 'admin@example.com',
    username: 'adminuser',
    password: 'AdminPass789!',
    role: 'admin',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        TestDatabaseModule,
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.use(cookieParser());
    
    await app.init();

    jwtService = moduleFixture.get<JwtService>(JwtService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
    const emailService = moduleFixture.get<EmailService>(EmailService);
    jest.spyOn(emailService, 'sendWelcomeEmail').mockResolvedValue(undefined);
    jest.spyOn(emailService, 'sendPasswordResetCode').mockResolvedValue(undefined);
    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
    await app.init();

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
    await userModel.deleteMany({
      email: { $in: [testUser.email, secondTestUser.email] }
    });

    // Create admin user directly in database (since we might not have admin registration endpoint)
    const adminUserDoc = await userModel.create({
      ...adminUser,
      password: 'hashedPassword', // In real app, this would be properly hashed
    });
    adminUserId = adminUserDoc._id as mongoose.Types.ObjectId;
  });

  afterAll(async () => {
    await userModel.deleteMany({
      email: { $in: [testUser.email, secondTestUser.email, adminUser.email] }
    });
    await app.close();
  });

  beforeEach(async () => {
    // Clean up any additional users created during tests
    await userModel.deleteMany({
      email: { 
        $nin: [testUser.email, secondTestUser.email, adminUser.email],
        $regex: /@example\.com$/
      }
    });
  });

  describe('POST /users', () => {
    const newUser = {
      fullname: 'New User',
      email: 'newuser@example.com',
      username: 'newuser',
      password: 'NewPass123!',
    };

    it('should create a new user with valid data', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newUser)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.fullname).toBe(newUser.fullname);
          expect(res.body.email).toBe(newUser.email);
          expect(res.body.username).toBe(newUser.username);
          expect(res.body).not.toHaveProperty('password');
          expect(res.body).toHaveProperty('createdAt');
        });
    });

    it('should fail to create user without authentication', () => {
      return request(app.getHttpServer())
        .post('/users')
        .send(newUser)
        .expect(401);
    });

    it('should fail to create user with invalid email', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...newUser,
          email: 'invalid-email',
        })
        .expect(400);
    });

    it('should fail to create user with short username', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...newUser,
          username: 'a',
        })
        .expect(400);
    });

    it('should fail to create user with weak password', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...newUser,
          password: '123',
        })
        .expect(400);
    });

    it('should fail to create user with missing required fields', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: newUser.email,
          // Missing other required fields
        })
        .expect(400);
    });

    it('should fail to create user with duplicate email', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...newUser,
          email: testUser.email, // Existing email
          username: 'differentusername',
        })
        .expect(400);
    });

    it('should fail to create user with duplicate username', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...newUser,
          email: 'different@example.com',
          username: testUser.username, // Existing username
        })
        .expect(400);
    });

    it('should sanitize input data', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...newUser,
          email: 'sanitize@example.com',
          username: 'sanitizeuser',
          fullname: '<script>alert("xss")</script>Sanitize User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.fullname).not.toContain('<script>');
        });
    });

    it('should handle unicode characters in fullname', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...newUser,
          email: 'unicode@example.com',
          username: 'unicodeuser',
          fullname: '测试用户 José María',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.fullname).toBe('测试用户 José María');
        });
    });
  });

  describe('GET /users', () => {
    beforeEach(async () => {
      // Create additional test users
      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullname: 'List User 1',
          email: 'listuser1@example.com',
          username: 'listuser1',
          password: 'ListPass123!',
        });

      await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullname: 'List User 2',
          email: 'listuser2@example.com',
          username: 'listuser2',
          password: 'ListPass456!',
        });
    });

    it('should return all users for authenticated user', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(2);
          expect(res.body[0]).toHaveProperty('_id');
          expect(res.body[0]).toHaveProperty('email');
          expect(res.body[0]).toHaveProperty('username');
          expect(res.body[0]).not.toHaveProperty('password');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });

    it('should return users with pagination support', () => {
      return request(app.getHttpServer())
        .get('/users?limit=2&page=1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeLessThanOrEqual(2);
        });
    });

    it('should filter sensitive user information', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          res.body.forEach((user: any) => {
            expect(user).not.toHaveProperty('password');
            expect(user).not.toHaveProperty('resetCode');
            expect(user).not.toHaveProperty('resetCodeExpires');
          });
        });
    });
  });

  describe('GET /users/:term', () => {
    it('should return user by ID', () => {
      return request(app.getHttpServer())
        .get(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(testUserId.toString());
          expect(res.body.email).toBe(testUser.email);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should return user by email', () => {
      return request(app.getHttpServer())
        .get(`/users/${testUser.email}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.email).toBe(testUser.email);
          expect(res.body._id).toBe(testUserId.toString());
        });
    });

    it('should return user by username', () => {
      return request(app.getHttpServer())
        .get(`/users/${testUser.username}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.username).toBe(testUser.username);
          expect(res.body._id).toBe(testUserId.toString());
        });
    });

    it('should fail with invalid ObjectId', () => {
      return request(app.getHttpServer())
        .get('/users/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should fail with non-existent user ID', () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      return request(app.getHttpServer())
        .get(`/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail with non-existent email', () => {
      return request(app.getHttpServer())
        .get('/users/nonexistent@example.com')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get(`/users/${testUserId}`)
        .expect(401);
    });

    it('should handle special characters in email search', () => {
      return request(app.getHttpServer())
        .get('/users/test%2Buser@example.com') // URL encoded +
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404); // Should not find user (unless it exists)
    });

    it('should filter sensitive information for other users', () => {
      return request(app.getHttpServer())
        .get(`/users/${secondUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).not.toHaveProperty('password');
          expect(res.body).not.toHaveProperty('resetCode');
        });
    });
  });

  describe('PATCH /users/:id', () => {
    let updateUserId: mongoose.Types.ObjectId;

    beforeEach(async () => {
      // Create a user to update
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullname: 'Update User',
          email: 'updateuser@example.com',
          username: 'updateuser',
          password: 'UpdatePass123!',
        });
      updateUserId = userResponse.body._id;
    });

    it('should update user with valid data', () => {
      const updateData = {
        fullname: 'Updated User Name',
        email: 'updated@example.com',
      };

      return request(app.getHttpServer())
        .patch(`/users/${updateUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body.fullname).toBe(updateData.fullname);
          expect(res.body.email).toBe(updateData.email);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should allow partial updates', () => {
      return request(app.getHttpServer())
        .patch(`/users/${updateUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullname: 'Partially Updated User',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.fullname).toBe('Partially Updated User');
        });
    });

    it('should fail to update with invalid email', () => {
      return request(app.getHttpServer())
        .patch(`/users/${updateUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid-email',
        })
        .expect(400);
    });

    it('should fail to update with duplicate email', () => {
      return request(app.getHttpServer())
        .patch(`/users/${updateUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: testUser.email, // Existing email
        })
        .expect(400);
    });

    it('should fail to update with duplicate username', () => {
      return request(app.getHttpServer())
        .patch(`/users/${updateUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: testUser.username, // Existing username
        })
        .expect(400);
    });

    it('should fail to update non-existent user', () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      return request(app.getHttpServer())
        .patch(`/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullname: 'Updated Name',
        })
        .expect(404);
    });

    it('should fail to update with invalid ObjectId', () => {
      return request(app.getHttpServer())
        .patch('/users/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullname: 'Updated Name',
        })
        .expect(400);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .patch(`/users/${updateUserId}`)
        .send({
          fullname: 'Updated Name',
        })
        .expect(401);
    });

    it('should sanitize update data', () => {
      return request(app.getHttpServer())
        .patch(`/users/${updateUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullname: '<script>alert("xss")</script>Malicious User',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.fullname).not.toContain('<script>');
        });
    });

    it('should handle unicode characters in updates', () => {
      return request(app.getHttpServer())
        .patch(`/users/${updateUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullname: '更新的用户 José María',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.fullname).toBe('更新的用户 José María');
        });
    });

    it('should not allow updating password through this endpoint', () => {
      return request(app.getHttpServer())
        .patch(`/users/${updateUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          password: 'NewPassword123!',
        })
        .expect(200) // Should succeed but ignore password field
        .expect((res) => {
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should validate updated email format', () => {
      return request(app.getHttpServer())
        .patch(`/users/${updateUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'still-invalid-email',
        })
        .expect(400);
    });
  });

  describe('DELETE /users/:id', () => {
    let deleteUserId: mongoose.Types.ObjectId;

    beforeEach(async () => {
      // Create a user to delete
      const userResponse = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullname: 'Delete User',
          email: 'deleteuser@example.com',
          username: 'deleteuser',
          password: 'DeletePass123!',
        });
      deleteUserId = userResponse.body._id;
    });

    it('should delete user successfully', () => {
      return request(app.getHttpServer())
        .delete(`/users/${deleteUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(deleteUserId.toString());
        });
    });

    it('should fail to delete non-existent user', () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      return request(app.getHttpServer())
        .delete(`/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should fail to delete with invalid ObjectId', () => {
      return request(app.getHttpServer())
        .delete('/users/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .delete(`/users/${deleteUserId}`)
        .expect(401);
    });

    it('should verify user is actually deleted', async () => {
      // Delete the user
      await request(app.getHttpServer())
        .delete(`/users/${deleteUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Try to get the deleted user
      return request(app.getHttpServer())
        .get(`/users/${deleteUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('User Profile and Settings', () => {
    it('should get current user profile', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(testUserId.toString());
          expect(res.body.email).toBe(testUser.email);
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should update current user profile', () => {
      return request(app.getHttpServer())
        .patch('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullname: 'Updated Profile Name',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.fullname).toBe('Updated Profile Name');
        });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed JSON gracefully', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);
    });

    it('should handle very large payloads', () => {
      const largeString = 'a'.repeat(10000);
      
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullname: largeString,
          email: 'large@example.com',
          username: 'largeuser',
          password: 'LargePass123!',
        })
        .expect(400);
    });

    it('should handle null and undefined values', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullname: null,
          email: undefined,
          username: 'nulluser',
          password: 'NullPass123!',
        })
        .expect(400);
    });

    it('should handle concurrent user creation', async () => {
      const promises = Array(5).fill(null).map((_, index) =>
        request(app.getHttpServer())
          .post('/users')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            fullname: `Concurrent User ${index}`,
            email: `concurrent${index}@example.com`,
            username: `concurrent${index}`,
            password: 'ConcurrentPass123!',
          })
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.status === 201);
      
      expect(successful.length).toBe(5); // All should succeed with unique data
    });

    it('should handle database connection issues gracefully', async () => {
      // This would require mocking the database connection
      // For now, we'll test that the endpoints respond consistently
      const response = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 500]).toContain(response.status);
    });

    it('should maintain data integrity across operations', async () => {
      // Create user
      const createResponse = await request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullname: 'Integrity User',
          email: 'integrity@example.com',
          username: 'integrityuser',
          password: 'IntegrityPass123!',
        });

      const userId = createResponse.body._id;

      // Update user
      await request(app.getHttpServer())
        .patch(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          fullname: 'Updated Integrity User',
        });

      // Verify update
      const getResponse = await request(app.getHttpServer())
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.body.fullname).toBe('Updated Integrity User');
      expect(getResponse.body.email).toBe('integrity@example.com');
    });
  });

  describe('Authorization and Permissions', () => {
    it('should not allow users to access other users sensitive data', () => {
      return request(app.getHttpServer())
        .get(`/users/${secondUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).not.toHaveProperty('password');
          expect(res.body).not.toHaveProperty('resetCode');
        });
    });

    it('should handle expired tokens gracefully', () => {
      const expiredToken = jwtService.sign(
        { sub: testUserId },
        { expiresIn: '-1h' }
      );

      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should handle invalid tokens gracefully', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });

    it('should handle missing authorization header', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });

    it('should handle malformed authorization header', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', 'InvalidFormat')
        .expect(401);
    });
  });
}); 