import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Countdown } from './entities/countdown.entity';
import { CreateCountdownDto } from './dto/create-countdown.dto';
import { TimerStatus } from '../interfaces/timer.interface';
import { SchedulerRegistry } from '@nestjs/schedule';
import { TimerGateway } from '../interfaces/timer.gateway';

@Injectable()
export class CountdownService {
  constructor(
    @InjectModel(Countdown.name) private countdownModel: Model<Countdown>,
    private readonly schedulerRegistry: SchedulerRegistry,
    @Inject(forwardRef(() => TimerGateway)) private readonly timerGateway: TimerGateway,
  ) {}

  async create(userId: string, createCountdownDto: CreateCountdownDto): Promise<Countdown> {
    const countdown = new this.countdownModel({
      ...createCountdownDto,
      userId: new Types.ObjectId(userId),
      status: TimerStatus.STOPPED,
      remainingTime: createCountdownDto.duration,
    });

    const savedCountdown = await countdown.save();
    this.timerGateway.emitStatus(savedCountdown, 'countdown');
    return savedCountdown;
  }

  async findAll(userId: string): Promise<Countdown[]> {
    return this.countdownModel.find({ userId: new Types.ObjectId(userId) }).exec();
  }

  async findOne(userId: string, id: string): Promise<Countdown> {
    const countdown = await this.countdownModel.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    }).exec();

    if (!countdown) {
      throw new NotFoundException('Countdown not found');
    }

    return countdown;
  }

  async start(userId: string, id: string): Promise<Countdown> {
    const countdown = await this.findOne(userId, id);

    if (countdown.status === TimerStatus.RUNNING) {
      return countdown;
    }

    const now = new Date();
    countdown.startedAt = now;
    countdown.status = TimerStatus.RUNNING;

    const updatedCountdown = await countdown.save();
    this.schedulerRegistry.addTimeout(updatedCountdown._id.toString(), updatedCountdown.duration);
    this.timerGateway.emitStatus(updatedCountdown, 'countdown');
    return updatedCountdown;
  }

  async pause(userId: string, id: string): Promise<Countdown> {
    const countdown = await this.findOne(userId, id);

    if (countdown.status !== TimerStatus.RUNNING) {
      return countdown;
    }

    const now = new Date();
    countdown.pausedState = TimerStatus.PAUSED;
    countdown.status = TimerStatus.PAUSED;
    countdown.remainingTime = countdown.duration - (now.getTime() - countdown.startedAt.getTime());

    const updatedCountdown = await countdown.save();
    this.schedulerRegistry.deleteTimeout(updatedCountdown._id.toString());
    this.timerGateway.emitStatus(updatedCountdown, 'countdown');
    return updatedCountdown;
  }

  async resume(userId: string, id: string): Promise<Countdown> {
    const countdown = await this.findOne(userId, id);

    if (countdown.status !== TimerStatus.PAUSED) {
      return countdown;
    }

    const now = new Date();
    countdown.startedAt = now;
    countdown.status = TimerStatus.RUNNING;
    countdown.pausedState = null;

    const updatedCountdown = await countdown.save();
    this.schedulerRegistry.addTimeout(updatedCountdown._id.toString(), updatedCountdown.duration);
    this.timerGateway.emitStatus(updatedCountdown, 'countdown');
    return updatedCountdown;
  }

  async stop(userId: string, id: string): Promise<Countdown> {
    const countdown = await this.findOne(userId, id);

    if (countdown.status === TimerStatus.STOPPED) {
      return countdown;
    }

    countdown.status = TimerStatus.STOPPED;
    countdown.startedAt = null;
    countdown.pausedState = null;
    countdown.remainingTime = countdown.duration;

    const updatedCountdown = await countdown.save();
    this.schedulerRegistry.deleteTimeout(updatedCountdown._id.toString());
    this.timerGateway.emitStatus(updatedCountdown, 'countdown');
    return updatedCountdown;
  }

  async delete(userId: string, id: string): Promise<void> {
    const countdown = await this.findOne(userId, id);
    await this.countdownModel.deleteOne({ _id: countdown._id }).exec();
  }
} 