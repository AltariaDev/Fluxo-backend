import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { Timer, TimerDocument } from "./entities/timer.entity";
import { StartTimerDto, UpdateTimerDto } from "./dto/index";

@Injectable()
export class TimerService {
  private readonly logger = new Logger(TimerService.name);

  constructor(@InjectModel(Timer.name) private timerModel: Model<TimerDocument>) {}

  async startTimer(
    startTimerDto: StartTimerDto,
    userId: mongoose.Types.ObjectId,
  ): Promise<TimerDocument> {
    try {
      this.logger.debug(`Starting timer for user ${userId}: ${startTimerDto.title}`);
      
      const timer = new this.timerModel({
        ...startTimerDto,
        user: userId,
        isRunning: true,
        startTime: new Date(),
        status: 'pending',
        task: startTimerDto.task? new mongoose.Types.ObjectId(startTimerDto.task) : undefined,
      });
  
      return await timer.save();
    } catch (error) {
      this.logger.error(`Error starting timer: ${error.message}`);
      throw new InternalServerErrorException("Error starting timer.");
    }
  }

  async updateTimer(
    id: mongoose.Types.ObjectId,
    updateTimerDto: UpdateTimerDto,
    userId: mongoose.Types.ObjectId,
  ): Promise<TimerDocument> {
    try {
      const timer = await this.timerModel.findById(id);
      
      if (!timer) {
        throw new NotFoundException("Timer not found.");
      }
      
      if (!timer.user.equals(userId)) {
        throw new UnauthorizedException("Unauthorized user.");
      }

      const updatedTimer = await this.timerModel.findByIdAndUpdate(
        id,
        updateTimerDto,
        { new: true }
      );

      return updatedTimer;
    } catch (error) {
      this.logger.error(`Error updating timer: ${error.message}`);
      throw new InternalServerErrorException("Error updating timer.");
    }
  }

  async updateElapsedTime(id: mongoose.Types.ObjectId): Promise<TimerDocument> {
    try {
      const timer = await this.timerModel.findById(id);
      
      if (!timer) {
        throw new NotFoundException("Timer not found.");
      }
      
      if (!timer.isRunning || !timer.startTime) {
        return timer;
      }

      // Calculate elapsed time since last update
      const now = new Date();
      const elapsedSinceStart = Math.floor((now.getTime() - timer.startTime.getTime()) / 1000);
      
      // Update the timer with the new elapsed time
      const updatedTimer = await this.timerModel.findByIdAndUpdate(
        id,
        { elapsedTime: elapsedSinceStart },
        { new: true }
      );

      return updatedTimer;
    } catch (error) {
      this.logger.error(`Error updating elapsed time: ${error.message}`);
      throw new InternalServerErrorException("Error updating elapsed time.");
    }
  }

  async pauseTimer(id: string): Promise<TimerDocument> {
    try {
      const timerId = new mongoose.Types.ObjectId(id);
      const timer = await this.timerModel.findById(timerId);
      
      if (!timer) {
        throw new NotFoundException("Timer not found.");
      }
      
      if (!timer.isRunning) {
        return timer;
      }

      // Calculate final elapsed time
      const now = new Date();
      const elapsedSinceStart = Math.floor((now.getTime() - timer.startTime.getTime()) / 1000);
      
      // Update the timer to paused state
      const updatedTimer = await this.timerModel.findByIdAndUpdate(
        timerId,
        { 
          isRunning: false,
          elapsedTime: elapsedSinceStart,
          startTime: null
        },
        { new: true }
      );

      return updatedTimer;
    } catch (error) {
      this.logger.error(`Error pausing timer: ${error.message}`);
      throw new InternalServerErrorException("Error pausing timer.");
    }
  }

