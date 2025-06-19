import { forwardRef, Module } from "@nestjs/common";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { MongooseModule } from "@nestjs/mongoose";
import { User, UserSchema } from "./entities/user.entity";
import { AuthModule } from "src/auth/auth.module";
import { GamificationProfileModule } from "src/gamification-profile/gamification-profile.module";
import { UserLogsModule } from "src/user-logs/user-logs.module";
import { ScheduleModule } from "@nestjs/schedule";
import { UserCleanupService } from "./cleanup/user-cleanup-service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), forwardRef(() => AuthModule), ScheduleModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, UserCleanupService],
  exports: [UsersService],
})
export class UsersModule {}