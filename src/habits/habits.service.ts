import { Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import mongoose, { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Habit, HabitDocument } from './entities/habit.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventsList } from '../events/list.events';

@Injectable()
export class HabitsService {

  constructor(
    @InjectModel(Habit.name) private habitModel: Model<HabitDocument>,
    private eventEmitter: EventEmitter2
  ){}

  async create(createHabitDto: CreateHabitDto, userId: mongoose.Types.ObjectId): Promise<HabitDocument> { 
    try {
      const habit = await this.habitModel.create({
        ...createHabitDto,
        userId,
        streak: 0,
        bestStreak: 0,
      });
      this.eventEmitter.emit(EventsList.HABIT_CREATED, {userId: userId, habitId: habit._id});
      return await habit.populate('userId');
    } catch (error) {
      throw new InternalServerErrorException('Error creating habit');
    }
  }

  async findAll(userId: mongoose.Types.ObjectId): Promise<HabitDocument[]> {
    try {
      return await this.habitModel.find({userId: userId});
    } catch (error) {
      throw new InternalServerErrorException('Error getting habits');
    }
  }

  async findOne(id: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<HabitDocument> {
    try {
      const habit = await this.habitModel.findById(id);
      if (!habit) throw new NotFoundException('Habit not found');
      if (!habit.userId.equals(userId)) throw new UnauthorizedException('Unauthorized access');
      return habit;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error getting habit');
    }
  }

  private checkStreak(frequency: string, lastCompletedDate: Date, completedDate: Date): boolean {
    if (!lastCompletedDate) return true;
    
    // Ensure we're working with Date objects
    const lastDate = new Date(lastCompletedDate);
    const normalizedLastDate = new Date(lastDate.getFullYear(), lastDate.getMonth(), lastDate.getDate());
    const currentDate = new Date(completedDate);
    const normalizedCurrentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    // Calculate the difference in milliseconds
   const diffMs = Math.round(normalizedCurrentDate.getTime() - normalizedLastDate.getTime());
    
    if (frequency === 'daily') {
      // For daily habits, check if the difference is between 1 and 2 days
      // This allows for some flexibility in completion time
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      console.log("diffDays", diffDays);
      return diffDays === 1;
    } 
    // else if (frequency === 'weekly') {
    //   // For weekly habits, check if the difference is between 7 and 14 days
    //   const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    //   return diffDays >= 7 && diffDays < 14;
    // } 
    // else if (frequency === 'monthly') {
    //   // For monthly habits, check if the difference is between 28 and 31 days
    //   // This accounts for different month lengths
    //   const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    //   return diffDays >= 28 && diffDays < 31;
    // }
    
    return false;
  }

  private getWeekNumber(date: Date): number {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / (1000 * 60 * 60 * 24);
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  async update(id: mongoose.Types.ObjectId, updateHabitDto: UpdateHabitDto, userId: mongoose.Types.ObjectId): Promise<HabitDocument> {
    try {
      const habit = await this.habitModel.findById(id);
      if (!habit) throw new NotFoundException('Habit not found');
      if (!habit.userId.equals(userId)) throw new UnauthorizedException('Unauthorized access');
      
      const now = new Date();
      let updatedHabit: HabitDocument;
      
      // Handle status change
      if (updateHabitDto.status !== undefined && updateHabitDto.status !== habit.status) {
        // Marking habit as completed
        
        if (updateHabitDto.status === true && habit.status === false) {
          // Check if streak should be incremented
          this.eventEmitter.emit(EventsList.HABIT_COMPLETED, {userId: userId, habitId: habit._id});
          const shouldIncrementStreak = this.checkStreak(habit.frequency, habit.lastCompletedDate, now);
          const newStreak = shouldIncrementStreak ? habit.streak + 1 : 1;
          
          updatedHabit = await this.habitModel.findByIdAndUpdate(
            id,
            {
              $set: {
                ...updateHabitDto,
                streak: newStreak,
                lastCompletedDate: now,
                bestStreak: Math.max(newStreak, habit.bestStreak || 0)
              },
              $addToSet: { completedDates: now }
            },
            { new: true }
          );
        } 
        // Marking habit as incomplete
        else if (updateHabitDto.status === false && habit.status === true) {
          updatedHabit = await this.habitModel.findByIdAndUpdate(
            id,
            {
              $set: {
                ...updateHabitDto,
                streak: Math.max(0, habit.streak - 1)
              },
              $pull: { completedDates: now }
            },
            { new: true }
          );
        }
      } 
      // Just updating other properties without changing status
      else {
        updatedHabit = await this.habitModel.findByIdAndUpdate(
          id,
          { $set: updateHabitDto },
          { new: true }
        );
      }
      
      return await updatedHabit.populate('userId');
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error updating habit');
    }
  }

  async addCompleteDate(id: mongoose.Types.ObjectId, date: Date, userId: mongoose.Types.ObjectId): Promise<HabitDocument> {
    try {
      const habit = await this.habitModel.findById(id);
      if (!habit) throw new NotFoundException('Habit not found');
      if (!habit.userId.equals(userId)) throw new UnauthorizedException('Unauthorized access');
      
      habit.completedDates.push(date);
      return await habit.save();
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error adding completed date');
    }
  }

  async remove(id: mongoose.Types.ObjectId, userId: mongoose.Types.ObjectId): Promise<HabitDocument> {
    try {
      const habit = await this.habitModel.findById(id);
      if (!habit) throw new NotFoundException('Habit not found');
      if (!habit.userId.equals(userId)) throw new UnauthorizedException('Unauthorized access');
      this.eventEmitter.emit(EventsList.HABIT_DELETED, {userId: userId, habitId: habit._id});
      return await this.habitModel.findByIdAndDelete(id);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      throw new InternalServerErrorException('Error deleting habit');
    }
  }

  async checkHabits(userId: mongoose.Types.ObjectId) {
    try {
      const habits = await this.habitModel.find({ userId });
      const today = new Date();
      
      for (const habit of habits) {
        // Skip if habit was completed today
        if (habit.lastCompletedDate && 
            habit.lastCompletedDate.toDateString() === today.toDateString()) {
          continue;
        }

        // Check frequency and reset if needed
        switch (habit.frequency) {
          case 'daily':
            // Reset if not completed today
            await this.habitModel.findByIdAndUpdate(habit._id, {
              $set: { status: false }
            });
            break;

          case 'weekly':
            // Reset if last completion was in a different week
            if (habit.lastCompletedDate && 
                this.getWeekNumber(habit.lastCompletedDate) !== this.getWeekNumber(today)) {
              await this.habitModel.findByIdAndUpdate(habit._id, {
                $set: { status: false }
              });
            }
            break;

          case 'monthly':
            // Reset if last completion was in a different month
            if (habit.lastCompletedDate && 
                (habit.lastCompletedDate.getMonth() !== today.getMonth() || 
                 habit.lastCompletedDate.getFullYear() !== today.getFullYear())) {
              await this.habitModel.findByIdAndUpdate(habit._id, {
                $set: { status: false }
              });
            }
            break;
        }
      }
      return habits;
    } catch (error) {
      throw new InternalServerErrorException('Error checking habits');
    }
  }
}