  async resumeTimer(id: string): Promise<TimerDocument> {
    try {
      const timerId = new mongoose.Types.ObjectId(id);
      const timer = await this.timerModel.findById(timerId);
      
      if (!timer) {
        throw new NotFoundException("Timer not found.");
      }
      
      if (timer.isRunning) {
        return timer;
      }

      // Update the timer to running state with a new start time
      const updatedTimer = await this.timerModel.findByIdAndUpdate(
        timerId,
        { 
          isRunning: true,
          startTime: new Date()
        },
        { new: true }
      );

      return updatedTimer;
    } catch (error) {
      this.logger.error(`Error resuming timer: ${error.message}`);
      throw new InternalServerErrorException("Error resuming timer.");
    }
  }

  async stopTimer(id: string, notes?: string): Promise<TimerDocument> {
    try {
      const timerId = new mongoose.Types.ObjectId(id);
      const timer = await this.timerModel.findById(timerId);
      
      if (!timer) {
        throw new NotFoundException("Timer not found.");
      }

      // Calculate final elapsed time if timer was running
      let finalElapsedTime = timer.elapsedTime;
      if (timer.isRunning && timer.startTime) {
        const now = new Date();
        finalElapsedTime = Math.floor((now.getTime() - timer.startTime.getTime()) / 1000);
      }
      
      // Update the timer to stopped state
      const updatedTimer = await this.timerModel.findByIdAndUpdate(
        timerId,
        { 
          isRunning: false,
          elapsedTime: finalElapsedTime,
          startTime: null,
          endTime: new Date(),
          status: 'completed',
          notes: notes || timer.notes
        },
        { new: true }
      );

      return updatedTimer;
    } catch (error) {
      this.logger.error(`Error stopping timer: ${error.message}`);
      throw new InternalServerErrorException("Error stopping timer.");
    }
  }

  async getTimers(userId: mongoose.Types.ObjectId): Promise<TimerDocument[]> {
    try {
      return await this.timerModel.find({ user: userId }).sort({ createdAt: -1 });
    } catch (error) {
      this.logger.error(`Error getting timers: ${error.message}`);
      throw new InternalServerErrorException("Error getting timers.");
    }
  }
  
  async findOne(id: string): Promise<TimerDocument> {
    try {
      const timerId = new mongoose.Types.ObjectId(id);
      const timer = await this.timerModel.findById(timerId);
      
      if (!timer) {
        throw new NotFoundException("Timer not found.");
      }
      
      return timer;
    } catch (error) {
      this.logger.error(`Error finding timer: ${error.message}`);
      throw new InternalServerErrorException("Error finding timer.");
    }
  }
  
  async deleteTimer(id: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<void> {
    try {
      const timer = await this.timerModel.findOne({ _id: id, user: userId });

      if (!timer) {
        throw new NotFoundException("Timer not found or unauthorized.");
      }

      await this.timerModel.deleteOne({ _id: id });
    } catch (error) {
      this.logger.error(`Error deleting timer: ${error.message}`);
      throw new InternalServerErrorException("Error deleting timer.");
    }
  }

  async getTimerStats(userId: mongoose.Types.ObjectId): Promise<any> {
    try {
      // Get all completed timers for the user
      const completedTimers = await this.timerModel.find({ 
        user: userId,
        status: 'completed',
        endTime: { $exists: true }
      });

      // Calculate total time spent
      const totalTimeInSeconds = completedTimers.reduce((total, timer) => total + timer.elapsedTime, 0);
      
      // Format total time
      const hours = Math.floor(totalTimeInSeconds / 3600);
      const minutes = Math.floor((totalTimeInSeconds % 3600) / 60);
      const seconds = totalTimeInSeconds % 60;
      
      const totalTimeFormatted = `${hours}h ${minutes}m ${seconds}s`;
      
      return {
        totalTimeInSeconds,
        totalTimeFormatted,
        completedTimers: completedTimers.length
      };
    } catch (error) {
      this.logger.error(`Error getting timer stats: ${error.message}`);
      throw new InternalServerErrorException("Error getting timer stats.");
    }
  }
}

