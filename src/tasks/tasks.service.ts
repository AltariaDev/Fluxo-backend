import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException, Logger, BadRequestException, HttpException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task, TaskDocument } from './entities/task.entity';
import mongoose, { Model, mongo } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { EventsList } from 'src/events/list.events';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DiscordWebhookService } from '../webhooks/discord-webhook.service';
import { UsersService } from '../users/users.service';
import { PomodoroDocument } from 'src/pomodoro/entities/pomodoro.entity';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    private eventEmitter: EventEmitter2,
    private readonly discordWebhookService: DiscordWebhookService,
    private readonly usersService: UsersService,
  ) {}

  async create(createTaskDto: CreateTaskDto, userId: mongoose.Types.ObjectId) {
    try {
      const task = await this.taskModel.create({
        ...createTaskDto,
        userId: userId,
      });
      this.eventEmitter.emit(EventsList.TASK_CREATED, {userId: userId, taskId: task._id});
      
      return task;
    } catch (error) {
      console.error('Error creating task:', error);
      throw new InternalServerErrorException('Error creating task');
    }
  }
  // private async checkTaskDates(date: Date): Promise<boolean> {
  //   const allTasks = await this.taskModel.find({});
  //   return allTasks.some(task => {
  //     const taskDate = new Date(task.dueDate);
  //     return taskDate.toDateString() === date.toDateString();
  //   });
    
  // }

  async findAll(userId: mongoose.Types.ObjectId): Promise<TaskDocument[]> {
    try {
      return await this.taskModel.find({userId: userId});
    }catch (error) {
      throw new InternalServerErrorException('Error getting tasks');
    }
  }

  async findOne(id: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<TaskDocument> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid task ID');
      const task = await this.taskModel.findById(id);
      if (!task) throw new NotFoundException('Task not found');
      if (!task.userId.equals(userId)) throw new ForbiddenException('Unauthorized access');
      if(task.subTasks.length > 0) {
        await task.populate('subTasks');
      }
      if(task.pomodoros.length > 0) {
        await task.populate('pomodoros');
      }
      return task.populate('userId');
    }catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('Error getting task:', error);
      throw new InternalServerErrorException('Error getting task');
    }
  }

  async update(id: mongoose.Types.ObjectId, updateTaskDto: UpdateTaskDto, userId: mongoose.Types.ObjectId): Promise<TaskDocument> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid task ID');
      const task = await this.taskModel.findById(id);
      if (!task) throw new NotFoundException('Task not found');
      if (!task.userId.equals(userId)) throw new ForbiddenException('Unauthorized access');
      const statusInit = task.status
      if (updateTaskDto.addTags || updateTaskDto.deleteTags) {
        await this.updateTags(id, updateTaskDto, userId);
        updateTaskDto.addTags = null;
        updateTaskDto.deleteTags = null;
      }
      const updatedTask = await this.taskModel.findByIdAndUpdate(id,
        {
          ...updateTaskDto,
        },
        {new: true});
      if (statusInit != 'completed' && updateTaskDto.status === 'completed') {
        this.eventEmitter.emit(EventsList.TASK_COMPLETED, {userId: userId, taskId: task._id});
        await this.taskModel.findByIdAndUpdate(id, {completedAt: new Date()}, {new: true});
      }
      return updatedTask;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('Error updating task:', error);
      throw new InternalServerErrorException('Error updating task');
    }
  }

  async updateTags(id: mongoose.Types.ObjectId, updateTaskDto: UpdateTaskDto, userId: mongoose.Types.ObjectId): Promise<TaskDocument> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid task ID');
      const task = await this.taskModel.findById(id);
      if (!task) throw new NotFoundException('Task not found');
      if (!task.userId.equals(userId)) throw new ForbiddenException('Unauthorized access');
      if (updateTaskDto.addTags) {
        await this.taskModel.findByIdAndUpdate(id,
          {
            $addToSet: {tags: { $each: updateTaskDto.addTags }},
          },
          {new: true});
      }
      if (updateTaskDto.deleteTags) {
        await this.taskModel.findByIdAndUpdate
        (id, { $pull: {tags: { $in: updateTaskDto.deleteTags }}}, {new: true});
      }
      return (await this.findOne(id, userId));
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('Error updating task tags:', error);
      throw new InternalServerErrorException('Error updating task tags');
    }
  }

  async softDelete(id: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<TaskDocument> {
    try {
      const task = await this.taskModel.findById(id);
      if (!task) throw new NotFoundException('Task not found');
      if (!task.userId.equals(userId)) throw new ForbiddenException('Unauthorized access');
      await this.taskModel.findByIdAndUpdate(id, {isDeleted: true}, {new: true});
      this.eventEmitter.emit(EventsList.TASK_DELETED, {userId: userId, taskId: task._id});
      return (await this.findOne(id, userId)).populate('userId');
    } catch (error) {
      throw new InternalServerErrorException('Error deleting task');
    }
  }

  
  async remove(id: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<TaskDocument> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid task ID');
      const task = await this.taskModel.findById(id);
      if (!task) throw new NotFoundException('Task not found');
      if (!task.userId.equals(userId)) throw new ForbiddenException('Unauthorized access');
      this.eventEmitter.emit(EventsList.TASK_DELETED, {userId: userId, taskId: task._id});
      return this.taskModel.findByIdAndDelete(id);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      console.error('Error deleting task:', error);
      throw new InternalServerErrorException('Error deleting task');
    }
  }

  async createSubtask(id: mongoose.Types.ObjectId, subtask: CreateTaskDto, userId: mongoose.Types.ObjectId): Promise<TaskDocument> {
    try {
      const task = await this.taskModel.findById(id);
      if (!task) throw new NotFoundException('Task not found');
      if (!task.userId.equals(userId)) throw new ForbiddenException('Unauthorized access');
      const newSubtask = await this.taskModel.create({
        ...subtask,
        userId, 
      });
      const parentTask = await this.taskModel.findByIdAndUpdate(id, { $addToSet: {subTasks: newSubtask._id}}, {new: true});
      if (!parentTask) throw new ForbiddenException('Parent task not found or not owned by user');
      return parentTask.populate('subTasks');
    } catch (error) {
      throw new InternalServerErrorException('Error creating subtask');
    }
  }

  // async getSubtasks(id: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<TaskDocument> {
  //   try {
  //     const task = await this.taskModel.findById(id);
  //     if (!task) throw new NotFoundException('Task not found');
  //     if (!task.userId.equals(userId)) throw new ForbiddenException('Unauthorized access');
  //     return task.populate('subtasks');
  //   } catch (error) {
  //     throw new InternalServerErrorException('Error getting subtasks');
  //   }
  // }

  // async getTasksByTags(tagsArray: string[] ,userId: mongoose.Types.ObjectId): Promise<TaskDocument[]> {
  //   try {
  //     const tasks = await this.taskModel.find({tags: tagsArray, userId});
  //     return tasks;
  //   } catch (error) {
  //     throw new InternalServerErrorException('Error getting tasks by tags');
  //   }
  // }

  async getTasksByPriority(priority: string, userId: mongoose.Types.ObjectId): Promise<TaskDocument[]> {
    try {
      const tasks = await this.taskModel.find({priority, userId});
      return tasks;
    } catch (error) {
      throw new InternalServerErrorException('Error getting tasks by priority');
    }
  }

  async getTasksByCategory(category: string, userId: mongoose.Types.ObjectId): Promise<TaskDocument[]> {
    try {
      const tasks = await this.taskModel.find({category, userId});
      return tasks;
    } catch (error) {
      throw new InternalServerErrorException('Error getting tasks by category');
    }
  }

  async getPomodoros(id: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<PomodoroDocument[]> {
    try {
      const task = await this.taskModel.findById(id);
      if (!task) throw new NotFoundException('Task not found');
      if (!task.userId.equals(userId)) throw new ForbiddenException('Unauthorized access');
      return task.populate('pomodoros');
    } catch (error) {
      throw new InternalServerErrorException('Error getting pomodoros');
    }
  }

  async updatePomodoros(id: mongoose.Types.ObjectId, idPomodoro: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<TaskDocument> {
    try {
      const task = await this.taskModel.findById(id);
      if (!task) throw new NotFoundException('Task not found');
      if (!task.userId.equals(userId)) throw new ForbiddenException('Unauthorized access');
      await this.taskModel.findByIdAndUpdate(id,
        {
          $addToSet: {pomodoros: idPomodoro},
        },
        {new: true});
      return task.populate('pomodoros');
    } catch (error) {
      throw new InternalServerErrorException('Error updating pomodoros');
    }
  }

  // async findAllCategories(userId: mongoose.Types.ObjectId): Promise<string[]> {
  //     const tasks = await this.taskModel.aggregate([
  //       {
  //         $match: { user: userId },
  //       },
  //       {
  //         $project: {
  //           categories: {
  //             $setUnion: [
  //               { $map: { input: "$tasks", as: "task", in: "$$task.category" } },
  //             ],
  //           },
  //         },
  //       },
  //     ]);
  
  //     return tasks.length > 0 ? tasks[0].categories : [];
  //   }
}
