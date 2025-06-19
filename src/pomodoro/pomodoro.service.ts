// src/pomodoro/pomodoro.service.ts
import { BadRequestException, ForbiddenException, Inject, Injectable, InternalServerErrorException, Logger, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Pomodoro, PomodoroDocument } from './entities/pomodoro.entity';
import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import * as mongoose from 'mongoose';
import { CreatePomodoroDto } from './dto/create-pomodoro.dto';
import { PomodoroState } from './entities/pomodoro.entity';
import { UserDocument } from 'src/users/entities/user.entity';
import { UpdatePomodoroDto } from './dto/update-pomodoro.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventsList } from 'src/events/list.events';
import { PomodoroGateway } from './pomodoro.gateway';
import { SchedulerRegistry } from '@nestjs/schedule';

@Injectable()
export class PomodoroService {
  private readonly logger = new Logger(PomodoroService.name);

  constructor(
    @InjectModel(Pomodoro.name) private pomodoroModel: Model<PomodoroDocument>,
    @Inject(EventEmitter2) private eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => PomodoroGateway)) private gateway: PomodoroGateway,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  async createPomodoro(createPomodoroDto: CreatePomodoroDto, user: mongoose.Types.ObjectId) : Promise<PomodoroDocument> {
    try {
      const previousPomodoro = await this.pomodoroModel.findOne({userId: user, state: PomodoroState.IDLE});
      if(previousPomodoro) {
        await this.pomodoroModel.findByIdAndUpdate(previousPomodoro._id, {state: PomodoroState.FINISHED});
      }
      
      const pomodoro = await this.pomodoroModel.create({...createPomodoroDto, userId: user});
      this.eventEmitter.emit(EventsList.POMODORO_CREATED, {userId: user, pomodoroId: pomodoro._id, duration: pomodoro.workDuration, cycles: pomodoro.cycles});
      return await pomodoro.populate('task');
    } catch (error) {
      this.logger.error('Error creating pomodoro:', error);
      throw new InternalServerErrorException('Error creating pomodoro');
    }
  }

  async createDefaultPomodoro(user: mongoose.Types.ObjectId) {
    try{
      const pomodoro = await this.pomodoroModel.create({userId: user, workDuration: 25*60, shortBreak: 5*60, longBreak: 15*60, cycles: 4});
      this.eventEmitter.emit(EventsList.POMODORO_CREATED, {userId: user, pomodoroId: pomodoro._id, duration: pomodoro.workDuration, cycles: pomodoro.cycles});
      return this.startPomodoro(pomodoro.id, user);
      //this.gateway.emitStatus(pomodoro);
    } catch (error) {
      this.logger.error('Error creating default pomodoro:', error);
      throw new InternalServerErrorException('Error creating default pomodoro');
    }
  }

  async findAll(user: mongoose.Types.ObjectId) {
    try{
      return this.pomodoroModel.find({userId: user, state: PomodoroState.IDLE}).populate('task');
    } catch (error) {
      this.logger.error('Error finding pomodoros:', error);
      throw new InternalServerErrorException('Error finding pomodoros');
    }
  }

  async findAllNotIdle(user: mongoose.Types.ObjectId) {
    try{
      return await this.pomodoroModel.find({userId: user}).populate('task');

    } catch (error) {
      this.logger.error('Error finding pomodoros:', error);
      throw new InternalServerErrorException('Error finding pomodoros');
    }
  }

  async findWorking(user: mongoose.Types.ObjectId) {
    try{
      return await this.pomodoroModel.findOne({
        userId: user, 
        state: { 
          $in: [
            PomodoroState.WORKING,
            PomodoroState.LONG_BREAK,
            PomodoroState.SHORT_BREAK,
            PomodoroState.IDLE
          ]
        }
      }).populate('task');
    } catch (error) {
      this.logger.error('Error finding pomodoros:', error);
      throw new InternalServerErrorException('Error finding pomodoros');
    }
  }
  
  async startPomodoro(id: mongoose.Types.ObjectId, user: mongoose.Types.ObjectId): Promise<Pomodoro> {
    try{
        const pomodoro = await this.pomodoroModel.findById(id);
      if (!pomodoro) {
        throw new NotFoundException('Pomodoro not found');
      }
      if( !pomodoro.userId.equals(user)) {
        throw new ForbiddenException('You are not allowed to start this pomodoro');
      }
      pomodoro.state = PomodoroState.WORKING;
      pomodoro.remainingTime = pomodoro.workDuration;
      //pomodoro.currentCycle = 1;
      pomodoro.startAt = new Date();
      pomodoro.lastResumedAt = pomodoro.startAt;
      pomodoro.endAt = new Date(pomodoro.startAt.getTime() + pomodoro.workDuration * 1000);
      await pomodoro.save();
      this.eventEmitter.emit(EventsList.POMODORO_STARTED, {userId: user, pomodoroId: pomodoro._id, duration: pomodoro.workDuration, cycles: pomodoro.cycles});
      await pomodoro.populate('task');
      this.gateway.emitStatus(pomodoro);
      this.scheduleNext(id, pomodoro.workDuration);    
      return pomodoro;
    } catch (error) {
      this.logger.error('Error starting pomodoro:', error);
      throw new InternalServerErrorException('Error starting pomodoro');
    }
  }

  async pausePomodoro(id: mongoose.Types.ObjectId, user: mongoose.Types.ObjectId) {
    try{
      const pomodoro = await this.findOne(id, user);
      if(!pomodoro) throw new NotFoundException('Pomodoro not found');
      if(!pomodoro.userId.equals(user)) throw new ForbiddenException('You are not allowed to pause this pomodoro');
      pomodoro.pausedState = PomodoroState.PAUSED;
      pomodoro.interruptions += 1;
      const now = new Date(Date.now());
      const lastResumed = pomodoro.lastResumedAt ?? pomodoro.startAt;
      this.logger.log(lastResumed);
      if (!lastResumed) {
        throw new BadRequestException('Cannot determine last resumed or start time for pause');
      }
      const elapsed = Math.floor((now.getTime() - lastResumed.getTime()) / 1000);
      this.logger.log(elapsed);

      if (pomodoro.remainingTime == null) {
        if (pomodoro.state === PomodoroState.WORKING) {
          pomodoro.remainingTime = Math.max(0, pomodoro.workDuration - elapsed);
        } else if (pomodoro.state === PomodoroState.SHORT_BREAK) {
          pomodoro.remainingTime = Math.max(0, pomodoro.shortBreak - elapsed);
        } else if (pomodoro.state === PomodoroState.LONG_BREAK) {
          pomodoro.remainingTime = Math.max(0, pomodoro.longBreak - elapsed);
        }
      } else {
        pomodoro.remainingTime = Math.max(0, pomodoro.remainingTime - elapsed);
      }

      
      pomodoro.endAt = null;
      //pomodoro.startAt = null;
      pomodoro.lastResumedAt = null;
      await pomodoro.save();
      this.gateway.emitStatus(pomodoro);
      if (this.schedulerRegistry.doesExist('timeout', `pomodoro-${id}`)) {
        this.schedulerRegistry.deleteTimeout(`pomodoro-${id}`);
      }
      return pomodoro;
    } catch (error) {
      this.logger.error('Error pausing pomodoro:', error);
      throw new InternalServerErrorException('Error pausing pomodoro');
    }
  }

  async resumePomodoro(id: mongoose.Types.ObjectId, user: mongoose.Types.ObjectId) {
    try{
      const pomodoro = await this.findOne(id, user);
      if(!pomodoro) throw new NotFoundException('Pomodoro not found');
      if(!pomodoro.userId.equals(user)) throw new ForbiddenException('You are not allowed to resume this pomodoro');
      
      const duration = pomodoro.remainingTime;
      if(duration == null) {
        throw new BadRequestException('Can not resume pomodoro with no remaining time');
      }

      const now = new Date(Date.now());
      pomodoro.pausedState = null;
      //pomodoro.startAt = now;
      pomodoro.lastResumedAt = now;
      pomodoro.endAt = new Date( pomodoro.lastResumedAt.getTime() + duration * 1000);
      //pomodoro.remainingTime = null;

      this.gateway.emitStatus(pomodoro);
      this.scheduleNext(id, duration);
      await pomodoro.save();
      return pomodoro;
    } catch (error) {
      this.logger.error('Error resuming pomodoro:', error);
      throw new InternalServerErrorException('Error resuming pomodoro');
    }
  }

  async stopPomodoro(id: mongoose.Types.ObjectId, user: mongoose.Types.ObjectId) {
    try{
      const pomodoro = await this.findOne(id, user);
      if(!pomodoro) throw new NotFoundException('Pomodoro not found');
      if(!pomodoro.userId.equals(user)) throw new ForbiddenException('You are not allowed to stop this pomodoro');
      pomodoro.state = PomodoroState.FINISHED;
      pomodoro.endAt = new Date( Date.now());
      await pomodoro.save();
      await pomodoro.populate('task');
      this.gateway.emitStatus(pomodoro);
      this.eventEmitter.emit(EventsList.POMODORO_FINISHED, {userId: pomodoro.userId, pomodoroId: pomodoro._id, duration: pomodoro.workDuration, cycles: pomodoro.cycles});
      if (this.schedulerRegistry.doesExist('timeout', `pomodoro-${id}`)) {
        this.schedulerRegistry.deleteTimeout(`pomodoro-${id}`);
      }
      return pomodoro;
    } catch (error) {
      this.logger.error('Error stopping pomodoro:', error);
      throw new InternalServerErrorException('Error stopping pomodoro');
    }
  }

  private scheduleNext(id: mongoose.Types.ObjectId, duration: number) {
    try {
      // Delete existing timeout if it exists
      if (this.schedulerRegistry.doesExist('timeout', `pomodoro-${id}`)) {
        this.schedulerRegistry.deleteTimeout(`pomodoro-${id}`);
      }
  
      const timeout = setTimeout(async () => {
        const pomodoro = await this.pomodoroModel.findById(id);
        if (!pomodoro) return;
  
        const now = new Date(Date.now());
  
        if (pomodoro.state === PomodoroState.WORKING) {
          pomodoro.currentCycle += 1;
  
          if (pomodoro.currentCycle % 4 === 0) {
            pomodoro.state = PomodoroState.LONG_BREAK;
            pomodoro.remainingTime = pomodoro.longBreak;
            pomodoro.startAt = now;
            pomodoro.lastResumedAt = now;
            pomodoro.endAt = new Date(now.getTime() + pomodoro.longBreak * 1000);
          } else {
            pomodoro.state = PomodoroState.SHORT_BREAK;
            pomodoro.remainingTime = pomodoro.shortBreak;
            pomodoro.startAt = now;
            pomodoro.lastResumedAt = now;
            pomodoro.endAt = new Date(now.getTime() + pomodoro.shortBreak * 1000);
          }
        } else if (
          pomodoro.state === PomodoroState.SHORT_BREAK ||
          pomodoro.state === PomodoroState.LONG_BREAK
        ) {
          if (pomodoro.currentCycle >= pomodoro.cycles) {
            pomodoro.state = PomodoroState.COMPLETED;
            pomodoro.remainingTime = null;
            pomodoro.startAt = null;
            pomodoro.lastResumedAt = null;
            pomodoro.endAt = new Date(Date.now());
  
            await pomodoro.save();
            this.gateway.emitStatus(pomodoro);
            this.eventEmitter.emit(EventsList.POMODORO_COMPLETED, {
              userId: pomodoro.userId,
              pomodoroId: pomodoro._id,
              duration: pomodoro.workDuration,
              cycles: pomodoro.cycles,
            });
            return;
          }
  
          pomodoro.state = PomodoroState.WORKING;
          pomodoro.remainingTime = pomodoro.workDuration;
          pomodoro.startAt = now;
          pomodoro.lastResumedAt = now;
          pomodoro.endAt = new Date(now.getTime() + pomodoro.workDuration * 1000);
        }
  
        await pomodoro.save();
        await pomodoro.populate('task');
        this.gateway.emitStatus(pomodoro);
  
        this.scheduleNext(
          id,
          pomodoro.state === PomodoroState.WORKING
            ? pomodoro.workDuration
            : pomodoro.state === PomodoroState.LONG_BREAK
            ? pomodoro.longBreak
            : pomodoro.shortBreak
        );
      }, duration * 1000);
  
      this.schedulerRegistry.addTimeout(`pomodoro-${id}`, timeout);
    } catch (error) {
      this.logger.error('Error scheduling next pomodoro:', error);
      throw new InternalServerErrorException('Error scheduling next pomodoro');
    }
  }
  

  async findOne(id: mongoose.Types.ObjectId, user: mongoose.Types.ObjectId  ) {
    try{
      const pomodoro = await this.pomodoroModel.findById(id);
      if(!pomodoro) throw new NotFoundException('Pomodoro not found');
      if(!pomodoro.userId.equals(user)) throw new ForbiddenException('You are not allowed to access this pomodoro');
      return await pomodoro.populate('task');
    } catch (error) {
      this.logger.error('Error finding pomodoro:', error);
      throw new InternalServerErrorException('Error finding pomodoro');
    }
  }

  async update(id: mongoose.Types.ObjectId, updatePomodoroDto: UpdatePomodoroDto, user: mongoose.Types.ObjectId) {
    try{
      const pomodoro = await this.findOne(id, user);
      if(!pomodoro) throw new NotFoundException('Pomodoro not found');
      if(!pomodoro.userId.equals(user)) throw new ForbiddenException('You are not allowed to update this pomodoro');
      const pomodor_new = await this.pomodoroModel.findByIdAndUpdate(id, updatePomodoroDto, {new: true});
      this.gateway.emitStatus(pomodor_new);
      return pomodor_new;
    } catch (error) {
      this.logger.error('Error updating pomodoro:', error);
      throw new InternalServerErrorException('Error updating pomodoro');
    }
  }

  async reset(id: mongoose.Types.ObjectId, user: mongoose.Types.ObjectId): Promise<Pomodoro> { 
    try{
      await this.schedulerRegistry.deleteTimeout(`pomodoro-${id}`);
      const pomodoro = await this.findOne(id, user);
      if(!pomodoro) throw new NotFoundException('Pomodoro not found');
      if(!pomodoro.userId.equals(user)) throw new ForbiddenException('You are not allowed to reset this pomodoro');
      return this.pomodoroModel.findByIdAndUpdate(id, {state: PomodoroState.IDLE, currentCycle: 0, endAt: null, startAt: null}, {new: true});
    } catch (error) {
      this.logger.error('Error resetting pomodoro:', error);
      throw new InternalServerErrorException('Error resetting pomodoro');
    }
  } 

  async sharePomodoro(id: mongoose.Types.ObjectId, user: mongoose.Types.ObjectId) {
    try{
      const pomodoro = await this.findOne(id, user);
      if(!pomodoro) throw new NotFoundException('Pomodoro not found');
      if(!pomodoro.userId.equals(user)) throw new ForbiddenException('You are not allowed to share this pomodoro');
      return pomodoro;
    } catch (error) {
      this.logger.error('Error sharing pomodoro:', error);
      throw new InternalServerErrorException('Error sharing pomodoro');
    }
  } 
  
}