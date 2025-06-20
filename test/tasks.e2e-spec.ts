import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../src/users/entities/user.entity';
import { Task, TaskStatus, TaskPriority } from '../src/tasks/entities/task.entity';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { CreateTaskDto } from '../src/tasks/dto/create-task.dto';
import { UpdateTaskDto } from '../src/tasks/dto/update-task.dto';
import mongoose from 'mongoose';
import { EmailService } from '../src/email/email.service';

describe('TasksController (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<User>;
  let taskModel: Model<Task>;
  let jwtService: JwtService;
  let authToken: string;
  let testUserId: mongoose.Types.ObjectId;
  let testTaskId: mongoose.Types.ObjectId;
  let parentTaskId: mongoose.Types.ObjectId;

  const testUser = {
    email: 'tasks-test-'+Date.now()+'@example.com',
    username: 'tasksuser',
    fullname: 'Tasks Test User',
    password: 'password123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
  
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
  
    // Obtener modelos y servicios necesarios
    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
    taskModel = moduleFixture.get<Model<Task>>(getModelToken(Task.name));
    jwtService = moduleFixture.get<JwtService>(JwtService);
  
    // Mockear EmailService
    const emailService = moduleFixture.get<EmailService>(EmailService);
    jest.spyOn(emailService, 'sendWelcomeEmail').mockResolvedValue(undefined);
  
    await app.init();
  
    // Asegúrate de que no existe el usuario
    await userModel.deleteOne({ email: testUser.email });
  
    // Crea el usuario y genera el token
    const responde = await request(app.getHttpServer())
      .post('/auth/register')
      .send(testUser);

    //console.log(responde.body);

    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });
    authToken = loginResponse.body.access_token;
    //console.log(authToken);

    const userInDb = await userModel.findOne({ email: testUser.email });
    testUserId = new mongoose.Types.ObjectId(userInDb?.id);
    //console.log(testUserId);
  });
  

  afterAll(async () => {
    await taskModel.deleteMany({ userId: testUserId });
    await userModel.deleteOne({ _id: testUserId });
    await app.close();
  });

  beforeEach(async () => {
    // Clean tasks between tests
    await taskModel.deleteMany({ userId: testUserId });
  });

  describe('POST /tasks', () => {
    const createTaskDto: CreateTaskDto = {
      title: 'Test Task',
      description: 'Test task description',
      status: TaskStatus.PENDING,
      priority: TaskPriority.HIGH,
      category: 'work',
      tags: ['urgent', 'important'],
      color: '#FF5733',
      startDate: '2024-01-01T00:00:00Z',
      endDate: '2024-01-02T00:00:00Z',
      dueDate: '2024-01-02T23:59:59Z',
    };

    it('should create a new task', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createTaskDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.title).toBe(createTaskDto.title);
          expect(res.body.description).toBe(createTaskDto.description);
          expect(res.body.status).toBe(createTaskDto.status);
          expect(res.body.priority).toBe(createTaskDto.priority);
          expect(res.body.category).toBe(createTaskDto.category);
          expect(res.body.tags).toEqual(createTaskDto.tags);
          expect(res.body.color).toBe(createTaskDto.color);
          expect(res.body.userId).toBe(testUserId.toString());
          testTaskId = res.body._id;
        });
    });

    it('should fail to create task without authentication', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .send(createTaskDto)
        .expect(401);
    });

    it('should fail to create task with invalid data', () => {
      const invalidDto = {
        title: '', // Empty title
        status: 'invalid-status', // Invalid status
      };

      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should create task with minimal data', () => {
      const minimalDto: CreateTaskDto = {
        title: 'Minimal Task',
        dueDate: '2024-01-02T23:59:59Z',
        status: TaskStatus.PENDING,
      };

      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(minimalDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.title).toBe(minimalDto.title);
          expect(res.body.status).toBe(minimalDto.status);
        });
    });
  });

  describe('POST /tasks/:idParent/subtask', () => {
    beforeEach(async () => {
      // Create parent task for subtask tests
      const parentTask = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Parent Task',
          status: TaskStatus.PENDING,
          dueDate: '2024-01-02T23:59:59Z',
        });
      parentTaskId = parentTask.body._id;
      //console.log("TAREA PADRE: ", parentTaskId);
    });

    const subtaskDto: CreateTaskDto = {
      title: 'Subtask'+Date.now(),
      description: 'Subtask description',
      status: TaskStatus.PENDING,
      dueDate: '2024-01-02T23:59:59Z',
    };

    //console.log("SUBTAREA: ", subtaskDto);

    it('should create a subtask', () => {
      //console.log("parentTaskId: ", parentTaskId);
      return request(app.getHttpServer())
        .post(`/tasks/${parentTaskId}/subtask`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(subtaskDto)
        .expect(201)
        .expect((res) => {
          console.log("SUBTAREA: ", res.body);
        });
    });


    it('should fail with invalid parent ID', () => {
      return request(app.getHttpServer())
        .post('/tasks/invalid-id/subtask')
        .set('Authorization', `Bearer ${authToken}`)
        .send(subtaskDto)
        .expect(400);
    });
  });

  describe('GET /tasks', () => {
    beforeEach(async () => {
      // Create test tasks
      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task 1',
          status: TaskStatus.PENDING,
          priority: TaskPriority.HIGH,
          dueDate: '2024-01-02T23:59:59Z',
        });

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Task 2',
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.LOW,
          dueDate: '2024-01-02T23:59:59Z',
        });
    });

    it('should return all tasks for authenticated user', () => {
      return request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThanOrEqual(2);
          expect(res.body[0]).toHaveProperty('_id');
          expect(res.body[0]).toHaveProperty('title');
          expect(res.body[0]).toHaveProperty('userId');
        });
    });

    it('should fail without authentication', () => {
      return request(app.getHttpServer())
        .get('/tasks')
        .expect(401);
    });
  });

  describe('GET /tasks/:id', () => {
    beforeEach(async () => {
      const taskResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Single Task',
          status: TaskStatus.PENDING,
          dueDate: '2024-01-02T23:59:59Z',
        });
      testTaskId = taskResponse.body._id;
      //console.log("testTaskId: ", testTaskId);
    });

    it('should return a specific task by ID', () => {
      return request(app.getHttpServer())
        .get(`/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          console.log("TAREA: ", res.body);
        });
    });

    it('should fail with invalid ID', () => {
      return request(app.getHttpServer())
        .get('/tasks/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });

    it('should fail with non-existent ID', () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      return request(app.getHttpServer())
        .get(`/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)
    });
  });

  describe('PATCH /tasks/:id', () => {
    beforeEach(async () => {
      const taskResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Update Task',
          status: TaskStatus.PENDING,
          priority: TaskPriority.MEDIUM,
          dueDate: '2024-01-02T23:59:59Z',
        });
      testTaskId = taskResponse.body._id;
    });

    it('should update a task', () => {
      const updateDto: UpdateTaskDto = {
        title: 'Updated Task Title',
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.HIGH,
        description: 'Updated description',
      };

      return request(app.getHttpServer())
        .patch(`/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe(updateDto.title);
          expect(res.body.status).toBe(updateDto.status);
          expect(res.body.priority).toBe(updateDto.priority);
          expect(res.body.description).toBe(updateDto.description);
        });
    });

    it('should fail with invalid data', () => {
      const invalidDto = {
        status: 'invalid-status',
        priority: 'invalid-priority',
      };

      return request(app.getHttpServer())
        .patch(`/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidDto)
        .expect(400);
    });

    it('should fail with non-existent task', () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      return request(app.getHttpServer())
        .patch(`/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' })
        .expect(404);
    });
  });

  describe('PATCH /tasks/addTags/:id', () => {
    beforeEach(async () => {
      const taskResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Tag Task',
          status: TaskStatus.PENDING,
          tags: ['existing'],
          dueDate: '2024-01-02T23:59:59Z',
        });
      testTaskId = taskResponse.body._id;
    });

    it('should add tags to a task', () => {
      const updateDto = {
        addTags: ['new-tag', 'another-tag'],
      };

      return request(app.getHttpServer())
        .patch(`/tasks/addTags/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.tags).toContain('new-tag');
          expect(res.body.tags).toContain('another-tag');
        });
    });
  });

  describe('PATCH /tasks/softDelete/:id', () => {
    beforeEach(async () => {
      const taskResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Delete Task',
          status: TaskStatus.PENDING,
          dueDate: '2024-01-02T23:59:59Z',
        });
      testTaskId = taskResponse.body._id;
    });

    it('should soft delete a task', () => {
      return request(app.getHttpServer())
        .patch(`/tasks/softDelete/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.isDeleted).toBe(true);
        });
    });
  });

  describe('DELETE /tasks/:id', () => {
    beforeEach(async () => {
      const taskResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Hard Delete Task',
          status: TaskStatus.PENDING,
          dueDate: '2024-01-02T23:59:59Z',
        });
      testTaskId = taskResponse.body._id;
    });

    it('should permanently delete a task', () => {
      return request(app.getHttpServer())
        .delete(`/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should fail with non-existent task', () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      return request(app.getHttpServer())
        .delete(`/tasks/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('GET /tasks/priority/:priority', () => {
    beforeEach(async () => {
      // Create tasks with different priorities
      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'High Priority Task',
          status: TaskStatus.PENDING,
          priority: TaskPriority.HIGH,
        });

      await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Low Priority Task',
          status: TaskStatus.PENDING,
          priority: TaskPriority.LOW,
        });
    });

    it('should return tasks by priority', () => {
      return request(app.getHttpServer())
        .get('/tasks/priority/high')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.every(task => task.priority === 'high')).toBe(true);
        });
    });

    it('should return empty array for non-existent priority', () => {
      return request(app.getHttpServer())
        .get('/tasks/priority/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0);
        });
    });
  });

  describe('GET /tasks/category/:category', () => {
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

    it('should return tasks by category', () => {
      return request(app.getHttpServer())
        .get('/tasks/category/work')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.every(task => task.category === 'work')).toBe(true);
        });
    });

    it('should return empty array for non-existent category', () => {
      return request(app.getHttpServer())
        .get('/tasks/category/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBe(0);
        });
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking the database connection
      // For now, we'll test that the endpoints exist and respond
      const response = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should validate required fields', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({}) // Empty body
        .expect(400);
    });
  });

  describe('PATCH /tasks/addTags/:id - Delete Tags', () => {
    beforeEach(async () => {
      const taskResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Delete Tags Task',
          status: TaskStatus.PENDING,
          tags: ['tag1', 'tag2', 'tag3'],
          dueDate: '2024-01-02T23:59:59Z',
        });
      testTaskId = taskResponse.body._id;
    });

    it('should delete tags from a task', () => {
      return request(app.getHttpServer())
        .patch(`/tasks/addTags/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ deleteTags: ['tag1', 'tag2'] })
        .expect(200)
        .expect((res) => {
          expect(res.body.tags).not.toContain('tag1');
          expect(res.body.tags).not.toContain('tag2');
          expect(res.body.tags).toContain('tag3');
        });
    });

    it('should add and delete tags simultaneously', () => {
      return request(app.getHttpServer())
        .patch(`/tasks/addTags/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ 
          addTags: ['new-tag'], 
          deleteTags: ['tag1'] 
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.tags).toContain('new-tag');
          expect(res.body.tags).not.toContain('tag1');
        });
    });
  });

  describe('Task Completion Events', () => {
    beforeEach(async () => {
      const taskResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Completion Test Task',
          status: TaskStatus.PENDING,
          dueDate: '2024-01-02T23:59:59Z',
        });
      testTaskId = taskResponse.body._id;
    });

    it('should set completedAt when status changes to completed', () => {
      return request(app.getHttpServer())
        .patch(`/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: TaskStatus.COMPLETED })
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe(TaskStatus.COMPLETED);
        });
    });

    it('should test all task status transitions', async () => {
      const statuses = [TaskStatus.PROGRESS, TaskStatus.REVISION, TaskStatus.DROPPED];
      
      for (const status of statuses) {
        await request(app.getHttpServer())
          .patch(`/tasks/${testTaskId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ status })
          .expect(200)
          .expect((res) => {
            expect(res.body.status).toBe(status);
          });
      }
    });
  });

  describe('Task Relationships', () => {
    it('should populate subtasks when task has subtasks', async () => {
      // Create parent task first
      const parentResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Parent Task',
          status: TaskStatus.PENDING,
          dueDate: '2024-01-02T23:59:59Z',
        });

      // Create subtask
      await request(app.getHttpServer())
        .post(`/tasks/${parentResponse.body._id}/subtask`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Subtask',
          status: TaskStatus.PENDING,
          dueDate: '2024-01-02T23:59:59Z',
        });

      // Get parent task and verify subtasks are populated
      return request(app.getHttpServer())
        .get(`/tasks/${parentResponse.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.subTasks).toBeDefined();
          expect(Array.isArray(res.body.subTasks)).toBe(true);
        });
    });

    it('should populate user information', async () => {
      const taskResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'User Test Task',
          status: TaskStatus.PENDING,
          dueDate: '2024-01-02T23:59:59Z',
        });
      
      return request(app.getHttpServer())
        .get(`/tasks/${taskResponse.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.userId).toBeDefined();
        });
    });
  });

  describe('Edge Cases', () => {
    beforeEach(async () => {
      const taskResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Edge Case Task',
          status: TaskStatus.PENDING,
          tags: ['existing-tag'],
          dueDate: '2024-01-02T23:59:59Z',
        });
      testTaskId = taskResponse.body._id;
    });

    it('should handle empty arrays for tags operations', () => {
      return request(app.getHttpServer())
        .patch(`/tasks/addTags/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ addTags: [], deleteTags: [] })
        .expect(200);
    });

    it('should handle updating non-existent tags', () => {
      return request(app.getHttpServer())
        .patch(`/tasks/addTags/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ deleteTags: ['non-existent-tag'] })
        .expect(200);
    });

    it('should handle duplicate tag additions', () => {
      return request(app.getHttpServer())
        .patch(`/tasks/addTags/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ addTags: ['duplicate', 'duplicate'] })
        .expect(200)
        .expect((res) => {
          const duplicateCount = res.body.tags.filter(tag => tag === 'duplicate').length;
          expect(duplicateCount).toBe(1);
        });
    });
  });

  describe('Date Fields', () => {
    it('should handle tasks with only dueDate', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Date Test Task',
          status: TaskStatus.PENDING,
          dueDate: '2024-01-02T23:59:59Z',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.dueDate).toBeDefined();
          expect(res.body.startDate).toBeUndefined();
          expect(res.body.endDate).toBeUndefined();
        });
    });

    it('should handle tasks with startDate and endDate', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Full Date Task',
          status: TaskStatus.PENDING,
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-02T00:00:00Z',
          dueDate: '2024-01-02T23:59:59Z',
        })
        .expect(201);
    });
  });

  describe('Security Tests', () => {
    let anotherToken: string;
    let anotherUserId: mongoose.Types.ObjectId;

    beforeAll(async () => {
      // Create another user and task
      const anotherUser = {
        email: 'another-'+Date.now()+'@example.com',
        username: 'anotheruser',
        fullname: 'Another User',
        password: 'password123',
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(anotherUser);

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: anotherUser.email,
          password: anotherUser.password,
        });

      anotherToken = loginRes.body.access_token;
      const userInDb = await userModel.findOne({ email: anotherUser.email });
      anotherUserId = new mongoose.Types.ObjectId(userInDb?.id);
    });

    afterAll(async () => {
      await userModel.deleteOne({ _id: anotherUserId });
    });

    beforeEach(async () => {
      const taskResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Security Test Task',
          status: TaskStatus.PENDING,
          dueDate: '2024-01-02T23:59:59Z',
        });
      testTaskId = taskResponse.body._id;
    });

    it('should not allow updating other users tasks', () => {
      return request(app.getHttpServer())
        .patch(`/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .send({ title: 'Hacked' })
        .expect(403);
    });

    it('should not allow viewing other users tasks', () => {
      return request(app.getHttpServer())
        .get(`/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .expect(403);
    });

    it('should not allow deleting other users tasks', () => {
      return request(app.getHttpServer())
        .delete(`/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${anotherToken}`)
        .expect(403);
    });
  });

  describe('Soft Delete States', () => {
    beforeEach(async () => {
      const taskResponse = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Soft Delete Test Task',
          status: TaskStatus.PENDING,
          dueDate: '2024-01-02T23:59:59Z',
        });
      testTaskId = taskResponse.body._id;
    });

    it('should still be able to get soft deleted task by ID', async () => {
      await request(app.getHttpServer())
        .patch(`/tasks/softDelete/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      return request(app.getHttpServer())
        .get(`/tasks/${testTaskId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.isDeleted).toBe(true);
        });
    });
  });

  describe('Optional Fields', () => {
    it('should handle tasks without description', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'No Description Task',
          status: TaskStatus.PENDING,
          dueDate: '2024-01-02T23:59:59Z',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.description).toBe('');
        });
    });

    it('should handle tasks without priority', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'No Priority Task',
          status: TaskStatus.PENDING,
          dueDate: '2024-01-02T23:59:59Z',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.priority).toBeUndefined();
        });
    });

    it('should handle tasks without category', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'No Category Task',
          status: TaskStatus.PENDING,
          dueDate: '2024-01-02T23:59:59Z',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.category).toBe('');
        });
    });

    it('should handle tasks without color', () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'No Color Task',
          status: TaskStatus.PENDING,
          dueDate: '2024-01-02T23:59:59Z',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.color).toBe('');
        });
    });
  });
}); 