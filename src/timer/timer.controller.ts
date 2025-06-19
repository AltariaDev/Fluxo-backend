import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Body,
  Param,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { TimerService } from "./timer.service";
import { StartTimerDto, UpdateTimerDto } from "./dto/index";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { GetUser } from "src/users/decorators/get-user.decorator";
import { User } from "src/users/entities/user.entity";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from "@nestjs/swagger";
import { ParseMongoIdPipe } from "src/common/pipes/parse-mongo-id.pipe";
import mongoose from "mongoose";

@ApiTags("Timers")
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true}))
@UseGuards(JwtAuthGuard)
@Controller("timers")
export class TimerController {
  constructor(private readonly timerService: TimerService) {}

  @Post("start")
  @ApiOperation({ summary: "Start a new timer" })
  @ApiResponse({ status: 201, description: "Timer started successfully" })
  startTimer(@Body() startTimerDto: StartTimerDto, @GetUser() user: User) {
    return this.timerService.startTimer(startTimerDto, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Pause, resume or stop a timer" })
  @ApiResponse({ status: 200, description: "Timer updated successfully" })
  updateTimer(@Param("id", ParseMongoIdPipe) id: mongoose.Types.ObjectId, @Body() updateTimerDto: UpdateTimerDto, @GetUser() user: User) {
    return this.timerService.updateTimer(id, updateTimerDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: "Get all user timers" })
  @ApiResponse({
    status: 200,
    description: "List of timers retrieved successfully",
  })
  getTimers(@GetUser() user: User) {
    return this.timerService.getTimers(user.id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a timer" })
  @ApiResponse({ status: 200, description: "Timer deleted successfully" })
  @ApiResponse({
    status: 401,
    description: "Forbidden: You cannot delete this timer",
  }) 
  deleteTimer(@Param("id", ParseMongoIdPipe) id: mongoose.Types.ObjectId, @GetUser() user: User) {
    return this.timerService.deleteTimer(id, user.id);
  }
}
