import { Module } from '@nestjs/common';
import { ChecklistsService } from './checklists.service';
import { ChecklistsController } from './checklists.controller';
import { ChecklistSchema } from './entities/checklist.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [ChecklistsController],
  providers: [ChecklistsService],
  imports: [ MongooseModule.forFeature([{ name: 'Checklist', schema: ChecklistSchema }]), AuthModule],
  exports: [ChecklistsService],
})
export class ChecklistsModule {}
