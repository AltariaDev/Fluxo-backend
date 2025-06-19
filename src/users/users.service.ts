import { UserLog } from './../user-logs/entities/user-log.entity';
import {
  BadRequestException,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
  HttpException,
} from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import mongoose, { isValidObjectId, Model } from "mongoose";
import { User, UserDocument } from "./entities/user.entity";
import { InjectModel } from "@nestjs/mongoose";
import * as argon2 from "argon2";
import * as sanitizeHtml from "sanitize-html";
import { CalendarService } from "src/calendar/calendar.service";
import { GamificationProfileService } from "src/gamification-profile/gamification-profile.service";
import { UserLogsService } from 'src/user-logs/user-logs.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EventsList } from 'src/events/list.events';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @Inject(EventEmitter2) private eventEmitter: EventEmitter2,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    try {
      createUserDto.username = sanitizeHtml(createUserDto.username);
      createUserDto.fullname = sanitizeHtml(createUserDto.fullname);
      createUserDto.email = sanitizeHtml(createUserDto.email);

      createUserDto.password = await argon2.hash(createUserDto.password);

      const user = await this.userModel.create(createUserDto);
      this.eventEmitter.emit(EventsList.USER_REGISTERED, {userId: user.id});
      // Return user without password
      return user;
    } catch (error) {
      console.error("❌ ERROR en create():", error);
      if (error.code === 11000) {
        throw new BadRequestException(
          `User already exists ${JSON.stringify(error.keyValue)}`,
        );
      }
      throw new InternalServerErrorException(
        `Error creating user - Check server logs`,
      );
    }
  }

  findAll() {
    return this.userModel.find()
  }

  async findOne(term: string) {
    let user: User | null = null;

    if (isValidObjectId(term)) {
      user = await this.userModel.findById(term)
    }

    if (!user) {
      user = await this.userModel.findOne({ email: term.trim() })
    }

    if (!user) {
      user = await this.userModel.findOne({ username: term.trim() })
    }

    return user;
  }

  async findOneByRefreshToken(refreshToken: string): Promise<User | null> {
    const user = await this.userModel.findOne({ refreshToken })
    return user ? user : null;
  }

  async validateRefreshToken(userId: mongoose.Types.ObjectId, token: string): Promise<boolean> {
    const user = await this.userModel.findById(userId)
    if (!user || !user.refreshToken) return false;
    return await argon2.verify(user.refreshToken, token);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    if (updateUserDto.updatedPassword) {
      if (!updateUserDto.password) {
        throw new BadRequestException("Password is required");
      }
      const user = await this.userModel.findById(id)
      if (!user) {
        throw new NotFoundException("User not found");
      }
      const isValid = await argon2.verify(
        user.password,
        updateUserDto.password,
      );
      if (!isValid) {
        throw new BadRequestException("Invalid password");
      }
      updateUserDto.password = await argon2.hash(updateUserDto.updatedPassword);
    }
    const user_new = await this.userModel.findByIdAndUpdate(id, updateUserDto, {
      new: true,
    })
    return user_new;
  }

  async remove(id: mongoose.Types.ObjectId, useTransaction = true) {
    if (!useTransaction) {
      try {
        const user = await this.userModel.findById(id);
        if (!isValidObjectId(id) || !user) {
          throw new BadRequestException("Invalid id or user not found");
        }
        this.logger.log(`Starting NON-TRANSACTIONAL cascade deletion for user: ${id}`);
        const {
          Task, Habit, Pomodoro, EventsCalendar, Calendar, Note, Section, Reminders, UserLog, GamificationProfile, Subscription, Dict, Avatar, Banner, Checklist, TokenBlackList, Stopwatch, Countdown,
        } = mongoose.models;
        const deleteOperations = [
          Task?.deleteMany({ userId: id }),
          Habit?.deleteMany({ userId: id }),
          Pomodoro?.deleteMany({ userId: id }),
          EventsCalendar?.deleteMany({ userId: id }),
          Calendar?.deleteMany({ user: id }),
          Note?.deleteMany({ user: id }),
          Section?.deleteMany({ userId: id }),
          Reminders?.deleteMany({ user: id }),
          UserLog?.deleteMany({ userId: id }),
          GamificationProfile?.deleteMany({ user: id }),
          Subscription?.deleteMany({ userId: id }),
          Checklist?.deleteMany({ userId: id }),
          TokenBlackList?.deleteMany({ userId: id }),
          Stopwatch?.deleteMany({ userId: id }),
          Countdown?.deleteMany({ userId: id }),
        ].filter(Boolean);
        const userSpecificOperations = [
          Avatar?.deleteMany({ userId: id }),
          Banner?.deleteMany({ userId: id }),
        ].filter(Boolean);
        const dictOperations = [
          Dict?.deleteMany({ ownerId: id }),
          Dict?.updateMany(
            { 'sharedWith.userId': id },
            { $pull: { sharedWith: { userId: id } } }
          ),
        ].filter(Boolean);
        const pomodoroSharedOperations = [
          Pomodoro?.updateMany(
            { sharedWith: id },
            { $pull: { sharedWith: id } }
          ),
        ].filter(Boolean);
        const allOperations = [
          ...deleteOperations,
          ...userSpecificOperations,
          ...dictOperations,
          ...pomodoroSharedOperations,
        ];
        this.logger.log(`Executing ${allOperations.length} cascade delete operations (no transaction)`);
        await Promise.all(allOperations);
        await this.userModel.findByIdAndDelete(id);
        this.logger.log(`Successfully cascade deleted user: ${id}`);
        this.eventEmitter.emit(EventsList.USER_DELETED, { userId: id });
        return { message: 'User and all related data successfully deleted', userId: id };
      } catch (error) {
        this.logger.error(`Error during NON-TRANSACTIONAL cascade deletion for user ${id}:`, error);
        throw new InternalServerErrorException(
          `Failed to delete user and related data: ${error.message}`
        );
      }
    }
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        const user = await this.userModel.findById(id).session(session);
        if (!isValidObjectId(id) || !user) {
          throw new BadRequestException("Invalid id or user not found");
        }

        this.logger.log(`Starting cascade deletion for user: ${id}`);

        // Get all models that need to be cleaned up
        const {
          Task,
          Habit,
          Pomodoro,
          EventsCalendar,
          Calendar,
          Note,
          Section,
          Reminders,
          UserLog,
          GamificationProfile,
          Subscription,
          Dict,
          Avatar,
          Banner,
          Checklist,
          TokenBlackList,
          Stopwatch,
          Countdown,
        } = mongoose.models;

        // Delete user-owned entities
        const deleteOperations = [
          Task?.deleteMany({ userId: id }).session(session),
          Habit?.deleteMany({ userId: id }).session(session),
          Pomodoro?.deleteMany({ userId: id }).session(session),
          EventsCalendar?.deleteMany({ userId: id }).session(session),
          Calendar?.deleteMany({ user: id }).session(session),
          Note?.deleteMany({ user: id }).session(session),
          Section?.deleteMany({ userId: id }).session(session),
          Reminders?.deleteMany({ user: id }).session(session),
          UserLog?.deleteMany({ userId: id }).session(session),
          GamificationProfile?.deleteMany({ user: id }).session(session),
          Subscription?.deleteMany({ userId: id }).session(session),
          Checklist?.deleteMany({ userId: id }).session(session),
          TokenBlackList?.deleteMany({ userId: id }).session(session),
          Stopwatch?.deleteMany({ userId: id }).session(session),
          Countdown?.deleteMany({ userId: id }).session(session),
        ].filter(Boolean);

        // Handle user-specific entities (optional userId)
        const userSpecificOperations = [
          Avatar?.deleteMany({ userId: id }).session(session),
          Banner?.deleteMany({ userId: id }).session(session),
        ].filter(Boolean);

        // Handle dictionaries - remove from ownerId and sharedWith
        const dictOperations = [
          Dict?.deleteMany({ ownerId: id }).session(session), // Delete owned dictionaries
          Dict?.updateMany(
            { 'sharedWith.userId': id },
            { $pull: { sharedWith: { userId: id } } }
          ).session(session), // Remove from shared dictionaries
        ].filter(Boolean);

        // Handle pomodoros shared with the user
        const pomodoroSharedOperations = [
          Pomodoro?.updateMany(
            { sharedWith: id },
            { $pull: { sharedWith: id } }
          ).session(session),
        ].filter(Boolean);

        // Execute all delete operations
        const allOperations = [
          ...deleteOperations,
          ...userSpecificOperations,
          ...dictOperations,
          ...pomodoroSharedOperations,
        ];

        this.logger.log(`Executing ${allOperations.length} cascade delete operations`);
        await Promise.all(allOperations);

        // Finally, delete the user
        await this.userModel.findByIdAndDelete(id).session(session);
        
        this.logger.log(`Successfully cascade deleted user: ${id}`);
        
        // Emit event for cleanup or analytics
        this.eventEmitter.emit(EventsList.USER_DELETED, { userId: id });
      });

      return { message: 'User and all related data successfully deleted', userId: id };
    } catch (error) {
      this.logger.error(`Error during cascade deletion for user ${id}:`, error);
      throw new InternalServerErrorException(
        `Failed to delete user and related data: ${error.message}`
      );
    } finally {
      await session.endSession();
    }
  }

  /**
   * Soft delete user and related data by marking as deleted
   * Preferred for GDPR compliance and data recovery
   */
  async softDelete(id: mongoose.Types.ObjectId) {
    try {
      
      if (!isValidObjectId(id)) {
        throw new BadRequestException("Invalid id or user not found");
      }
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new NotFoundException("User not found");
      }

      this.logger.log(`Starting soft deletion for user: ${id}`);

      const deletedAt = new Date();
      
      // Only mark user as deleted, related entities will be handled by cron job
      await this.userModel.findByIdAndUpdate(
        id,
        {
          isDeleted: true,
          deletedAt,
        }
      );
      
      this.logger.log(`Successfully soft deleted user: ${id}`);

      return { 
        message: 'User successfully marked for deletion', 
        userId: id,
        type: 'soft_delete',
        deletedAt
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Error during soft deletion for user ${id}:`, error);
      throw new InternalServerErrorException(
        `Failed to soft delete user: ${error.message}`
      );
    }
  }

  /**
   * Get statistics of user-related data before deletion
   * Useful for confirmation or analytics
   */
  async getUserDeletionStats(id: mongoose.Types.ObjectId) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException("Invalid user ID");
    }

    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    try {
      const {
        Task,
        Habit,
        Pomodoro,
        EventsCalendar,
        Calendar,
        Note,
        Section,
        Reminders,
        UserLog,
        GamificationProfile,
        Subscription,
        Dict,
        Avatar,
        Banner,
        Checklist,
        TokenBlackList,
        Stopwatch,
        Countdown,
      } = mongoose.models;

      const [
        tasksCount,
        habitsCount,
        pomodorosCount,
        eventsCount,
        calendarCount,
        notesCount,
        sectionsCount,
        remindersCount,
        userLogsCount,
        gamificationProfileCount,
        subscriptionsCount,
        dictsOwnedCount,
        dictsSharedCount,
        avatarsCount,
        bannersCount,
        checklistsCount,
        tokensCount,
        stopwatchCount,
        countdownCount,
        pomodorosSharedCount,
      ] = await Promise.all([
        Task?.countDocuments({ userId: id }) || 0,
        Habit?.countDocuments({ userId: id }) || 0,
        Pomodoro?.countDocuments({ userId: id }) || 0,
        EventsCalendar?.countDocuments({ userId: id }) || 0,
        Calendar?.countDocuments({ user: id }) || 0,
        Note?.countDocuments({ user: id }) || 0,
        Section?.countDocuments({ userId: id }) || 0,
        Reminders?.countDocuments({ user: id }) || 0,
        UserLog?.countDocuments({ userId: id }) || 0,
        GamificationProfile?.countDocuments({ user: id }) || 0,
        Subscription?.countDocuments({ userId: id }) || 0,
        Dict?.countDocuments({ ownerId: id }) || 0,
        Dict?.countDocuments({ 'sharedWith.userId': id }) || 0,
        Avatar?.countDocuments({ userId: id }) || 0,
        Banner?.countDocuments({ userId: id }) || 0,
        Checklist?.countDocuments({ userId: id }) || 0,
        TokenBlackList?.countDocuments({ userId: id }) || 0,
        Stopwatch?.countDocuments({ userId: id }) || 0,
        Countdown?.countDocuments({ userId: id }) || 0,
        Pomodoro?.countDocuments({ sharedWith: id }) || 0,
      ]);

      const totalEntities = 
        tasksCount + habitsCount + pomodorosCount + eventsCount + 
        calendarCount + notesCount + sectionsCount + remindersCount +
        userLogsCount + gamificationProfileCount + subscriptionsCount +
        dictsOwnedCount + avatarsCount + bannersCount + checklistsCount +
        tokensCount + stopwatchCount + countdownCount;

              return {
          user: {
            id: user._id,
            username: user.username,
            email: user.email,
            createdAt: (user as any).createdAt,
          },
        relatedData: {
          tasks: tasksCount,
          habits: habitsCount,
          pomodoros: pomodorosCount,
          events: eventsCount,
          calendar: calendarCount,
          notes: notesCount,
          sections: sectionsCount,
          reminders: remindersCount,
          userLogs: userLogsCount,
          gamificationProfile: gamificationProfileCount,
          subscriptions: subscriptionsCount,
          dictsOwned: dictsOwnedCount,
          dictsSharedWith: dictsSharedCount,
          avatars: avatarsCount,
          banners: bannersCount,
          checklists: checklistsCount,
          blacklistedTokens: tokensCount,
          stopwatches: stopwatchCount,
          countdowns: countdownCount,
          pomodorosSharedWith: pomodorosSharedCount,
        },
        summary: {
          totalOwnedEntities: totalEntities,
          totalSharedEntities: dictsSharedCount + pomodorosSharedCount,
          deletionImpact: totalEntities > 0 ? 'high' : 'low',
        }
      };
    } catch (error) {
      this.logger.error(`Error getting deletion stats for user ${id}:`, error);
      throw new InternalServerErrorException('Error retrieving user deletion statistics');
    }
  }

  async updatePassword(email: string, hashedPassword: string) {
    try {
      const user = await this.userModel.findOne({ email });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.password = hashedPassword;
      await user.save();
      
      return { message: 'Password updated successfully' };
    } catch (error) {
      this.logger.error(`Failed to update password: ${error.message}`);
      throw error;
    }
  }
}