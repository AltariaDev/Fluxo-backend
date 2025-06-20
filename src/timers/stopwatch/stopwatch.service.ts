import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Stopwatch } from './entities/stopwatch.entity';
import { CreateStopwatchDto } from './dto/create-stopwatch.dto';
import { TimerStatus } from '../interfaces/timer.interface';
import { TimerGateway } from '../interfaces/timer.gateway';

@Injectable()
export class StopwatchService {
  constructor(
    @InjectModel(Stopwatch.name) private stopwatchModel: Model<Stopwatch>,
    @Inject(forwardRef(() => TimerGateway)) private readonly timerGateway: TimerGateway,
  ) {}

  async create(userId: string, createStopwatchDto: CreateStopwatchDto): Promise<Stopwatch> {
    const stopwatch = new this.stopwatchModel({
      ...createStopwatchDto,
      userId: new Types.ObjectId(userId),
      status: TimerStatus.STOPPED,
      elapsedTime: 0,
      totalElapsedTime: 0,
    });

    const savedStopwatch = await stopwatch.save();
    this.timerGateway.emitStatus(savedStopwatch, 'stopwatch');
    return savedStopwatch;
  }

  async findAll(userId: string): Promise<Stopwatch[]> {
    return this.stopwatchModel.find({ userId: new Types.ObjectId(userId) }).exec();
  }

  async findOne(userId: string, id: string): Promise<Stopwatch> {
    const stopwatch = await this.stopwatchModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    }).exec();

    if (!stopwatch) {
      throw new NotFoundException('Stopwatch not found');
    }

    return stopwatch;
  }

  async start(userId: string, id: string): Promise<Stopwatch> {
    const stopwatch = await this.findOne(userId, id);

    if (stopwatch.status === TimerStatus.RUNNING) {
      return stopwatch;
    }

    const now = new Date();
    stopwatch.startedAt = now;
    stopwatch.status = TimerStatus.RUNNING;

    const updatedStopwatch = await stopwatch.save();
    this.timerGateway.emitStatus(updatedStopwatch, 'stopwatch');
    return updatedStopwatch;
  }

  async pause(userId: string, id: string): Promise<Stopwatch> {
    const stopwatch = await this.findOne(userId, id);

    if (stopwatch.status !== TimerStatus.RUNNING) {
      return stopwatch;
    }

    const now = new Date();
    stopwatch.pausedAt = now;
    stopwatch.status = TimerStatus.PAUSED;
    stopwatch.elapsedTime += now.getTime() - stopwatch.startedAt.getTime();
    stopwatch.totalElapsedTime = stopwatch.elapsedTime;

    const updatedStopwatch = await stopwatch.save();
    this.timerGateway.emitStatus(updatedStopwatch, 'stopwatch');
    return updatedStopwatch;
  }

  async resume(userId: string, id: string): Promise<Stopwatch> {
    const stopwatch = await this.findOne(userId, id);

    if (stopwatch.status !== TimerStatus.PAUSED) {
      return stopwatch;
    }

    const now = new Date();
    stopwatch.startedAt = now;
    stopwatch.status = TimerStatus.RUNNING;
    stopwatch.pausedAt = null;

    const updatedStopwatch = await stopwatch.save();
    this.timerGateway.emitStatus(updatedStopwatch, 'stopwatch');
    return updatedStopwatch;
  }

  async stop(userId: string, id: string): Promise<Stopwatch> {
    const stopwatch = await this.findOne(userId, id);

    if (stopwatch.status === TimerStatus.STOPPED) {
      return stopwatch;
    }

    stopwatch.status = TimerStatus.STOPPED;
    stopwatch.startedAt = null;
    stopwatch.pausedAt = null;
    stopwatch.elapsedTime = 0;
    stopwatch.totalElapsedTime = 0;

    const updatedStopwatch = await stopwatch.save();
    this.timerGateway.emitStatus(updatedStopwatch, 'stopwatch');
    return updatedStopwatch;
  }

  async delete(userId: string, id: string): Promise<void> {
    const stopwatch = await this.findOne(userId, id);
    await this.stopwatchModel.deleteOne({ _id: stopwatch._id }).exec();
  }
} 