import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Timer, TimerSchema } from "./entities/timer.entity";
import { TimerService } from "./timer.service";
import { TimerController } from "./timer.controller";
import { AuthModule } from "src/auth/auth.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Timer.name, schema: TimerSchema }]),
    AuthModule
  ],
  controllers: [TimerController],
  providers: [TimerService],
  exports: [TimerService],
})
export class TimerModule {}
