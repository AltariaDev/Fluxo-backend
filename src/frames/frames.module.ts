import { Module } from '@nestjs/common';
import { FramesService } from './frames.service';
import { Frame, FrameSchema } from './entities/frame.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { FramesController } from './frames.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [FramesController],
  exports: [FramesService],
  imports: [MongooseModule.forFeature([{ name: Frame.name, schema: FrameSchema }]), AuthModule],
  providers: [FramesService],
})
export class FramesModule {}
