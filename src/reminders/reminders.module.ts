import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { RemindersService } from "./reminders.service";
import { RemindersController } from "./reminders.controller";
import { Reminders, RemindersSchema } from "./entities/reminders.entity";
import { AuthModule } from "src/auth/auth.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Reminders.name, schema: RemindersSchema },
    ]),
    AuthModule,
  ],
  controllers: [RemindersController],
  providers: [RemindersService],
  exports: [RemindersService],
})
export class RemindersModule {}
