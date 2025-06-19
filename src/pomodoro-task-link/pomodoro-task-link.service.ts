// src/pomodoro-task-link/pomodoro-task-link.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task, TaskDocument } from 'src/tasks/entities/task.entity';
import { Pomodoro, PomodoroDocument } from 'src/pomodoro/entities/pomodoro.entity';

@Injectable()
export class PomodoroTaskLinkService {
  constructor(
    @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    @InjectModel(Pomodoro.name) private readonly pomodoroModel: Model<PomodoroDocument>,
  ) {}

  async linkPomodoroToTask(pomodoroId: Types.ObjectId, taskId: Types.ObjectId): Promise<void> {
    const pomodoro = await this.pomodoroModel.findById(pomodoroId);
    if (!pomodoro) throw new NotFoundException('Pomodoro not found');

    const task = await this.taskModel.findById(taskId);
    if (!task) throw new NotFoundException('Task not found');

    await this.pomodoroModel.findByIdAndUpdate(pomodoroId, { $set: { task: taskId } });
    await this.taskModel.findByIdAndUpdate(taskId,
      {
        $addToSet: {pomodoros: pomodoroId},
      },
      {new: true});
  }

  async unlinkPomodoroFromTask(pomodoroId: Types.ObjectId): Promise<void> {
    const pomodoro = await this.pomodoroModel.findById(pomodoroId);
    if (!pomodoro) throw new NotFoundException('Pomodoro not found');

    const task = await this.taskModel.findById(pomodoro.task);
    if (!task) throw new NotFoundException('Task not found');

    await this.pomodoroModel.findByIdAndUpdate(pomodoroId, { $set: { task: null } });
    await this.taskModel.findByIdAndUpdate(task._id,
      {
        $pull: {pomodoros: pomodoroId},
      },
      {new: true});
  }
}
