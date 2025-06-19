import { Module } from '@nestjs/common';
import { HabitsService } from './habits.service';
import { HabitsController } from './habits.controller';
import { AuthModule } from 'src/auth/auth.module';
import { HabitSchema } from './entities/habit.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  controllers: [HabitsController],
  providers: [HabitsService],
  imports: [MongooseModule.forFeature([{ name: 'Habit', schema: HabitSchema }]), AuthModule],
  exports: [HabitsService],
})
export class HabitsModule {}
