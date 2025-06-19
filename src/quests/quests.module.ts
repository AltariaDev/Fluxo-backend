import { Module } from '@nestjs/common';
import { QuestsService } from './quests.service';
import { QuestsController } from './quests.controller';
import { Mongoose } from 'mongoose';
import { MongooseModule } from '@nestjs/mongoose';
import { Quest, QuestSchema } from './entities/quest.entity';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [QuestsController],
  providers: [QuestsService],
  imports:[MongooseModule.forFeature([{name: Quest.name, schema: QuestSchema}]), AuthModule],
  exports: [QuestsService]
})
export class QuestsModule {}
