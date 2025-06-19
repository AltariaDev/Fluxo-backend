import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { User } from '../entities/user.entity';
import { UsersService } from '../users.service';

@Injectable()
export class UserCleanupService {
  private readonly logger = new Logger(UserCleanupService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly usersService: UsersService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleUserCleanup() {
    const thresholdDate = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000); // 20 days ago

    const usersToDelete = await this.userModel.find({
      isDeleted: true,
      deletedAt: { $exists: true, $lte: thresholdDate } // Only get users deleted at least 20 days ago
    });

    if (usersToDelete.length === 0) {
      this.logger.log('No users to delete today');
      return;
    }

    this.logger.log(`Found ${usersToDelete.length} users to delete`);

    for (const user of usersToDelete) {
      try {
        await this.usersService.remove(new mongoose.Types.ObjectId(user._id.toString()), false);
        this.logger.log(`Successfully deleted user ${user._id}`);
      } catch (err) {
        this.logger.error(`Error deleting user ${user._id}: ${err.message}`, err.stack);
      }
    }
  }
}
