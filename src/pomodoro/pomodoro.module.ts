import { Module } from "@nestjs/common";
import { PomodoroService } from "./pomodoro.service";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "src/auth/auth.module";
import { Pomodoro, PomodoroSchema } from "./entities/pomodoro.entity";
import { PomodoroGateway } from "./pomodoro.gateway";
import { PomodoroController } from "./pomodoro.controller";
import { ScheduleModule } from "@nestjs/schedule";
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Pomodoro.name, schema: PomodoroSchema },
    ]),
    ScheduleModule.forRoot(),
    AuthModule,
  ],
  controllers: [PomodoroController],
  providers: [PomodoroService, PomodoroGateway],
  exports: [PomodoroService, PomodoroGateway],
})
export class PomodoroModule {}
