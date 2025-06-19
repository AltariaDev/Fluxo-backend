import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, ValidationPipe, Logger } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ParseMongoIdPipe } from 'src/common/pipes/parse-mongo-id.pipe';
import { GetUser } from 'src/users/decorators/get-user.decorator';
import { User } from 'src/users/entities/user.entity';
import { Task, TaskDocument } from './entities/task.entity';
import mongoose from 'mongoose';
import { PomodoroDocument } from 'src/pomodoro/entities/pomodoro.entity';


@ApiTags('Tasks')
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true}))
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  private readonly logger = new Logger(TasksController.name);

  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  @ApiResponse({ status: 201, description: 'Task successfully created' })
  @ApiResponse({ status: 400, description: 'Invalid data provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @GetUser() user: User
  ): Promise<TaskDocument> 
  {
    return this.tasksService.create(createTaskDto, user.id);
  }

  @Post(':idParent/subtask')
  @ApiOperation({ summary: 'Create a new subtask' })
  @ApiResponse({ status: 201, description: 'Subtask successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 400, description: 'Invalid data provided' })
  async createSubtask(
    @Param('idParent', ParseMongoIdPipe) idParent: mongoose.Types.ObjectId,
    @Body() CreateTaskDto: CreateTaskDto,
    @GetUser() user: User
  ): Promise<TaskDocument> 
  {
    return this.tasksService.createSubtask(idParent, CreateTaskDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all tasks' })
  @ApiResponse({ status: 200, description: 'List of tasks retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async findAll(
    @GetUser() user: User
  ) {
    return this.tasksService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a task by ID' })
  @ApiResponse({ status: 200, description: 'Task successfully retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  @ApiResponse({ status: 400, description: 'Invalid data provided' })
  async findOne(
    @Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId,
    @GetUser() user: User
  ): Promise<TaskDocument>
  {
    return this.tasksService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task by ID' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async update(
    @Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, 
    @Body() updateTaskDto: UpdateTaskDto,
    @GetUser() user: User
  ): Promise<TaskDocument> 
  {
    return this.tasksService.update(id, updateTaskDto, user.id);
  }

  @Patch('/addTags/:id')
  @ApiOperation({ summary: 'Update a task by ID' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async updateTags(
    @Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, 
    @Body() updateTaskDto: UpdateTaskDto,
    @GetUser() user: User
  ): Promise<TaskDocument> 
  {
    return this.tasksService.updateTags(id, updateTaskDto, user.id);
  }

  // @Patch('/addDates/:id')
  // @ApiOperation({ summary: 'Update a task by ID' })
  // @ApiResponse({ status: 200, description: 'Task updated successfully' })
  // @ApiResponse({ status: 400, description: 'Invalid data provided' })
  // @ApiResponse({ status: 401, description: 'Unauthorized access' })
  // @ApiResponse({ status: 404, description: 'Task not found' })
  // async updateDates(
  //   @Param('id', ParseMongoIdPipe) id: string, 
  //   @Body() updateTaskDto: UpdateTaskDto,
  //   @GetUser() user: User
  // ): Promise<TaskDocument> 
  // {
  //   return this.tasksService.updateDates(id, updateTaskDto, user.id);
  // }

  // @Patch('/status/:id')
  // @ApiOperation({ summary: 'Update a task by ID' })
  // @ApiResponse({ status: 200, description: 'Task updated successfully' })
  // @ApiResponse({ status: 400, description: 'Invalid data provided' })
  // @ApiResponse({ status: 401, description: 'Unauthorized access' })
  // @ApiResponse({ status: 404, description: 'Task not found' })
  // async updateStatus(
  //   @Param('id', ParseMongoIdPipe) id: string, 
  //   @Body() updateTaskDto: UpdateTaskDto,
  //   @GetUser() user: User
  // ): Promise<TaskDocument> 
  // {
  //   return this.tasksService.updateStatus(id, updateTaskDto, user.id);
  // }

  @Patch('/softDelete/:id')
  @ApiOperation({ summary: 'Update a task by ID' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid data provided' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async softDelete(
    @Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, 
    @Body() updateTaskDto: UpdateTaskDto,
    @GetUser() user: User): Promise<TaskDocument>
    {    
      return this.tasksService.softDelete(id, user.id);
    }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task by ID' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  remove(
    @Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId,
    @GetUser() user: User
  ): Promise<TaskDocument>
  {
    return this.tasksService.remove(id, user.id);
  }

  @Get('priority/:priority')
  @ApiOperation({ summary: 'Retrieve all tasks by priority' })
  @ApiResponse({ status: 200, description: 'List of tasks retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async getTasksByPriority(@Param('priority') priority: string, @GetUser() user: User): Promise<TaskDocument[]> {
    return this.tasksService.getTasksByPriority(priority, user.id);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Retrieve all tasks by category' })
  @ApiResponse({ status: 200, description: 'List of tasks retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized access' })
  async getTasksByCategory(@Param('category') category: string, @GetUser() user: User): Promise<TaskDocument[]> {
    return this.tasksService.getTasksByCategory(category, user.id);
  }

  // @Get(':idTask/subtasks')
  // @ApiOperation({ summary: 'Retrieve all subtasks by task ID' })
  // @ApiResponse({ status: 200, description: 'List of subtasks retrieved' })
  // @ApiResponse({ status: 401, description: 'Unauthorized access' })
  // async getSubtasks(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @GetUser() user: User): Promise<TaskDocument> {
  //   return this.tasksService.getSubtasks(id, user.id);
  // }

  // @Get('tags/:tags')
  // @ApiOperation({ summary: 'Retrieve all tasks by tags' })
  // @ApiResponse({ status: 200, description: 'List of tasks retrieved' })
  // @ApiResponse({ status: 401, description: 'Unauthorized access' })
  // async getTasksByTags(@Param('tags') tags: string, @GetUser() user: User): Promise<TaskDocument[]> {
  //   // Se espera una cadena de tags separados por comas, por ejemplo: "tag1,tag2,tag3"
  //   const tagsArray = tags.split(',').map(tag => tag.trim());
  //   return this.tasksService.getTasksByTags(tagsArray, user.id);
  // }

  // @Get('category/allCategories')
  // @ApiOperation({ summary: 'Retrieve all categories' })
  // @ApiResponse({ status: 200, description: 'List of categories retrieved' })
  // @ApiResponse({ status: 401, description: 'Unauthorized access' })
  // async findAllCategories(@GetUser() user: User): Promise<string[]> {
  //   return this.tasksService.findAllCategories(user.id);
  // }

  // @Get(':id/pomodoros')
  // @ApiOperation({ summary: 'Retrieve all pomodoros by task ID' })
  // @ApiResponse({ status: 200, description: 'List of pomodoros retrieved' })
  // @ApiResponse({ status: 401, description: 'Unauthorized access' })
  // async getPomodoros(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId, @GetUser() user: User): Promise<PomodoroDocument[]> {
  //   return this.tasksService.getPomodoros(id, user.id);
  // }

  // @Patch(':id/pomodoros/:idPomodoro')
  // @ApiOperation({ summary: 'Update a task by ID' })
  // @ApiResponse({ status: 200, description: 'Task updated successfully' })
  // @ApiResponse({ status: 400, description: 'Invalid data provided' })
  // @ApiResponse({ status: 401, description: 'Unauthorized access' })
  // @ApiResponse({ status: 404, description: 'Task not found' })
  // async updatePomodoros(@Param('id', ParseMongoIdPipe) id: mongoose.Types.ObjectId,
  // @Param('idPomodoro', ParseMongoIdPipe) idPomodoro: mongoose.Types.ObjectId,
  // @GetUser() user: User): Promise<TaskDocument> {
  //   return this.tasksService.updatePomodoros(id, idPomodoro, user.id);
  // }
}
